import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function inspectProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({}).select('title brand category price originalPrice discountPercent');
  console.log(JSON.stringify(products, null, 2));
  await mongoose.disconnect();
}

inspectProducts().catch(console.error);
