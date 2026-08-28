import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import { seedProducts } from './data/seedData.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexvolt';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    console.log('Clearing existing products...');
    await Product.deleteMany({});

    console.log(`Seeding ${seedProducts.length} electronics products...`);
    const inserted = await Product.insertMany(seedProducts);
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
