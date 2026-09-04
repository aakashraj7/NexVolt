import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { seedProducts } from '../data/seedData.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexvolt';

async function reseed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Find existing active merchant
    let merchant = await User.findOne({ $or: [{ isMerchant: true }, { role: 'merchant' }] });
    if (!merchant) {
      console.log('No explicit merchant found, falling back to first user or default seed merchant...');
      merchant = await User.findOne({});
    }

    const merchantId = merchant?.userId || 'user_3IXrY66tV79vpBlZH3CzsiBhmca';
    const merchantEmail = merchant?.email || 'saakashraj.it2025@citchennai.net';
    const merchantName = merchant?.fullName || "S AAKASHRAJ IT's Tech Store";
    const merchantStoreName = merchant?.merchantProfile?.storeName || merchantName;

    console.log(`Mapping all products to Merchant:`);
    console.log(`- ID: ${merchantId}`);
    console.log(`- Name: ${merchantName}`);
    console.log(`- Store: ${merchantStoreName}`);
    console.log(`- Email: ${merchantEmail}`);

    // 2. Clear existing products
    console.log('\nWiping existing products from database...');
    const deleteResult = await Product.deleteMany({});
    console.log(`Removed ${deleteResult.deletedCount} legacy products.`);

    // 3. Prepare new genuine products with merchant details
    const preparedProducts = seedProducts.map(prod => ({
      ...prod,
      merchantId,
      merchantEmail,
      merchantName,
      merchantStoreName
    }));

    // 4. Insert into database
    console.log(`\nInserting ${preparedProducts.length} authentic products...`);
    const inserted = await Product.insertMany(preparedProducts);
    console.log(`Successfully inserted ${inserted.length} products!`);

    // 5. Category breakdown
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } },
      { $sort: { count: -1 } }
    ]);
    console.log('\n--- Catalog Category Breakdown ---');
    categories.forEach(c => {
      console.log(`• ${c._id}: ${c.count} items (₹${c.minPrice.toLocaleString('en-IN')} - ₹${c.maxPrice.toLocaleString('en-IN')})`);
    });

    const verifyCount = await Product.countDocuments();
    console.log(`\nTotal verified products in database: ${verifyCount}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error during product reseed:', error);
    process.exit(1);
  }
}

reseed();
