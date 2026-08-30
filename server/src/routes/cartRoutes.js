import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const router = express.Router();

// Helper to calculate total and format cart items
const populateCart = async (cart) => {
  return await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'title slug price originalPrice discountPercent thumbnail badge brand'
  });
};

// GET /api/cart/:userId - Get user cart
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let cart = await Cart.findOne({ userId }).populate({
      path: 'items.product',
      select: 'title slug price originalPrice discountPercent thumbnail badge brand'
    });

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    res.json({ success: true, cart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Error fetching cart', error: error.message });
  }
});

// POST /api/cart/:userId/add - Add or increment item in cart
router.post('/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1, userEmail = '' } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, userEmail, items: [] });
    }

    if (userEmail) cart.userEmail = userEmail;

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        product: productId,
        quantity: Number(quantity),
        priceAtAddition: product.price
      });
    }

    cart.lastActiveAt = new Date();
    await cart.save();

    const updatedCart = await populateCart(cart);
    res.json({ success: true, cart: updatedCart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Error adding to cart', error: error.message });
  }
});

// PUT /api/cart/:userId/update - Update quantity of an item
router.put('/:userId/update', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      if (Number(quantity) <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = Number(quantity);
      }
      cart.lastActiveAt = new Date();
      await cart.save();
    }

    const updatedCart = await populateCart(cart);
    res.json({ success: true, cart: updatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating cart item', error: error.message });
  }
});

// DELETE /api/cart/:userId/remove/:productId - Remove item from cart
router.delete('/:userId/remove/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    cart.lastActiveAt = new Date();
    await cart.save();

    const updatedCart = await populateCart(cart);
    res.json({ success: true, cart: updatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing item from cart', error: error.message });
  }
});

// POST /api/cart/:userId/coupon - Apply discount promo code
router.post('/:userId/coupon', async (req, res) => {
  try {
    const { userId } = req.params;
    const { code } = req.body;

    const validCoupons = {
      'NEXVOLT10': 10,
      'RAZORPAY20': 20,
      'SUPERTECH15': 15,
      'RECOVER500': 10
    };

    const upperCode = (code || '').trim().toUpperCase();
    if (!validCoupons[upperCode]) {
      return res.status(400).json({ success: false, message: 'Invalid coupon code' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.couponApplied = {
      code: upperCode,
      discountPercent: validCoupons[upperCode]
    };

    await cart.save();
    const updatedCart = await populateCart(cart);
    res.json({ success: true, message: `Coupon ${upperCode} applied!`, cart: updatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error applying coupon', error: error.message });
  }
});

// DELETE /api/cart/:userId/clear - Clear cart
router.delete('/:userId/clear', async (req, res) => {
  try {
    const { userId } = req.params;
    let cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = [];
      cart.couponApplied = { code: '', discountPercent: 0 };
      await cart.save();
    }
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error clearing cart', error: error.message });
  }
});

export default router;
