import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { seedProducts } from '../data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function freshSeed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const merchant = await User.findOne({
    $or: [{ role: 'merchant' }, { isMerchant: true }],
    isActive: { $ne: false }
  });

  if (!merchant) {
    console.log('No merchant found.');
    process.exit(1);
  }

  const storeName = merchant.merchantProfile?.storeName || `${merchant.fullName || 'Merchant'}'s Electronics Hub`;
  const merchantName = merchant.fullName || 'Verified Seller';
  const merchantEmail = merchant.email;

  // Clear existing products
  await Product.deleteMany({});
  console.log('Cleared old products table.');

  for (const item of seedProducts) {
    const uniqueSlug = `${item.slug}-${merchant.userId.slice(-6)}`;
    await Product.create({
      ...item,
      merchantId: merchant.userId,
      merchantEmail: merchantEmail,
      merchantName: merchantName,
      merchantStoreName: storeName,
      slug: uniqueSlug
    });
    console.log(`Created product: ${item.title} -> ₹${item.price.toLocaleString('en-IN')}`);
  }

  console.log(`\nSuccessfully seeded ${seedProducts.length} high-quality products under ₹50,000!`);
  await mongoose.disconnect();
}

freshSeed();
