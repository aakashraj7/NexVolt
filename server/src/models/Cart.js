import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  selectedColor: { type: String, default: '' },
  selectedVariant: { type: String, default: '' },
  priceAtAddition: { type: Number, required: true }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userEmail: { type: String, default: '' },
  items: [cartItemSchema],
  couponApplied: {
    code: { type: String, default: '' },
    discountPercent: { type: Number, default: 0 }
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Cart', cartSchema);
