import express from 'express';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/wishlist/:userId - Get user wishlist
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let wishlist = await Wishlist.findOne({ userId }).populate('products');

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, products: [] });
    }

    res.json({ success: true, wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching wishlist', error: error.message });
  }
});

// POST /api/wishlist/:userId/toggle - Add or remove product from wishlist
router.post('/:userId/toggle', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    const index = wishlist.products.findIndex(
      (p) => p.toString() === productId
    );

    let isAdded = false;
    if (index > -1) {
      wishlist.products.splice(index, 1);
      isAdded = false;
    } else {
      wishlist.products.push(productId);
      isAdded = true;
    }

    await wishlist.save();
    const updatedWishlist = await Wishlist.findById(wishlist._id).populate('products');

    res.json({
      success: true,
      isAdded,
      message: isAdded ? 'Added to wishlist' : 'Removed from wishlist',
      wishlist: updatedWishlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling wishlist item', error: error.message });
  }
});

// DELETE /api/wishlist/:userId/clear - Clear wishlist
router.delete('/:userId/clear', async (req, res) => {
  try {
    const { userId } = req.params;
    let wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }
    res.json({ success: true, message: 'Wishlist cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error clearing wishlist', error: error.message });
  }
});

export default router;
