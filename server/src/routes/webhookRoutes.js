import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import { verifyWebhookSignature } from '../services/razorpayService.js';

const router = express.Router();

// POST /api/webhooks/razorpay - Secure Webhook handler for Razorpay events
router.post('/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // 1. Signature Verification
    if (signature && webhookSecret) {
      const isValid = verifyWebhookSignature(req.body, signature, webhookSecret);
      if (!isValid) {
        console.warn('Razorpay webhook signature verification failed.');
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    } else {
      console.log('Webhook received without signature verification headers (Dev/Test mode).');
    }

    const { event, payload } = req.body;
    console.log(`Received Razorpay Webhook Event: ${event}`);

    if (!payload) {
      return res.status(200).json({ status: 'ok', message: 'No payload present' });
    }

    // 2. Event Dispatching & Idempotent Processing
    switch (event) {
      case 'payment.failed': {
        const paymentEntity = payload.payment?.entity;
        if (!paymentEntity) break;

        const rzpOrderId = paymentEntity.order_id;
        const notesReceipt = paymentEntity.notes?.receipt;

        const order = await Order.findOne({
          $or: [
            ...(rzpOrderId ? [{ razorpayOrderId: rzpOrderId }] : []),
            ...(notesReceipt ? [{ orderId: notesReceipt }] : [])
          ]
        });

        if (order) {
          // Idempotency: Do not overwrite if already paid
          if (order.paymentStatus !== 'paid') {
            order.paymentStatus = 'failed';
            order.failureReason = paymentEntity.error_description || paymentEntity.error_reason || 'Payment failed on gateway';
            order.checkoutStatus = 'abandoned';
            order.abandonedAt = new Date();
            order.razorpayPaymentId = paymentEntity.id || order.razorpayPaymentId;
            order.razorpayFailureData = {
              code: paymentEntity.error_code || '',
              description: paymentEntity.error_description || '',
              source: paymentEntity.error_source || '',
              step: paymentEntity.error_step || '',
              reason: paymentEntity.error_reason || '',
              paymentId: paymentEntity.id || '',
              failedAt: new Date()
            };
            await order.save();
            console.log(`Webhook: Updated Order ${order.orderId} as failed (${order.failureReason}).`);
          }
        }
        break;
      }

      case 'order.paid':
      case 'payment.captured': {
        const paymentEntity = payload.payment?.entity;
        const orderEntity = payload.order?.entity;

        const rzpOrderId = orderEntity?.id || paymentEntity?.order_id;
        const notesReceipt = orderEntity?.notes?.receipt || paymentEntity?.notes?.receipt;

        const order = await Order.findOne({
          $or: [
            ...(rzpOrderId ? [{ razorpayOrderId: rzpOrderId }] : []),
            ...(notesReceipt ? [{ orderId: notesReceipt }] : [])
          ]
        });

        if (order) {
          // Idempotency: If already paid, acknowledge without re-executing
          if (order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.checkoutStatus = 'completed';
            if (paymentEntity?.id) {
              order.paymentId = paymentEntity.id;
              order.razorpayPaymentId = paymentEntity.id;
            }
            order.merchantNotified = true;
            await order.save();

            // Clear user's active cart
            await Cart.findOneAndUpdate(
              { userId: order.userId },
              { items: [], couponApplied: { code: '', discountPercent: 0 } }
            );
            console.log(`Webhook: Verified and marked Order ${order.orderId} as PAID.`);
          }
        }
        break;
      }

      case 'payment_link.paid': {
        const linkEntity = payload.payment_link?.entity;
        const paymentEntity = payload.payment?.entity;
        const notesReceipt = linkEntity?.notes?.receipt || linkEntity?.reference_id || linkEntity?.notes?.orderId;

        if (notesReceipt) {
          const order = await Order.findOne({ orderId: notesReceipt });
          if (order && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.checkoutStatus = 'recovered';
            if (paymentEntity?.id) {
              order.paymentId = paymentEntity.id;
              order.razorpayPaymentId = paymentEntity.id;
            }
            order.recoveryMetadata = {
              ...order.recoveryMetadata,
              isRecovered: true
            };
            if (order.revivePayCase) {
              order.revivePayCase.status = 'recovered';
              order.revivePayCase.recoveredAt = new Date();
              order.revivePayCase.recoveredAmount = order.totalAmount;
              order.revivePayCase.razorpayPaymentLinkStatus = 'paid';
              order.revivePayCase.decisionLogs.push({
                timestamp: new Date(),
                decision: 'payment_link_completed',
                reason: 'Customer successfully paid via Razorpay Recovery Payment Link',
                tool: 'createPaymentLink',
                result: 'recovered',
                attemptNumber: order.revivePayCase.recoveryAttempts
              });
            }
            await order.save();

            // Clear user cart
            await Cart.findOneAndUpdate(
              { userId: order.userId },
              { items: [], couponApplied: { code: '', discountPercent: 0 } }
            );

            console.log(`Webhook: Marked Order ${order.orderId} as RECOVERED via RevivePay Payment Link.`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event}`);
    }

    // Razorpay requires a quick 200 OK response
    return res.status(200).json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);
    // Return 200 to prevent Razorpay webhook spam retries for unhandled server errors
    return res.status(200).json({ status: 'error', error: error.message });
  }
});

export default router;
