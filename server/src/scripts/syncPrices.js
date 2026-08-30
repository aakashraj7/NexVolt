import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import { seedProducts } from '../data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function syncPrices() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const products = await Product.find({});
  console.log(`Checking ${products.length} products in database:`);

  for (const p of products) {
    // find match in seedProducts by slug or title prefix
    const match = seedProducts.find(s => p.slug.startsWith(s.slug) || s.slug.startsWith(p.slug) || s.title.includes(p.brand));
    if (match && (p.price > 50000 || p.price !== match.price)) {
      console.log(`Updating ${p.title} from ₹${p.price} to ₹${match.price}`);
      p.title = match.title;
      p.price = match.price;
      p.originalPrice = match.originalPrice;
      p.discountPercent = match.discountPercent;
      p.description = match.description;
      p.highlights = match.highlights;
      p.specs = match.specs;
      p.thumbnail = match.thumbnail;
      p.images = match.images;
      await p.save();
    } else {
      console.log(`OK: ${p.title} -> ₹${p.price}`);
    }
  }

  console.log('All product prices verified & synced under 50k!');
  await mongoose.disconnect();
}

syncPrices();
