import express from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const router = express.Router();

// GET /api/merchant/stats - Aggregated seller statistics
router.get('/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ stockCount: { $lt: 5 } });
    const allOrders = await Order.find();

    const totalOrdersCount = allOrders.length;
    const completedOrders = allOrders.filter(o => o.paymentStatus === 'paid');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const abandonedOrders = allOrders.filter(o => o.checkoutStatus === 'abandoned');
    const recoveredOrders = allOrders.filter(o => o.checkoutStatus === 'recovered');
    const recoveredRevenue = recoveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const recoveryRate = abandonedOrders.length + recoveredOrders.length > 0
      ? Math.round((recoveredOrders.length / (abandonedOrders.length + recoveredOrders.length)) * 100)
      : 0;

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders: totalOrdersCount,
        completedOrders: completedOrders.length,
        totalProducts,
        lowStockProducts,
        abandonedCount: abandonedOrders.length,
        recoveredCount: recoveredOrders.length,
        recoveredRevenue,
        recoveryRate
      }
    });
  } catch (error) {
    console.error('Error fetching merchant stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching merchant statistics', error: error.message });
  }
});

// GET /api/merchant/orders - Get all merchant orders
router.get('/orders', async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.paymentStatus = status;
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.email': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching merchant orders', error: error.message });
  }
});

// PUT /api/merchant/orders/:id/status - Update order fulfillment or payment status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, checkoutStatus } = req.body;

    const order = await Order.findOne({ $or: [{ _id: id }, { orderId: id }] });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (checkoutStatus) order.checkoutStatus = checkoutStatus;

    await order.save();
    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating order status', error: error.message });
  }
});

// POST /api/merchant/products - Add a new product to store
router.post('/products', async (req, res) => {
  try {
    const {
      title,
      brand,
      category,
      price,
      originalPrice,
      shortDescription,
      description,
      thumbnail,
      images,
      specs,
      highlights,
      stockCount = 10,
      badge,
      isFeatured = false,
      isDeal = false
    } = req.body;

    if (!title || !brand || !category || !price || !thumbnail) {
      return res.status(400).json({ success: false, message: 'Please provide all required product fields' });
    }

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const numPrice = Number(price);
    const numOrig = originalPrice ? Number(originalPrice) : numPrice;
    const discountPercent = numOrig > numPrice ? Math.round(((numOrig - numPrice) / numOrig) * 100) : 0;

    const product = new Product({
      title,
      slug,
      brand,
      category,
      price: numPrice,
      originalPrice: numOrig,
      discountPercent,
      rating: 4.8,
      numReviews: 1,
      inStock: stockCount > 0,
      stockCount: Number(stockCount),
      badge: badge || '',
      isFeatured: Boolean(isFeatured),
      isDeal: Boolean(isDeal),
      shortDescription: shortDescription || title,
      description: description || shortDescription || title,
      thumbnail,
      images: images && images.length ? images : [thumbnail],
      specs: Array.isArray(specs) ? specs : [],
      highlights: Array.isArray(highlights) ? highlights : []
    });

    await product.save();
    res.status(201).json({ success: true, message: 'Product published successfully', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Error publishing product', error: error.message });
  }
});

// PUT /api/merchant/products/:id - Update product details
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.price && updates.originalPrice) {
      const p = Number(updates.price);
      const o = Number(updates.originalPrice);
      updates.discountPercent = o > p ? Math.round(((o - p) / o) * 100) : 0;
    }

    if (updates.stockCount !== undefined) {
      updates.inStock = Number(updates.stockCount) > 0;
    }

    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating product', error: error.message });
  }
});

// DELETE /api/merchant/products/:id - Delete product from inventory
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted from store catalog' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting product', error: error.message });
  }
});

export default router;
