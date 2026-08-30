import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    default: 'Home' // e.g. "Home", "Office", "Studio", "Parent's House"
  },
  recipientName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  landmark: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'India'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  fullName: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say', ''],
    default: ''
  },
  dateOfBirth: {
    type: String,
    default: ''
  },
  authProvider: {
    type: String,
    default: 'email_password' // 'google' | 'email_password'
  },
  hasPassword: {
    type: Boolean,
    default: false
  },
  addresses: [addressSchema],
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'merchant'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isMerchant: {
    type: Boolean,
    default: false
  },
  merchantProfile: {
    storeName: { type: String, default: '' },
    businessType: { type: String, default: '' },
    category: { type: String, default: '' },
    categories: [{ type: String }],
    gstin: { type: String, default: '' },
    businessPhone: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
    website: { type: String, default: '' },
    warehouses: [addressSchema],
    onboardingCompleted: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
