import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { createRazorpayOrder, verifyRazorpayPaymentSignature } from '../services/razorpayService.js';
import { analyzeRecoveryCase } from '../services/recoveryAgentService.js';

const router = express.Router();

// POST /api/orders/initiate - Create a checkout session & server-side Razorpay Order
router.post('/initiate', async (req, res) => {
  try {
    const {
      userId,
      customerDetails,
      items,
      subtotal,
      tax = 0,
      shipping = 0,
      discountAmount = 0,
      totalAmount,
      currency = 'INR',
      paymentMethod = 'Razorpay'
    } = req.body;

    if (!userId || !items || !items.length || !customerDetails) {
      return res.status(400).json({ success: false, message: 'Missing required order details' });
    }

    // Verify Customer Verification Status: Must have verified email and phone
    const user = await User.findOne({
      $or: [
        { userId },
        ...(customerDetails.email ? [{ email: customerDetails.email.toLowerCase() }] : [])
      ]
    });

    if (user) {
      const isEmailVerified = user.authProvider === 'google' || Boolean(user.isEmailVerified);

      if (!isEmailVerified) {
        return res.status(403).json({
          success: false,
          isVerificationRequired: true,
          isEmailVerified,
          message: 'Account verification required. Please verify your email address before placing an order.'
        });
      }
    }

    const orderId = 'NV-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
    const isOnlinePayment = !paymentMethod.toLowerCase().includes('delivery') && !paymentMethod.toLowerCase().includes('cod');

    let razorpayOrderId = '';
    if (isOnlinePayment) {
      try {
        const rzpOrder = await createRazorpayOrder({
          amountInRupees: totalAmount,
          receipt: orderId,
          notes: {
            userId,
            customerEmail: customerDetails.email,
            customerName: customerDetails.name
          }
        });
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.warn('Server Razorpay Order creation note:', rzpErr.message);
      }
    }

    const order = new Order({
      orderId,
      userId,
      customerDetails,
      items,
      subtotal,
      tax,
      shipping,
      discountAmount,
      totalAmount,
      currency,
      paymentMethod,
      razorpayOrderId,
      paymentStatus: 'pending',
      checkoutStatus: 'initiated'
    });

    await order.save();
    res.status(201).json({
      success: true,
      orderId: order.orderId,
      razorpayOrderId: order.razorpayOrderId,
      keyId: process.env.RAZORPAY_KEY_ID || '',
      order
    });
  } catch (error) {
    console.error('Error initiating order:', error);
    res.status(500).json({ success: false, message: 'Error initiating order', error: error.message });
  }
});

// POST /api/orders/:orderId/create-razorpay-order - Generate/Refresh Razorpay Order ID for retry
router.post('/:orderId/create-razorpay-order', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already paid', alreadyPaid: true });
    }

    const rzpOrder = await createRazorpayOrder({
      amountInRupees: order.totalAmount,
      receipt: order.orderId,
      notes: {
        userId: order.userId,
        customerEmail: order.customerDetails?.email,
        customerName: order.customerDetails?.name
      }
    });

    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    res.json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      keyId: process.env.RAZORPAY_KEY_ID || '',
      amount: rzpOrder.amount,
      currency: rzpOrder.currency
    });
  } catch (err) {
    console.error('Error creating Razorpay Order ID:', err);
    res.status(500).json({ success: false, message: 'Failed to create Razorpay Order', error: err.message });
  }
});

// POST /api/orders/:orderId/abandon - Mark checkout as abandoned (Track 3)
router.post('/:orderId/abandon', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Do not mark as abandoned if already completed/paid
    if (order.paymentStatus === 'paid' || order.checkoutStatus === 'completed') {
      return res.json({ success: true, message: 'Order already completed', order });
    }

    if (order.checkoutStatus === 'initiated') {
      order.checkoutStatus = 'abandoned';
      order.abandonedAt = new Date();
      await order.save();
    }

    res.json({ success: true, message: 'Checkout recorded as abandoned', order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking order as abandoned', error: error.message });
  }
});

// GET /api/orders/single/:orderId - Fetch a single order by orderId
router.get('/single/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching order', error: error.message });
  }
});

// POST /api/orders/:orderId/fail - Mark order payment as failed with rich diagnostics
router.post('/:orderId/fail', async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      reason = 'Payment was not completed',
      code = '',
      description = '',
      source = '',
      step = '',
      paymentId = ''
    } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Duplicate Protection: Never overwrite an already paid order
    if (order.paymentStatus === 'paid') {
      return res.json({ success: true, message: 'Order is already marked paid', order });
    }

    order.paymentStatus = 'failed';
    order.failureReason = description || reason;
    order.checkoutStatus = 'abandoned';
    order.abandonedAt = new Date();
    order.razorpayPaymentId = paymentId || order.razorpayPaymentId;
    order.razorpayFailureData = {
      code,
      description: description || reason,
      source,
      step,
      reason,
      paymentId,
      failedAt: new Date()
    };

    await order.save();

    // Trigger RevivePay AI Recovery Analysis asynchronously
    analyzeRecoveryCase(order.orderId).catch(err => {
      console.warn('RevivePay background analysis note:', err.message);
    });

    res.json({ success: true, message: 'Order payment failure recorded', order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating failed order', error: error.message });
  }
});

// POST /api/orders/:orderId/verify-payment - Cryptographic Server-Side Signature Verification
router.post('/:orderId/verify-payment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod = 'Razorpay',
      isRecovered = false
    } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Idempotency: If already paid, return success immediately
    if (order.paymentStatus === 'paid') {
      return res.json({ success: true, message: 'Order is already marked paid', order, alreadyPaid: true });
    }

    const isCOD = paymentMethod.toLowerCase().includes('delivery') || paymentMethod.toLowerCase().includes('cod');

    if (!isCOD) {
      if (!razorpay_payment_id) {
        return res.status(400).json({ success: false, message: 'Missing Razorpay Payment ID' });
      }

      // If razorpay_signature and razorpay_order_id are provided, verify cryptographically
      if (razorpay_signature && razorpay_order_id) {
        const isValid = verifyRazorpayPaymentSignature({
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature
        });

        if (!isValid) {
          console.error(`Invalid Razorpay signature for Order: ${orderId}`);
          order.failureReason = 'Payment signature verification failed';
          order.paymentStatus = 'failed';
          await order.save();
          return res.status(400).json({
            success: false,
            message: 'Payment verification failed: Invalid cryptographic signature.'
          });
        }
      }

      order.razorpayOrderId = razorpay_order_id || order.razorpayOrderId;
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature || '';
      order.paymentId = razorpay_payment_id;
      order.paymentStatus = 'paid';
      order.failureReason = '';
      order.abandonedAt = null;
    } else {
      order.paymentMethod = 'Pay on Delivery (COD)';
      order.paymentStatus = 'pending';
      order.paymentId = 'COD-' + Date.now();
    }

    const isActuallyRecovered = isRecovered || (order.revivePayCase && order.revivePayCase.recoveryAttempts > 0) || order.checkoutStatus === 'abandoned';
    order.paymentMethod = paymentMethod;
    order.checkoutStatus = isActuallyRecovered ? 'recovered' : 'completed';
    order.merchantNotified = true;

    if (isActuallyRecovered) {
      if (order.recoveryMetadata) {
        order.recoveryMetadata.isRecovered = true;
      }
      if (order.revivePayCase) {
        order.revivePayCase.status = 'recovered';
        order.revivePayCase.recoveredAt = new Date();
        order.revivePayCase.recoveredAmount = order.totalAmount;
        if (order.revivePayCase.decisionLogs) {
          order.revivePayCase.decisionLogs.push({
            timestamp: new Date(),
            decision: 'payment_verified_recovered',
            reason: 'Customer successfully re-authorized payment via Razorpay retry',
            tool: 'retryPayment',
            result: 'recovered',
            attemptNumber: order.revivePayCase.recoveryAttempts || 1
          });
        }
      }
    }

    await order.save();

    // Clear user cart
    await Cart.findOneAndUpdate(
      { userId: order.userId },
      { items: [], couponApplied: { code: '', discountPercent: 0 } }
    );

    res.json({ success: true, message: 'Payment successfully verified & order placed', order });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
  }
});

// POST /api/orders/:orderId/complete - Legacy fallback for completing orders
router.post('/:orderId/complete', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentId = '', paymentMethod, isRecovered = false } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Idempotency check
    if (order.paymentStatus === 'paid') {
      return res.json({ success: true, message: 'Order already completed', order });
    }

    if (paymentMethod) {
      order.paymentMethod = paymentMethod;
    }
    if (paymentId) {
      order.paymentId = paymentId;
      order.razorpayPaymentId = paymentId;
    }

    order.paymentStatus = order.paymentMethod.toLowerCase().includes('delivery') || order.paymentMethod.toLowerCase().includes('cod') ? 'pending' : 'paid';
    order.checkoutStatus = isRecovered ? 'recovered' : 'completed';
    order.merchantNotified = true;

    if (isRecovered) {
      order.recoveryMetadata.isRecovered = true;
    }

    await order.save();

    // Clear cart for the user
    await Cart.findOneAndUpdate(
      { userId: order.userId },
      { items: [], couponApplied: { code: '', discountPercent: 0 } }
    );

    res.json({ success: true, message: 'Order completed successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error completing order', error: error.message });
  }
});

// GET /api/orders/user/:userId - Get orders for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user orders', error: error.message });
  }
});

// GET /api/orders/abandoned - Get all abandoned checkouts for AI Revenue Recovery Agent
router.get('/abandoned/list', async (req, res) => {
  try {
    const abandonedOrders = await Order.find({
      checkoutStatus: 'abandoned',
      'recoveryMetadata.isRecovered': false
    }).sort({ abandonedAt: -1 });

    res.json({ success: true, count: abandonedOrders.length, abandonedOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching abandoned orders', error: error.message });
  }
});

export default router;
