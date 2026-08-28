import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/products - Get all products with filtering, search, pagination, sorting
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      inStock,
      isFeatured,
      isDeal,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

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

    // In Stock filter
    if (inStock === 'true') {
      query.inStock = true;
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

// POST /api/products/:id/reviews - Add customer review
router.post('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, rating, comment } = req.body;

    if (!userName || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Missing required review fields' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.reviews.unshift({
      userName,
      rating: Number(rating),
      comment,
      verifiedPurchase: true,
      date: new Date()
    });

    product.numReviews = product.reviews.length;
    const totalRating = product.reviews.reduce((acc, item) => acc + item.rating, 0);
    product.rating = Number((totalRating / product.reviews.length).toFixed(1));

    await product.save();

    res.status(201).json({ success: true, message: 'Review added successfully', product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting review', error: error.message });
  }
});

export default router;
