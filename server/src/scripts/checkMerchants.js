import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGODB_URI);
  const merchants = await User.find({ $or: [{ isMerchant: true }, { role: 'merchant' }] });
  console.log('--- FOUND MERCHANTS ---');
  console.log(JSON.stringify(merchants.map(m => ({
    userId: m.userId,
    email: m.email,
    fullName: m.fullName,
    isMerchant: m.isMerchant,
    role: m.role,
    storeName: m.merchantProfile?.storeName,
    categories: m.merchantProfile?.categories,
    category: m.merchantProfile?.category
  })), null, 2));

  const allUsers = await User.find({});
  console.log('--- ALL USERS COUNT ---', allUsers.length);
  console.log(JSON.stringify(allUsers.map(u => ({
    userId: u.userId,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    isMerchant: u.isMerchant,
    storeName: u.merchantProfile?.storeName
  })), null, 2));

  const productCount = await Product.countDocuments();
  console.log('--- TOTAL PRODUCTS IN DB ---', productCount);

  const distinctMerchantsInProducts = await Product.distinct('merchantId');
  console.log('--- DISTINCT MERCHANT IDS IN PRODUCTS ---', distinctMerchantsInProducts);

  await mongoose.disconnect();
}

check().catch(console.error);
