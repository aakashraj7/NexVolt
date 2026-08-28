import mongoose from 'mongoose';

const specSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  userAvatar: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  verifiedPurchase: { type: Boolean, default: true },
  date: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  brand: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  subCategory: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0 },
  rating: { type: Number, default: 4.5, min: 0, max: 5, index: true },
  numReviews: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true, index: true },
  stockCount: { type: Number, default: 25 },
  thumbnail: { type: String, required: true },
  images: [{ type: String }],
  badge: { type: String, default: '' }, // e.g. "Best Seller", "Deal of the Day", "New Release"
  isFeatured: { type: Boolean, default: false, index: true },
  isDeal: { type: Boolean, default: false, index: true },
  shortDescription: { type: String, required: true },
  description: { type: String, required: true },
  highlights: [{ type: String }],
  specs: [specSchema],
  warranty: { type: String, default: '1 Year Manufacturer Warranty' },
  freeDelivery: { type: Boolean, default: true },
  returnDays: { type: Number, default: 7 },
  tags: [{ type: String, index: true }],
  reviews: [reviewSchema]
}, {
  timestamps: true
});

productSchema.index({ title: 'text', brand: 'text', category: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Product', productSchema);
