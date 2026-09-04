import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function dumpProductsForMock() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({}).lean();
  console.log('// DUMPED PRODUCTS COUNT:', products.length);
  
  // Format for mockData.ts
  const cleaned = products.map(p => ({
    _id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    subCategory: p.subCategory,
    price: p.price,
    originalPrice: p.originalPrice,
    discountPercent: p.discountPercent,
    rating: p.rating,
    numReviews: p.numReviews,
    thumbnail: p.thumbnail,
    images: p.images,
    badge: p.badge,
    isFeatured: p.isFeatured,
    isDeal: p.isDeal,
    shortDescription: p.shortDescription,
    description: p.description,
    highlights: p.highlights,
    specs: p.specs,
    warranty: p.warranty,
    freeDelivery: p.freeDelivery,
    tags: p.tags
  }));

  import('fs').then(fs => {
    fs.writeFileSync('src/scripts/dumpedProducts.json', JSON.stringify(cleaned, null, 2));
    console.log('Saved to src/scripts/dumpedProducts.json');
  });

  await mongoose.disconnect();
}

dumpProductsForMock().catch(console.error);
