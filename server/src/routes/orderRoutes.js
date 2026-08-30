import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';

const router = express.Router();

// POST /api/orders/initiate - Create a checkout session (tracked for Track 3 Revenue Recovery)
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
      const isPhoneVerified = Boolean(user.isPhoneVerified);

      if (!isEmailVerified || !isPhoneVerified) {
        return res.status(403).json({
          success: false,
          isVerificationRequired: true,
          isEmailVerified,
          isPhoneVerified,
          message: 'Account verification required. Both your Email and Mobile Phone must be verified before placing an order.'
        });
      }
    }

    const orderId = 'NV-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);

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
      paymentStatus: 'pending',
      checkoutStatus: 'initiated'
    });

    await order.save();
    res.status(201).json({ success: true, orderId: order.orderId, order });
  } catch (error) {
    console.error('Error initiating order:', error);
    res.status(500).json({ success: false, message: 'Error initiating order', error: error.message });
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

// POST /api/orders/:orderId/complete - Complete order & clear user cart
router.post('/:orderId/complete', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentId, isRecovered = false } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = 'paid';
    order.checkoutStatus = isRecovered ? 'recovered' : 'completed';
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
