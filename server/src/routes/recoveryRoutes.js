import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import {
  analyzeRecoveryCase,
  executeGeneratePaymentLink,
  syncPaymentLinkStatus,
  syncAllPendingPaymentLinks
} from '../services/recoveryAgentService.js';

const router = express.Router();

// POST /api/recovery/simulate-scenario - Interactive Judge Sandbox simulator
router.post('/simulate-scenario', async (req, res) => {
  try {
    const { scenario = 'bank_timeout', orderId } = req.body || {};

    let order = null;
    if (orderId) {
      order = await Order.findOne({ orderId });
    }

    if (!order) {
      // Find latest pending/abandoned order or create a realistic electronics demo order
      order = await Order.findOne({}).sort({ createdAt: -1 });
      if (!order) {
        order = new Order({
          orderId: 'NV-SIM-' + Math.floor(100000 + Math.random() * 900000),
          userId: 'judge_sandbox_user',
          customerDetails: {
            name: 'Priya Sharma (Judge Sandbox)',
            email: 'priya.sharma@example.com',
            phone: '9876543210',
            address: {
              street: '402 Cyber Heights, Indiranagar',
              city: 'Bengaluru',
              state: 'Karnataka',
              pincode: '560038',
              country: 'India'
            }
          },
          items: [{
            product: new mongoose.Types.ObjectId(),
            title: 'Sony WH-1000XM5 Noise-Cancelling Headphones',
            thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80',
            price: 29990,
            quantity: 1
          }],
          subtotal: 25415,
          tax: 4575,
          shipping: 0,
          discountAmount: 0,
          totalAmount: 29990,
          currency: 'INR',
          paymentMethod: 'Razorpay',
          paymentStatus: 'pending',
          checkoutStatus: 'initiated'
        });
        await order.save();
      }
    }

    if (scenario === 'simulate_recovery') {
      order.paymentStatus = 'paid';
      order.checkoutStatus = 'recovered';
      order.failureReason = '';
      order.paymentId = 'pay_sim_' + Date.now();
      order.razorpayPaymentId = order.paymentId;
      if (order.recoveryMetadata) order.recoveryMetadata.isRecovered = true;
      order.merchantNotified = true;
      if (!order.revivePayCase) order.revivePayCase = {};
      order.revivePayCase.status = 'recovered';
      order.revivePayCase.recoveredAt = new Date();
      order.revivePayCase.recoveredAmount = order.totalAmount;
      if (!order.revivePayCase.decisionLogs) order.revivePayCase.decisionLogs = [];
      order.revivePayCase.decisionLogs.push({
        timestamp: new Date(),
        decision: 'payment_verified_recovered',
        reason: 'Payment successfully completed and verified via Razorpay Recovery intervention',
        tool: 'retryPayment',
        result: 'recovered',
        attemptNumber: order.revivePayCase.recoveryAttempts || 1
      });
      await order.save();
      return res.json({
        success: true,
        scenario,
        orderId: order.orderId,
        order,
        decision: {
          decision: 'recovered',
          reason: 'Revenue successfully recovered at 100% full order value (₹0 discounts)',
          customerMessage: 'Payment confirmed! Thank you for your purchase.'
        }
      });
    }

    let failureReason = '';
    let code = '';
    let source = '';
    let step = '';
    let description = '';
    let targetAttempts = 1;

    switch (scenario) {
      case 'popup_blocked':
        failureReason = 'Customer mobile browser blocked Razorpay 3DS popup window';
        code = 'BAD_REQUEST_ERROR';
        source = 'customer';
        step = 'payment_initiation';
        description = 'Mobile browser blocked popup window. Customer prompted for secure direct payment link.';
        targetAttempts = 2;
        break;

      case 'hard_decline_escalate':
        failureReason = 'Card issuer declined authorization repeatedly (Limit exceeded or blocked)';
        code = 'PAYMENT_RISK_CHECK_FAILED';
        source = 'bank';
        step = 'payment_authorization';
        description = 'Card issuer hard decline. Maximum safe automated attempts (3/3) reached.';
        targetAttempts = 3;
        break;

      case 'bank_timeout':
      default:
        failureReason = 'Bank gateway timeout during OTP 3DS authentication';
        code = 'GATEWAY_ERROR';
        source = 'gateway';
        step = 'payment_authorization';
        description = 'Intermittent bank switch timeout during OTP verification step.';
        targetAttempts = 1;
        break;
    }

    order.paymentStatus = 'failed';
    order.failureReason = failureReason;
    order.checkoutStatus = 'abandoned';
    order.abandonedAt = new Date();
    order.razorpayFailureData = {
      code,
      description,
      source,
      step,
      reason: failureReason,
      failedAt: new Date()
    };
    if (!order.revivePayCase) order.revivePayCase = {};
    order.revivePayCase.recoveryAttempts = Math.max(0, targetAttempts - 1);
    await order.save();

    const analysis = await analyzeRecoveryCase(order.orderId, { forceReanalysis: true });

    // For popup_blocked scenario, proactively generate the payment link so judge sees link ready
    if (scenario === 'popup_blocked') {
      try {
        await executeGeneratePaymentLink(order.orderId);
      } catch (linkErr) {
        console.warn('Sandbox link pre-creation notice:', linkErr.message);
      }
    }

    const updatedOrder = await Order.findOne({ orderId: order.orderId });

    res.json({
      success: true,
      scenario,
      orderId: updatedOrder.orderId,
      order: updatedOrder,
      decision: analysis.decision
    });
  } catch (error) {
    console.error('Error in sandbox simulation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/recovery/analyze/:orderId - Trigger RevivePay AI Failure Analysis
router.post('/analyze/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { forceReanalysis = false } = req.body || {};
    const result = await analyzeRecoveryCase(orderId, { forceReanalysis });
    if (result.notFound) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error analyzing recovery case with RevivePay:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/recovery/generate-link/:orderId - User-Approved Payment Link Generation
router.post('/generate-link/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await executeGeneratePaymentLink(orderId);
    if (result.notFound) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error generating RevivePay payment link:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/recovery/sync-link/:orderId - Verify & Sync Razorpay Payment Link Status (Localhost & Webhook Fallback)
router.get('/sync-link/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await syncPaymentLinkStatus(orderId);
    if (result.notFound) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error syncing payment link status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/recovery/sync-all - Synchronize all pending Razorpay payment links across the store
router.post('/sync-all', async (req, res) => {
  try {
    const recovered = await syncAllPendingPaymentLinks();
    res.json({ success: true, count: recovered.length, recovered });
  } catch (error) {
    console.error('Error syncing all payment links:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/recovery/analytics - RevivePay Telemetry & Recovery Dashboard Metrics
router.get('/analytics', async (req, res) => {
  try {
    // Proactively sync all pending payment links with Razorpay before computing metrics
    await syncAllPendingPaymentLinks();

    const allOrders = await Order.find({}).sort({ createdAt: -1 });

    let totalRevenueAtRisk = 0;
    let totalRevenueRecovered = 0;
    let activeCasesCount = 0;
    let successfulRecoveriesCount = 0;
    let failedAttemptsCount = 0;

    const timeline = [];

    allOrders.forEach(order => {
      const isPaid = order.paymentStatus === 'paid';
      const isRecovered = order.checkoutStatus === 'recovered' || order.revivePayCase?.status === 'recovered' || order.recoveryMetadata?.isRecovered;
      const isRevivePayIntervened = (order.revivePayCase?.recoveryAttempts || 0) > 0 || (order.revivePayCase?.decisionLogs?.length || 0) > 0 || Boolean(order.razorpayFailureData?.code);
      const isPaymentFailed = order.paymentStatus === 'failed';

      if (isRecovered) {
        totalRevenueRecovered += order.totalAmount || 0;
        successfulRecoveriesCount += 1;
      } else if ((isPaymentFailed || isRevivePayIntervened) && !isPaid) {
        // Only count actual payment failures / RevivePay intervened cases as Revenue at Risk
        totalRevenueAtRisk += order.totalAmount || 0;
        activeCasesCount += 1;
      }

      if (order.revivePayCase?.decisionLogs && order.revivePayCase.decisionLogs.length > 0) {
        order.revivePayCase.decisionLogs.forEach(log => {
          const isRecoverySuccess = log.result === 'recovered' || log.decision === 'payment_verified_recovered' || log.decision === 'link_paid';
          timeline.push({
            orderId: order.orderId,
            customerName: order.customerDetails?.name || 'Customer',
            customerEmail: order.customerDetails?.email || '',
            amount: order.totalAmount,
            timestamp: log.timestamp,
            decision: log.decision,
            reason: log.reason,
            tool: log.tool,
            result: log.result,
            attemptNumber: log.attemptNumber,
            isRecoverySuccess: isRecoverySuccess,
            orderIsPaid: isPaid,
            orderIsRecovered: isRecovered
          });
        });
      }
    });

    // Sort timeline newest first
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const totalRevivePayCases = successfulRecoveriesCount + activeCasesCount;
    const recoveryRate = totalRevivePayCases > 0
      ? Math.round((successfulRecoveriesCount / totalRevivePayCases) * 100)
      : 0;

    res.json({
      success: true,
      metrics: {
        totalRevenueAtRisk,
        totalRevenueRecovered,
        recoveryRate,
        activeCasesCount,
        successfulRecoveriesCount,
        failedAttemptsCount
      },
      timeline: timeline.slice(0, 30)
    });
  } catch (error) {
    console.error('Error fetching RevivePay analytics:', error);
    res.status(500).json({ success: false, message: 'Error fetching analytics', error: error.message });
  }
});

// GET /api/recovery/cases - List all active & historical recovery cases
router.get('/cases', async (req, res) => {
  try {
    await syncAllPendingPaymentLinks();

    const ordersWithCases = await Order.find({
      $or: [
        { 'revivePayCase.recoveryAttempts': { $gt: 0 } },
        { checkoutStatus: 'abandoned' },
        { checkoutStatus: 'recovered' }
      ]
    }).sort({ updatedAt: -1 });

    res.json({ success: true, count: ordersWithCases.length, cases: ordersWithCases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching recovery cases', error: error.message });
  }
});

// GET /api/recovery/cases/:orderId - Fetch a single order's recovery case
router.get('/cases/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, orderId: order.orderId, recoveryCase: order.revivePayCase, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching case', error: error.message });
  }
});

export default router;
