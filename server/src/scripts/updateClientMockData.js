import fs from 'fs';
import path from 'path';

const dumped = JSON.parse(fs.readFileSync('src/scripts/dumpedProducts.json', 'utf8'));

const mockCategories = [
  {
    name: "Smartphones",
    count: 12,
    icon: "Smartphone",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
    description: "5G titanium flagships, AMOLED screens, and performance smartphones"
  },
  {
    name: "Laptops & Computers",
    count: 16,
    icon: "Laptop",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    description: "M3 Max MacBooks, Fast-IPS monitors, iPads, and precision mice"
  },
  {
    name: "Audio & Headphones",
    count: 24,
    icon: "Headphones",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
    description: "Industry-leading ANC headphones, Marshall speakers, and earbuds"
  },
  {
    name: "Smartwatches & Wearables",
    count: 15,
    icon: "Watch",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    description: "Super AMOLED health watches, sapphire crystal glass, and fitness trackers"
  },
  {
    name: "Gaming & VR",
    count: 18,
    icon: "Gamepad2",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=80",
    description: "PS5 Slim consoles, DualSense controllers, and RGB mechanical setups"
  },
  {
    name: "Cameras & Drones",
    count: 10,
    icon: "Camera",
    image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&q=80",
    description: "4K HDR quadcopters, full-frame mirrorless cameras, and optics"
  },
  {
    name: "Accessories & Power",
    count: 32,
    icon: "Zap",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80",
    description: "Fast-charging power banks, braided cables, and high-speed storage"
  }
];

const fileContent = `import type { Product, Category } from '../types';

export const MOCK_CATEGORIES: Category[] = ${JSON.stringify(mockCategories, null, 2)};

export const MOCK_PRODUCTS: Product[] = ${JSON.stringify(dumped, null, 2)};
`;

const clientMockPath = path.resolve('../client/src/lib/mockData.ts');
fs.writeFileSync(clientMockPath, fileContent, 'utf8');
console.log('Successfully updated client/src/lib/mockData.ts with', dumped.length, 'products!');
