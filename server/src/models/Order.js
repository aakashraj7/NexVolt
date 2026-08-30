import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: { type: String, required: true },
  thumbnail: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' }
    }
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentMethod: { type: String, default: 'Razorpay' },
  paymentId: { type: String, default: '' },
  failureReason: { type: String, default: '' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  merchantNotified: { type: Boolean, default: true },
  // Revenue Recovery Tracking fields (Track 3)
  checkoutStatus: {
    type: String,
    enum: ['initiated', 'abandoned', 'recovered', 'completed'],
    default: 'initiated',
    index: true
  },
  abandonedAt: { type: Date },
  recoveryMetadata: {
    isRecovered: { type: Boolean, default: false },
    recoveryTriggerCount: { type: Number, default: 0 },
    discountOffered: { type: Number, default: 0 },
    lastNotifiedAt: { type: Date }
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);
