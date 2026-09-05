import { GoogleGenAI } from '@google/genai';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import { createRazorpayPaymentLink, razorpayInstance } from './razorpayService.js';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let aiClient = null;
if (GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log('RevivePay AI: Gemini SDK initialized.');
  } catch (err) {
    console.warn('RevivePay AI: Failed to initialize Gemini SDK client:', err.message);
  }
} else {
  console.log('RevivePay AI: GEMINI_API_KEY not set in server/.env. Rule-based safety fallback active.');
}

/**
 * Tool Declarations for Gemini Function Calling
 */
const REVIVEPAY_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'retryPayment',
        description: 'Recommend that the customer attempts payment retry via standard checkout for temporary network/bank authorization issues.',
        parameters: {
          type: 'OBJECT',
          properties: {
            reason: {
              type: 'STRING',
              description: 'Technical explanation of why retry is the best action (e.g. temporary bank gateway timeout)'
            },
            customerAdvice: {
              type: 'STRING',
              description: 'Friendly, reassuring 1-sentence message for the customer explaining why retry will work'
            }
          },
          required: ['reason', 'customerAdvice']
        }
      },
      {
        name: 'suggestPaymentLink',
        description: 'Recommend asking the customer if they would like to generate a direct, secure Razorpay Payment Link / UPI QR code to complete this purchase without gateway interruptions.',
        parameters: {
          type: 'OBJECT',
          properties: {
            reason: {
              type: 'STRING',
              description: 'Reason why direct payment link is recommended (e.g. recurring gateway timeouts or mobile checkout)'
            },
            userPromptMessage: {
              type: 'STRING',
              description: 'Friendly prompt asking the customer if they would like a direct Razorpay payment link generated'
            }
          },
          required: ['reason', 'userPromptMessage']
        }
      },
      {
        name: 'sendRecoveryNotification',
        description: 'Provide clear, non-technical instructions to the customer regarding why the payment failed and what step to take next.',
        parameters: {
          type: 'OBJECT',
          properties: {
            notificationMessage: {
              type: 'STRING',
              description: 'Clear, polite customer-facing notification message'
            },
            recommendedStep: {
              type: 'STRING',
              description: 'The specific recovery action recommended'
            }
          },
          required: ['notificationMessage', 'recommendedStep']
        }
      },
      {
        name: 'escalateRecoveryCase',
        description: 'Escalate the recovery case when recovery attempts exceed limits (>=3), bank rejection is permanent, or payment cannot safely proceed automatically.',
        parameters: {
          type: 'OBJECT',
          properties: {
            reason: {
              type: 'STRING',
              description: 'Reason for escalating to human support / alternative payment options'
            },
            escalationSummary: {
              type: 'STRING',
              description: 'Concise summary of failure pattern for store management'
            }
          },
          required: ['reason', 'escalationSummary']
        }
      }
    ]
  }
];

const SYSTEM_INSTRUCTIONS = `You are RevivePay, an autonomous AI Revenue Recovery Agent operating inside NexVolt (an electronics e-commerce platform in India).
Your sole purpose is to analyze Razorpay payment failures and select the single safest, most effective recovery action to help the customer complete their electronics order without changing the price.

CRITICAL GUARDRAILS & RULES:
1. STRICTLY NO DISCOUNTS. You must NEVER offer discounts, coupons, margin adjustments, or alter the order total.
2. NEVER debit or refund accounts directly.
3. Choose exactly ONE appropriate tool call from:
   - retryPayment: Use for initial or temporary bank timeouts/network hiccups.
   - suggestPaymentLink: Use when gateway keeps failing, card validation repeatedly times out, or customer would benefit from a direct UPI / Razorpay payment link. (Note: The user will be asked for approval in UI before actual link generation).
   - sendRecoveryNotification: Use to send clear guidance or instructions.
   - escalateRecoveryCase: Use when recovery attempts are >= 3, or if the failure is unrecoverable.
4. Keep customer-facing messages polite, professional, concise, and non-technical. Do not expose internal error codes or technical stack traces to the customer.`;

/**
 * Deterministic Safety Fallback Rule-Engine
 */
function evaluateRuleBasedFallback(order, attemptNumber) {
  const failureReason = (order.failureReason || order.razorpayFailureData?.description || '').toLowerCase();
  const errorCode = (order.razorpayFailureData?.code || '').toLowerCase();

  if (attemptNumber >= 3) {
    return {
      decision: 'escalate',
      tool: 'escalateRecoveryCase',
      reason: 'Maximum automatic recovery limit (3 attempts) reached. Case escalated to store support.',
      customerMessage: 'We noticed multiple payment interruptions for this order. Our team is available to assist you, or you may try using another card or Pay on Delivery.',
      promptUserForLink: false,
      escalationSummary: `Failed after ${attemptNumber} attempts: ${failureReason || 'Payment failed'}`
    };
  }

  if (failureReason.includes('closed') || failureReason.includes('dismissed') || failureReason.includes('cancelled')) {
    return {
      decision: 'retry_payment',
      tool: 'retryPayment',
      reason: 'Payment window was closed before completion. Direct 1-click retry is recommended.',
      customerMessage: 'Your payment session was paused. You can instantly resume and complete your order with 1-click retry.',
      promptUserForLink: false
    };
  }

  if (failureReason.includes('timeout') || errorCode.includes('gateway_error') || failureReason.includes('network') || attemptNumber === 1) {
    return {
      decision: 'retry_payment',
      tool: 'retryPayment',
      reason: 'Temporary bank gateway timeout detected on first attempt. Direct retry recommended.',
      customerMessage: 'The bank gateway experienced a momentary timeout. No amount was deducted. Please try your payment again.',
      promptUserForLink: false
    };
  }

  // If 2nd attempt failed or card declined, suggest Payment Link (with user prompt)
  return {
    decision: 'suggest_payment_link',
    tool: 'suggestPaymentLink',
    reason: 'Repeated checkout interruption detected. Direct Razorpay Payment Link/UPI QR suggested for seamless completion.',
    customerMessage: 'Your bank payment encountered an issue. Would you like a direct, secure Razorpay Payment Link / UPI QR code to complete this purchase?',
    promptUserForLink: true
  };
}

/**
 * Main RevivePay Agent Analysis Function
 * @param {string} orderId - NexVolt Order ID
 * @returns {Promise<Object>}
 */
export async function analyzeRecoveryCase(orderId, { forceReanalysis = false } = {}) {
  const order = await Order.findOne({ orderId });
  if (!order) {
    return {
      success: false,
      notFound: true,
      message: `Order #${orderId} not found.`
    };
  }

  // Guardrail 1: Already Paid Guardrail
  if (order.paymentStatus === 'paid') {
    return {
      success: true,
      alreadyPaid: true,
      message: 'Order is already marked as paid. Recovery aborted.',
      order
    };
  }

  // Idempotency: If this order was already analyzed for its current failure and we are not forcing reanalysis, return cached case
  const hasExistingAction = Boolean(order.revivePayCase?.lastRecommendedAction && order.revivePayCase?.decisionLogs?.length > 0);
  if (!forceReanalysis && hasExistingAction) {
    return {
      success: true,
      orderId: order.orderId,
      recoveryCase: order.revivePayCase,
      decision: {
        decision: order.revivePayCase.lastRecommendedAction,
        tool: order.revivePayCase.decisionLogs[order.revivePayCase.decisionLogs.length - 1]?.tool,
        reason: order.revivePayCase.agentReasoning,
        customerMessage: order.revivePayCase.customerMessage,
        promptUserForLink: order.revivePayCase.promptUserForLink
      },
      cached: true
    };
  }

  // Guardrail 2: Increment Attempt Counter (capped at 3)
  const currentAttempts = Math.min(3, (order.revivePayCase?.recoveryAttempts || 0) + 1);

  // Build Safe Context Payload for Gemini
  const safeContext = {
    orderId: order.orderId,
    customerName: order.customerDetails?.name || 'Customer',
    customerEmail: order.customerDetails?.email || '',
    orderAmount: order.totalAmount,
    currency: order.currency || 'INR',
    itemsCount: order.items?.length || 0,
    items: order.items?.map(i => ({ title: i.title, price: i.price, quantity: i.quantity })),
    paymentMethod: order.paymentMethod,
    razorpayOrderId: order.razorpayOrderId || '',
    failureReason: order.failureReason || 'Payment authorization interrupted',
    razorpayErrorCode: order.razorpayFailureData?.code || '',
    razorpayErrorDescription: order.razorpayFailureData?.description || '',
    razorpayErrorSource: order.razorpayFailureData?.source || '',
    razorpayErrorStep: order.razorpayFailureData?.step || '',
    recoveryAttemptNumber: currentAttempts,
    maxAllowedAttempts: 3
  };

  let agentDecision = null;

  // If Gemini API is available and attempts < 3, invoke Gemini Function Calling
  if (aiClient && currentAttempts <= 3) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Payment Failure Context:\n${JSON.stringify(safeContext, null, 2)}\n\nAnalyze this failure and select the single best recovery tool.`
              }
            ]
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTIONS,
          tools: REVIVEPAY_TOOLS,
          temperature: 0.2
        }
      });

      let functionCalls = [];
      if (Array.isArray(response.functionCalls)) {
        functionCalls = response.functionCalls;
      } else if (typeof response.functionCalls === 'function') {
        functionCalls = response.functionCalls();
      } else if (response.candidates?.[0]?.content?.parts) {
        functionCalls = response.candidates[0].content.parts
          .filter(p => p.functionCall)
          .map(p => p.functionCall);
      }

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const toolName = call.name;
        const args = call.args || {};

        switch (toolName) {
          case 'retryPayment':
            agentDecision = {
              decision: 'retry_payment',
              tool: 'retryPayment',
              reason: args.reason || 'Payment retry recommended based on failure analysis.',
              customerMessage: args.customerAdvice || 'The bank gateway experienced a temporary timeout. Please try your payment again.',
              promptUserForLink: false,
              toolParameters: args
            };
            break;

          case 'suggestPaymentLink':
            agentDecision = {
              decision: 'suggest_payment_link',
              tool: 'suggestPaymentLink',
              reason: args.reason || 'Direct Razorpay payment link suggested for reliable checkout.',
              customerMessage: args.userPromptMessage || 'Your bank payment encountered an issue. Would you like a direct, secure Razorpay Payment Link / UPI QR code to complete this purchase?',
              promptUserForLink: true,
              toolParameters: args
            };
            break;

          case 'sendRecoveryNotification':
            agentDecision = {
              decision: 'notify_customer',
              tool: 'sendRecoveryNotification',
              reason: args.recommendedStep || 'Customer guidance notification dispatched.',
              customerMessage: args.notificationMessage || 'Your payment was not completed. Please review your order details and retry when ready.',
              promptUserForLink: false,
              toolParameters: args
            };
            break;

          case 'escalateRecoveryCase':
            agentDecision = {
              decision: 'escalate',
              tool: 'escalateRecoveryCase',
              reason: args.reason || 'Recovery limits reached or permanent failure.',
              customerMessage: 'We noticed multiple payment interruptions. Our customer support is available to assist you, or you may choose Pay on Delivery.',
              promptUserForLink: false,
              escalationSummary: args.escalationSummary || 'Escalated by RevivePay Agent',
              toolParameters: args
            };
            break;

          default:
            agentDecision = evaluateRuleBasedFallback(order, currentAttempts);
        }
      } else {
        agentDecision = evaluateRuleBasedFallback(order, currentAttempts);
      }
    } catch (geminiError) {
      console.warn('RevivePay: Gemini call failed, falling back to deterministic safety rules:', geminiError.message);
      agentDecision = evaluateRuleBasedFallback(order, currentAttempts);
    }
  } else {
    agentDecision = evaluateRuleBasedFallback(order, currentAttempts);
  }

  // Update Order with RevivePay Case Data
  order.revivePayCase.status = agentDecision.decision === 'escalate' ? 'escalated' : 'action_recommended';
  order.revivePayCase.recoveryAttempts = currentAttempts;
  order.revivePayCase.lastRecommendedAction = agentDecision.decision;
  order.revivePayCase.agentReasoning = agentDecision.reason;
  order.revivePayCase.customerMessage = agentDecision.customerMessage;
  order.revivePayCase.promptUserForLink = Boolean(agentDecision.promptUserForLink);
  if (agentDecision.escalationSummary) {
    order.revivePayCase.escalationReason = agentDecision.escalationSummary;
  }

  // Append to Structured Decision Logs (No chain of thought, concise explanation)
  order.revivePayCase.decisionLogs.push({
    timestamp: new Date(),
    decision: agentDecision.decision,
    reason: agentDecision.reason,
    tool: agentDecision.tool,
    toolParameters: agentDecision.toolParameters || {},
    result: agentDecision.decision === 'escalate' ? 'escalated' : 'success',
    attemptNumber: currentAttempts
  });

  await order.save();

  return {
    success: true,
    orderId: order.orderId,
    recoveryCase: order.revivePayCase,
    decision: agentDecision
  };
}

/**
 * Executes Payment Link Generation upon explicit Customer Approval
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export async function executeGeneratePaymentLink(orderId) {
  const order = await Order.findOne({ orderId });
  if (!order) {
    return {
      success: false,
      notFound: true,
      message: `Order #${orderId} not found.`
    };
  }

  if (order.paymentStatus === 'paid') {
    return {
      success: true,
      alreadyPaid: true,
      message: 'Order is already marked as paid.',
      order
    };
  }

  // Reuse existing valid payment link if already generated
  if (order.revivePayCase?.razorpayPaymentLinkId && order.revivePayCase?.razorpayPaymentLinkUrl) {
    return {
      success: true,
      paymentLinkId: order.revivePayCase.razorpayPaymentLinkId,
      shortUrl: order.revivePayCase.razorpayPaymentLinkUrl,
      reused: true
    };
  }

  // Create real Razorpay Payment Link
  const paymentLink = await createRazorpayPaymentLink({
    amountInRupees: order.totalAmount,
    orderId: order.orderId,
    customerDetails: order.customerDetails,
    description: `RevivePay Recovery for Order #${order.orderId}`
  });

  order.revivePayCase.status = 'link_generated';
  order.revivePayCase.razorpayPaymentLinkId = paymentLink.id;
  order.revivePayCase.razorpayPaymentLinkUrl = paymentLink.short_url;
  order.revivePayCase.razorpayPaymentLinkStatus = paymentLink.status;

  order.revivePayCase.decisionLogs.push({
    timestamp: new Date(),
    decision: 'payment_link_created',
    reason: `User approved generation of Razorpay Payment Link (${paymentLink.short_url})`,
    tool: 'createPaymentLink',
    toolParameters: { paymentLinkId: paymentLink.id, shortUrl: paymentLink.short_url },
    result: 'success',
    attemptNumber: order.revivePayCase.recoveryAttempts
  });

  await order.save();

  return {
    success: true,
    paymentLinkId: paymentLink.id,
    shortUrl: paymentLink.short_url,
    amount: paymentLink.amount,
    currency: paymentLink.currency
  };
}

/**
 * Synchronizes external Razorpay Payment Link status directly with Razorpay API
 * Allows reliable payment confirmation on localhost without requiring webhook tunnels
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export async function syncPaymentLinkStatus(orderId) {
  const order = await Order.findOne({ orderId });
  if (!order) {
    return { success: false, notFound: true, message: `Order #${orderId} not found.` };
  }

  // Idempotency: If already marked paid, return success immediately
  if (order.paymentStatus === 'paid') {
    return { success: true, paid: true, order };
  }

  const linkId = order.revivePayCase?.razorpayPaymentLinkId;
  if (!linkId) {
    return { success: true, paid: false, message: 'No payment link associated with this order.', order };
  }

  if (!razorpayInstance) {
    return { success: false, message: 'Razorpay SDK instance not configured.' };
  }

  try {
    const paymentLink = await razorpayInstance.paymentLink.fetch(linkId);
    if (paymentLink && paymentLink.status === 'paid') {
      order.paymentStatus = 'paid';
      order.checkoutStatus = 'recovered';
      order.failureReason = '';
      order.abandonedAt = null;
      if (order.recoveryMetadata) {
        order.recoveryMetadata.isRecovered = true;
      }
      order.merchantNotified = true;

      const latestPaymentId = paymentLink.payments?.[0]?.payment_id || `pay_${linkId}`;
      order.paymentId = latestPaymentId;
      order.razorpayPaymentId = latestPaymentId;

      if (order.revivePayCase) {
        order.revivePayCase.status = 'recovered';
        order.revivePayCase.recoveredAt = new Date();
        order.revivePayCase.recoveredAmount = order.totalAmount;
        order.revivePayCase.razorpayPaymentLinkStatus = 'paid';
        order.revivePayCase.decisionLogs.push({
          timestamp: new Date(),
          decision: 'payment_link_completed',
          reason: 'Customer successfully paid via Razorpay Recovery Payment Link (confirmed via Razorpay API sync)',
          tool: 'createPaymentLink',
          result: 'recovered',
          attemptNumber: order.revivePayCase.recoveryAttempts || 1
        });
      }

      await order.save();

      // Clear user cart
      await Cart.findOneAndUpdate(
        { userId: order.userId },
        { items: [], couponApplied: { code: '', discountPercent: 0 } }
      );

      console.log(`RevivePay API Sync: Verified and marked Order #${order.orderId} as RECOVERED.`);
      return { success: true, paid: true, verified: true, order };
    }

    return {
      success: true,
      paid: false,
      linkStatus: paymentLink.status,
      order
    };
  } catch (err) {
    console.error('Error syncing Razorpay payment link:', err);
    return { success: false, message: err.message };
  }
}

