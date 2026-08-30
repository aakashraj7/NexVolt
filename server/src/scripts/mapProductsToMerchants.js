import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { seedProducts } from '../data/seedData.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexvolt';

async function run() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Find all active merchants in the database
    const merchants = await User.find({
      $or: [
        { role: 'merchant' },
        { isMerchant: true }
      ],
      isActive: { $ne: false }
    });

    console.log(`Found ${merchants.length} active merchant(s) in database:`);
    merchants.forEach(m => {
      console.log(` - ID: ${m.userId} | Name: ${m.fullName || 'N/A'} | Email: ${m.email} | Store: ${m.merchantProfile?.storeName || 'N/A'}`);
    });

    const merchantIds = merchants.map(m => m.userId);

    // 2. Remove products that are not mapped to any available valid merchant in the DB
    console.log('\nPurging products unmapped or mapped to non-existent merchants...');
    const deleteResult = await Product.deleteMany({
      merchantId: { $nin: merchantIds }
    });
    console.log(`Removed ${deleteResult.deletedCount} unmapped / orphaned product(s).`);

    // 3. Map mock products to the available merchant(s)
    if (merchants.length === 0) {
      console.log('⚠️ No active merchants found in DB. Products table is clean (0 orphaned products).');
    } else {
      console.log(`\nAdding mock electronics products for ${merchants.length} available merchant(s)...`);

      for (let i = 0; i < merchants.length; i++) {
        const merchant = merchants[i];
        const storeName = merchant.merchantProfile?.storeName || `${merchant.fullName || 'Merchant'}'s Electronics Hub`;
        const merchantName = merchant.fullName || 'Verified Seller';
        const merchantEmail = merchant.email;

        // Check how many products this merchant currently has
        const existingCount = await Product.countDocuments({ merchantId: merchant.userId });
        console.log(`Merchant ${merchant.userId} (${storeName}) currently has ${existingCount} product(s).`);

        // Slice a distinct set of seed products for this merchant
        const startIndex = (i * 6) % seedProducts.length;
        const selectedSeeds = seedProducts.slice(startIndex, startIndex + 6);

        let addedCount = 0;
        for (const item of selectedSeeds) {
          const uniqueSlug = `${item.slug}-${merchant.userId.slice(-6)}`;
          
          // Check if this product already exists
          const existing = await Product.findOne({ slug: uniqueSlug });
          if (!existing) {
            await Product.create({
              ...item,
              merchantId: merchant.userId,
              merchantEmail: merchantEmail,
              merchantName: merchantName,
              merchantStoreName: storeName,
              slug: uniqueSlug
            });
            addedCount++;
          }
        }
        console.log(` -> Mapped and added ${addedCount} product(s) to ${storeName}.`);
      }
    }

    const totalProducts = await Product.countDocuments();
    console.log(`\nTotal products currently in catalog: ${totalProducts}`);
    const summary = await Product.aggregate([
      { $group: { _id: '$merchantId', count: { $sum: 1 }, storeName: { $first: '$merchantStoreName' } } }
    ]);
    console.log('Merchant Catalog Breakdown:', summary);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB. Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error in mapProductsToMerchants script:', error);
    process.exit(1);
  }
}

run();
