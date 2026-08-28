import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

const CATEGORY_META = {
  "Smartphones": {
    icon: "Smartphone",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80",
    description: "Flagships, foldable phones, and 5G powerhouses"
  },
  "Laptops & Computers": {
    icon: "Laptop",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    description: "Pro creator workstations, OLED ultrabooks, and gaming beasts"
  },
  "Audio & Headphones": {
    icon: "Headphones",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
    description: "Spatial audio, ANC headphones, and studio monitors"
  },
  "Smartwatches & Wearables": {
    icon: "Watch",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    description: "Fitness trackers, titanium adventure watches, and health bands"
  },
  "Gaming & VR": {
    icon: "Gamepad2",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=80",
    description: "Next-gen consoles, VR headsets, and ultra-fast controllers"
  },
  "Cameras & Drones": {
    icon: "Camera",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80",
    description: "4K cine drones, mirrorless full-frame sensors, and gimbals"
  },
  "Accessories & Power": {
    icon: "Zap",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80",
    description: "250W GaN power banks, custom mechanical keyboards, and docks"
  }
};

// GET /api/categories - Get all categories with product counts and metadata
router.get('/', async (req, res) => {
  try {
    const counts = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach(item => {
      countMap[item._id] = item.count;
    });

    const categories = Object.keys(CATEGORY_META).map(name => ({
      name,
      count: countMap[name] || 0,
      icon: CATEGORY_META[name].icon,
      image: CATEGORY_META[name].image,
      description: CATEGORY_META[name].description
    }));

    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching categories', error: error.message });
  }
});

export default router;
