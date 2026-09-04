import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import { seedProducts } from './data/seedData.js';

import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexvolt';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    // Look for active merchant in DB
    const merchant = await User.findOne({ $or: [{ isMerchant: true }, { role: 'merchant' }] });
    const merchantId = merchant?.userId || 'user_3IXrY66tV79vpBlZH3CzsiBhmca';
    const merchantEmail = merchant?.email || 'saakashraj.it2025@citchennai.net';
    const merchantName = merchant?.fullName || "S AAKASHRAJ IT's Tech Store";
    const merchantStoreName = merchant?.merchantProfile?.storeName || merchantName;

    console.log(`Binding seed catalog to merchant: ${merchantName} (${merchantId})`);

    console.log('Clearing existing products...');
    await Product.deleteMany({});

    const prepared = seedProducts.map(p => ({
      ...p,
      merchantId,
      merchantEmail,
      merchantName,
      merchantStoreName
    }));

    console.log(`Seeding ${prepared.length} electronics products...`);
    const inserted = await Product.insertMany(prepared);
    console.log(`Successfully seeded ${inserted.length} products to database!`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
