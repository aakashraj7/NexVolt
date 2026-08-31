import express from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const router = express.Router();

// GET /api/products - Get all products with filtering, search, pagination, sorting
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      merchantId,
      minPrice,
      maxPrice,
      rating,
      isFeatured,
      isDeal,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // Merchant specific filter
    if (merchantId) {
      query.merchantId = merchantId;
    }

    // Text search or regex search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Category filter (support comma separated or single)
    if (category) {
      const categories = category.split(',').map(c => c.trim());
      query.category = { $in: categories };
    }

    // Brand filter
    if (brand) {
      const brands = brand.split(',').map(b => b.trim());
      query.brand = { $in: brands };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && !isNaN(minPrice)) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && !isNaN(maxPrice)) query.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating !== undefined && !isNaN(rating)) {
      query.rating = { $gte: Number(rating) };
    }

    // Featured / Deal filters
    if (isFeatured === 'true') {
      query.isFeatured = true;
    }
    if (isDeal === 'true') {
      query.isDeal = true;
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1, numReviews: -1 };
    } else if (sort === 'discount') {
      sortOptions = { discountPercent: -1 };
    } else if (sort === 'popular') {
      sortOptions = { numReviews: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    // Also get all distinct brands and categories for dynamic filter options
    const allBrands = await Product.distinct('brand');
    const allCategories = await Product.distinct('category');

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      products,
      filters: {
        brands: allBrands,
        categories: allCategories
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching products', error: error.message });
  }
});

// GET /api/products/deals - Get flash sale & hot deals
router.get('/deals', async (req, res) => {
  try {
    const deals = await Product.find({ isDeal: true }).sort({ discountPercent: -1 }).limit(8);
    res.json({ success: true, count: deals.length, deals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching deals', error: error.message });
  }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req, res) => {
  try {
    const featured = await Product.find({ isFeatured: true }).sort({ rating: -1 }).limit(8);
    res.json({ success: true, count: featured.length, featured });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching featured products', error: error.message });
  }
});

// GET /api/products/:idOrSlug - Get single product by MongoDB ID or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let product;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrSlug);
    }

    if (!product) {
      product = await Product.findOne({ slug: idOrSlug });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Fetch related products in same category
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4);

    res.json({ success: true, product, related });
  } catch (error) {
    console.error('Error fetching product detail:', error);
    res.status(500).json({ success: false, message: 'Error fetching product detail', error: error.message });
  }
});

// GET /api/products/:id/can-review - Check if user has purchased the item and is eligible to review
router.get('/:id/can-review', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.json({ canReview: false, reason: 'unauthenticated' });
    }

    const product = await Product.findOne({
      $or: [
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
        { slug: id }
      ]
    });

    if (!product) {
      return res.json({ canReview: false, reason: 'product_not_found' });
    }

    const orders = await Order.find({
      userId,
      $or: [
        { 'items.product': product._id },
        { 'items.title': product.title }
      ],
      paymentStatus: { $in: ['paid', 'confirmed', 'delivered', 'shipped', 'in-transit', 'packed'] }
    });

    const deliveredOrders = orders.filter(
      o => o.orderStatus?.toLowerCase() === 'delivered' || o.paymentStatus?.toLowerCase() === 'delivered'
    );
    const pendingOrders = orders.filter(
      o => o.orderStatus?.toLowerCase() !== 'delivered' && o.paymentStatus?.toLowerCase() !== 'delivered'
    );

    const canReview = deliveredOrders.length > 0;
    const isPendingDelivery = !canReview && pendingOrders.length > 0;
    const deliveredCount = deliveredOrders.length;

    res.json({
      success: true,
      canReview,
      hasPurchased: orders.length > 0,
      isPendingDelivery,
      pendingOrderStatus: pendingOrders[0]?.orderStatus || 'Confirmed',
      pendingOrderId: pendingOrders[0]?.orderId || null,
      orderCount: deliveredCount,
      orderId: deliveredCount === 1 ? deliveredOrders[0].orderId : null,
      isMultipleOrders: deliveredCount > 1
    });
  } catch (err) {
    console.error('Error checking review eligibility:', err);
    res.json({ success: false, canReview: false });
  }
});

// POST /api/products/:id/reviews - Add customer review (Only Verified Buyers With Delivered Orders)
router.post('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, rating, comment } = req.body;

    if (!userName || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Missing required review fields' });
    }

    const product = await Product.findOne({
      $or: [
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
        { slug: id }
      ]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Verify buyer purchase
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Please sign in to submit a verified buyer review.'
      });
    }

    const matchingOrders = await Order.find({
      userId,
      $or: [
        { 'items.product': product._id },
        { 'items.title': product.title }
      ],
      paymentStatus: { $in: ['paid', 'confirmed', 'delivered', 'shipped', 'in-transit', 'packed'] }
    });

    if (!matchingOrders || matchingOrders.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only verified customers who have purchased this product can submit a review and rating.'
      });
    }

    // Check if any order is delivered
    const deliveredOrder = matchingOrders.find(
      o => o.orderStatus?.toLowerCase() === 'delivered' || o.paymentStatus?.toLowerCase() === 'delivered'
    );

    if (!deliveredOrder) {
      const activeOrder = matchingOrders[0];
      return res.status(403).json({
        success: false,
        message: `Your order (${activeOrder.orderId}) is currently ${activeOrder.orderStatus || 'in transit'}. You can rate and review this product once it has been delivered to you.`
      });
    }

    const newRatingNum = Math.min(5, Math.max(1, Number(rating)));

    product.reviews.unshift({
      userName: userName.trim(),
      rating: newRatingNum,
      comment: comment.trim(),
      verifiedPurchase: true,
      date: new Date()
    });

    product.numReviews = product.reviews.length;
    const totalRating = product.reviews.reduce((acc, item) => acc + item.rating, 0);
    product.rating = Number((totalRating / product.reviews.length).toFixed(1));

    await product.save();

    res.status(201).json({ success: true, message: 'Review added successfully', product });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, message: 'Error submitting review', error: error.message });
  }
});

export default router;
