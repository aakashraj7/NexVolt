import type { Product, Category } from '../types';

export const MOCK_CATEGORIES: Category[] = [
  {
    name: "Smartphones",
    count: 12,
    icon: "Smartphone",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
    description: "5G smartphones, AMOLED displays, and mobile accessories"
  },
  {
    name: "Laptops & Computers",
    count: 16,
    icon: "Laptop",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
    description: "Tablets, mechanical keyboards, precision mice, and monitors"
  },
  {
    name: "Audio & Headphones",
    count: 24,
    icon: "Headphones",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
    description: "Spatial audio, ANC over-ear headphones, and portable speakers"
  },
  {
    name: "Smartwatches & Wearables",
    count: 15,
    icon: "Watch",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    description: "Super AMOLED health watches, fitness bands, and trackers"
  },
  {
    name: "Gaming & VR",
    count: 18,
    icon: "Gamepad2",
    image: "https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=600&q=80",
    description: "Pro custom controllers, 300-hour gaming headsets, and gear"
  },
  {
    name: "Accessories & Power",
    count: 32,
    icon: "Zap",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80",
    description: "140W GaN power banks, charging cables, and cleaning kits"
  }
];

export const MOCK_PRODUCTS: Product[] = [
  // Budget Category Products (Under ₹1,000)
  {
    _id: "660000000000000000000021",
    title: "Portronics Toad 23 Wireless Optical Mouse (2.4GHz Nano USB Dongle, 1200 DPI)",
    slug: "portronics-toad-23-wireless-mouse",
    brand: "Portronics",
    category: "Laptops & Computers",
    subCategory: "Keyboards & Mice",
    price: 299,
    originalPrice: 699,
    discountPercent: 57,
    rating: 4.6,
    numReviews: 890,
    thumbnail: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80",
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "Ergonomic 2.4GHz wireless mouse with high-precision optical tracking and silent clicks.",
    description: "Portronics Toad 23 is a lightweight ergonomic wireless mouse engineered for smooth, hassle-free navigation with 10-meter range.",
    highlights: [
      "2.4GHz wireless connection with plug-and-play USB nano receiver",
      "1200 DPI high-precision optical sensor",
      "Ergonomic contoured shape designed for palm comfort"
    ],
    specs: [
      { key: "DPI", value: "1200 DPI" },
      { key: "Connectivity", value: "2.4GHz USB Nano Dongle" },
      { key: "Weight", value: "75g" }
    ],
    warranty: "1 Year Manufacturer Warranty",
    freeDelivery: true,
    tags: ["mouse", "wireless", "budget", "portronics", "usb", "optical"]
  },
  {
    _id: "660000000000000000000022",
    title: "boAt Bassheads 100 In-Ear Wired Earphones with HD Mic - Black Hawk",
    slug: "boat-bassheads-100-wired-earphones",
    brand: "boAt",
    category: "Audio & Headphones",
    subCategory: "Earbuds",
    price: 399,
    originalPrice: 999,
    discountPercent: 60,
    rating: 4.7,
    numReviews: 2450,
    thumbnail: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "10mm dynamic drivers with super extra bass and in-line HD microphone for crystal clear calls.",
    description: "The boAt Bassheads 100 wired earphones deliver a powerful, bass-driven audio experience with hawk-inspired styling.",
    highlights: [
      "10mm dynamic drivers delivering signature boAt Super Extra Bass",
      "In-line microphone with single button music and call control",
      "Gold-plated 3.5mm jack for lossless audio transmission"
    ],
    specs: [
      { key: "Driver Size", value: "10mm Dynamic" },
      { key: "Connector", value: "3.5mm Gold-Plated Audio Jack" }
    ],
    warranty: "1 Year boAt Brand Warranty",
    freeDelivery: true,
    tags: ["boat", "earphones", "bass", "audio", "wired", "mic", "budget"]
  },
  {
    _id: "660000000000000000000023",
    title: "Anker Powerline+ USB-C to USB-C 60W Fast Charging Braided Cable (6ft / 1.8m)",
    slug: "anker-powerline-plus-usb-c-cable",
    brand: "Anker",
    category: "Accessories & Power",
    subCategory: "Accessories",
    price: 499,
    originalPrice: 999,
    discountPercent: 50,
    rating: 4.9,
    numReviews: 1420,
    thumbnail: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "Ultra-durable double-braided nylon 60W Power Delivery fast-charging cable with 30,000+ bend lifespan.",
    description: "Supports 60W Power Delivery fast charging for USB-C laptops, tablets, and phones.",
    highlights: [
      "Supports 60W Power Delivery fast charging",
      "Double-braided nylon exterior with reinforced bulletproof fiber core",
      "480Mbps high-speed data transfer"
    ],
    specs: [
      { key: "Max Power Output", value: "60W (20V / 3A)" },
      { key: "Length", value: "6 Feet (1.8 Meters)" }
    ],
    warranty: "18 Months Anker Warranty",
    freeDelivery: true,
    tags: ["anker", "cable", "usbc", "fastcharging", "braided", "powerdelivery"]
  },
  {
    _id: "660000000000000000000024",
    title: "SanDisk Ultra 64GB MicroSDXC UHS-I Card (140MB/s A1 Class 10 Full HD)",
    slug: "sandisk-ultra-64gb-microsd-card",
    brand: "SanDisk",
    category: "Accessories & Power",
    subCategory: "Storage",
    price: 599,
    originalPrice: 1100,
    discountPercent: 46,
    rating: 4.8,
    numReviews: 3100,
    thumbnail: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80"
    ],
    isFeatured: false,
    isDeal: true,
    shortDescription: "Up to 140MB/s transfer speeds with A1 rating for faster app performance in smartphones and cameras.",
    description: "Up to 140MB/s transfer speeds to move up to 1000 photos in a minute.",
    highlights: [
      "Up to 140MB/s transfer read speeds",
      "A1-rated performance for faster mobile apps",
      "Includes SD adapter"
    ],
    specs: [
      { key: "Capacity", value: "64GB" },
      { key: "Read Speed", value: "Up to 140 MB/s" }
    ],
    warranty: "10 Years SanDisk Limited Warranty",
    freeDelivery: true,
    tags: ["sandisk", "microsd", "memorycard", "storage", "camera", "phone"]
  },
  {
    _id: "660000000000000000000025",
    title: "Portronics Clean M 8-in-1 Multi-Device Electronics & Keyboard Cleaning Kit",
    slug: "portronics-clean-m-8-in-1-cleaning-kit",
    brand: "Portronics",
    category: "Accessories & Power",
    subCategory: "Accessories",
    price: 349,
    originalPrice: 799,
    discountPercent: 56,
    rating: 4.7,
    numReviews: 680,
    thumbnail: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80"
    ],
    isFeatured: false,
    isDeal: true,
    shortDescription: "All-in-one cleaning tool for AirPods, keyboard keys, phone screens, lenses, and charging ports.",
    description: "Compact 8-in-1 cleaning kit equipped with a high-density brush, silicone cleaning tip, and flocking sponge.",
    highlights: [
      "8 essential tools in 1 compact portable design",
      "Keycap puller and high-density keyboard brush",
      "Screen cleaner spray with microfiber swipe surface"
    ],
    specs: [
      { key: "Tools Included", value: "8 Cleaning Tools + Spray Bottle" },
      { key: "Weight", value: "60g" }
    ],
    warranty: "6 Months Brand Warranty",
    freeDelivery: true,
    tags: ["cleaning", "accessories", "gadget", "portronics", "keyboard", "airpods"]
  },
  {
    _id: "660000000000000000000026",
    title: "Syska 10000mAh Ultra-Compact Fast Charging Power Bank with Dual USB Output",
    slug: "syska-10000mah-compact-power-bank",
    brand: "Syska",
    category: "Accessories & Power",
    subCategory: "Accessories",
    price: 899,
    originalPrice: 1599,
    discountPercent: 44,
    rating: 4.6,
    numReviews: 950,
    thumbnail: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "Pocket-sized 10,000mAh high-density power bank with multi-layer circuit protection and dual outputs.",
    description: "Syska Power Pocket packs 10,000mAh in a pocket-friendly form factor with dual USB-A output ports.",
    highlights: [
      "10,000 mAh high-density Lithium Polymer battery",
      "Dual USB-A output to charge 2 devices simultaneously",
      "12-layer advanced smart IC circuit protection"
    ],
    specs: [
      { key: "Capacity", value: "10,000 mAh (37Wh)" },
      { key: "Output Ports", value: "2x USB-A (5V / 2.4A Max)" }
    ],
    warranty: "1 Year Syska Warranty",
    freeDelivery: true,
    tags: ["syska", "powerbank", "battery", "portable", "budget", "usb"]
  },

  // Main Products
  {
    _id: "660000000000000000000001",
    title: "Apple iPad 10th Gen (10.9\" Liquid Retina, A14 Bionic, 64GB Wi-Fi) - Blue",
    slug: "apple-ipad-10th-gen-64gb",
    brand: "Apple",
    category: "Laptops & Computers",
    subCategory: "Tablets",
    price: 29900,
    originalPrice: 34900,
    discountPercent: 14,
    rating: 4.8,
    numReviews: 428,
    thumbnail: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "All-screen design with 10.9-inch Liquid Retina display, A14 Bionic chip, and Apple Pencil support.",
    description: "The colorful iPad is more capable, intuitive, and fun.",
    highlights: [
      "Striking 10.9-inch Liquid Retina display",
      "A14 Bionic chip with 6-core CPU"
    ],
    specs: [
      { key: "Processor", value: "A14 Bionic chip" }
    ],
    warranty: "1 Year Apple Limited Warranty",
    freeDelivery: true,
    tags: ["ipad", "apple", "tablet", "a14", "retina"]
  },
  {
    _id: "660000000000000000000002",
    title: "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones",
    slug: "sony-wh-1000xm5-wireless-headphones",
    brand: "Sony",
    category: "Audio & Headphones",
    subCategory: "Over-Ear Headphones",
    price: 24990,
    originalPrice: 29990,
    discountPercent: 17,
    rating: 4.8,
    numReviews: 1240,
    thumbnail: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "Industry-leading noise canceling with 2 processors, 8 microphones, and Auto NC Optimizer.",
    description: "The WH-1000XM5 headphones rewrite the rules for distraction-free listening.",
    highlights: [
      "Magnificent Sound with Integrated Processor V1",
      "Up to 30-hour battery life"
    ],
    specs: [
      { key: "Battery Life", value: "30 hours" }
    ],
    warranty: "1 Year Brand Warranty",
    freeDelivery: true,
    tags: ["sony", "audio", "headphones", "anc"]
  },
  {
    _id: "660000000000000000000003",
    title: "Nothing Phone (2a) Plus 5G (12GB RAM, 256GB Storage) - Metallic Grey",
    slug: "nothing-phone-2a-plus-5g",
    brand: "Nothing",
    category: "Smartphones",
    subCategory: "Flagship Phones",
    price: 23999,
    originalPrice: 27999,
    discountPercent: 14,
    rating: 4.7,
    numReviews: 610,
    thumbnail: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "Custom MediaTek Dimensity 7350 Pro 5G, iconic Glyph Interface, and 50MP dual cameras.",
    description: "Extra power, extra pixels, extra unique.",
    highlights: [
      "Custom Dimensity 7350 Pro 5G",
      "50MP Main + 50MP Front"
    ],
    specs: [
      { key: "Processor", value: "MediaTek Dimensity 7350 Pro" }
    ],
    warranty: "1 Year Brand Warranty",
    freeDelivery: true,
    tags: ["nothing", "smartphone", "5g", "glyph"]
  },
  {
    _id: "660000000000000000000004",
    title: "ASUS TUF Gaming 27\" QHD 180Hz Fast-IPS HDR Gaming Monitor (VG27AQML1A)",
    slug: "asus-tuf-gaming-27-qhd-180hz-monitor",
    brand: "ASUS",
    category: "Laptops & Computers",
    subCategory: "Gaming Gear",
    price: 18499,
    originalPrice: 22999,
    discountPercent: 20,
    rating: 4.8,
    numReviews: 290,
    thumbnail: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "27-inch 2560x1440 Fast IPS panel with overclocked 180Hz refresh rate and 1ms GTG response.",
    description: "Designed for professional gamers and immersive gameplay.",
    highlights: [
      "27-inch QHD (2560 x 1440) Fast IPS",
      "180Hz refresh rate"
    ],
    specs: [
      { key: "Screen Size", value: "27.0 inch QHD" }
    ],
    warranty: "3 Years ASUS Onsite Warranty",
    freeDelivery: true,
    tags: ["asus", "monitor", "gaming", "180hz"]
  },
  {
    _id: "660000000000000000000005",
    title: "Sony PlayStation 5 DualSense Edge Wireless Controller",
    slug: "sony-ps5-dualsense-edge-controller",
    brand: "Sony",
    category: "Gaming & VR",
    subCategory: "Gaming Controllers",
    price: 14990,
    originalPrice: 18990,
    discountPercent: 21,
    rating: 4.9,
    numReviews: 380,
    thumbnail: "https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: false,
    shortDescription: "Ultra-customizable pro controller with swappable stick modules, mappable back buttons, and braided cable.",
    description: "Get an edge in gameplay with custom controls.",
    highlights: [
      "Changeable stick caps",
      "Mappable back buttons"
    ],
    specs: [
      { key: "Compatibility", value: "PS5, PC, Mac, iOS, Android" }
    ],
    warranty: "1 Year Sony India Warranty",
    freeDelivery: true,
    tags: ["ps5", "playstation", "controller", "gaming"]
  },
  {
    _id: "660000000000000000000006",
    title: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard (QMK/VIA, CNC Aluminum)",
    slug: "keychron-q1-pro-wireless-mechanical-keyboard",
    brand: "Keychron",
    category: "Laptops & Computers",
    subCategory: "Keyboards & Mice",
    price: 12499,
    originalPrice: 15999,
    discountPercent: 22,
    rating: 4.9,
    numReviews: 450,
    thumbnail: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "75% full metal wireless custom mechanical keyboard with hot-swappable Keychron K Pro switches.",
    description: "Keychron Q1 Pro full metal wireless custom mechanical keyboard.",
    highlights: [
      "Full CNC 6063 aluminum body",
      "Wireless Bluetooth 5.1 & Type-C"
    ],
    specs: [
      { key: "Layout", value: "75% Exploded Layout" }
    ],
    warranty: "1 Year Manufacturer Warranty",
    freeDelivery: true,
    tags: ["keyboard", "mechanical", "keychron"]
  },
  {
    _id: "660000000000000000000007",
    title: "Marshall Emberton II Portable Bluetooth Speaker - Black & Brass",
    slug: "marshall-emberton-ii-portable-speaker",
    brand: "Marshall",
    category: "Audio & Headphones",
    subCategory: "Portable Audio",
    price: 11999,
    originalPrice: 14999,
    discountPercent: 20,
    rating: 4.8,
    numReviews: 512,
    thumbnail: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "Compact portable speaker with 30+ hours of playtime and 360° True Stereophonic sound.",
    description: "Emberton II compact portable speaker with loud and vibrant Marshall sound.",
    highlights: [
      "Signature Marshall sound",
      "30+ hours playtime"
    ],
    specs: [
      { key: "Water Resistance", value: "IP67" }
    ],
    warranty: "1 Year Official Brand Warranty",
    freeDelivery: true,
    tags: ["marshall", "speaker", "bluetooth"]
  },
  {
    _id: "660000000000000000000008",
    title: "Samsung Galaxy Watch 6 Bluetooth 40mm (Super AMOLED, Sapphire Crystal)",
    slug: "samsung-galaxy-watch-6-40mm",
    brand: "Samsung",
    category: "Smartphones",
    subCategory: "Smart Watches",
    price: 16999,
    originalPrice: 21999,
    discountPercent: 23,
    rating: 4.7,
    numReviews: 340,
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "Advanced health monitoring, Sleep Coaching, BioActive sensor, and 20% larger display.",
    description: "Everyday wellness with Galaxy Watch 6.",
    highlights: [
      "1.3\" Super AMOLED",
      "BioActive Sensor (HR + ECG + BIA)"
    ],
    specs: [
      { key: "Display", value: "1.3\" Super AMOLED" }
    ],
    warranty: "1 Year Samsung India Warranty",
    freeDelivery: true,
    tags: ["samsung", "smartwatch", "fitness"]
  },
  {
    _id: "660000000000000000000009",
    title: "Logitech MX Master 3S Wireless Performance Mouse - Graphite",
    slug: "logitech-mx-master-3s-wireless-mouse",
    brand: "Logitech",
    category: "Laptops & Computers",
    subCategory: "Keyboards & Mice",
    price: 7995,
    originalPrice: 9995,
    discountPercent: 20,
    rating: 4.9,
    numReviews: 1890,
    thumbnail: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: false,
    shortDescription: "8K DPI any-surface tracking, Quiet Clicks, and MagSpeed electromagnetic scrolling.",
    description: "MX Master 3S precision mouse.",
    highlights: [
      "8,000 DPI sensor",
      "Quiet Click buttons"
    ],
    specs: [
      { key: "DPI", value: "8000 DPI" }
    ],
    warranty: "1 Year Limited Hardware Warranty",
    freeDelivery: true,
    tags: ["logitech", "mouse", "mxmaster"]
  },
  {
    _id: "660000000000000000000010",
    title: "Anker 737 Power Bank (PowerCore 24K, 140W Fast Charging, Smart Digital Display)",
    slug: "anker-737-power-bank-140w-24k",
    brand: "Anker",
    category: "Accessories & Power",
    subCategory: "Accessories",
    price: 8999,
    originalPrice: 11999,
    discountPercent: 25,
    rating: 4.9,
    numReviews: 760,
    thumbnail: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "Ultra-powerful 140W two-way fast charging with 24,000mAh capacity and smart color digital display.",
    description: "140W ultra-powerful charge for MacBook, laptops, phones, and tablets.",
    highlights: [
      "140W two-way fast charging",
      "24,000mAh capacity"
    ],
    specs: [
      { key: "Capacity", value: "24,000 mAh" }
    ],
    warranty: "2 Years Anker Brand Warranty",
    freeDelivery: true,
    tags: ["anker", "powerbank", "fastcharging"]
  },
  {
    _id: "660000000000000000000011",
    title: "Sony WF-1000XM5 True Wireless Noise Canceling Earbuds",
    slug: "sony-wf-1000xm5-true-wireless-earbuds",
    brand: "Sony",
    category: "Audio & Headphones",
    subCategory: "Earbuds",
    price: 17990,
    originalPrice: 21990,
    discountPercent: 18,
    rating: 4.8,
    numReviews: 690,
    thumbnail: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: true,
    shortDescription: "Industry-leading noise cancellation with Dynamic Driver X and AI noise reduction.",
    description: "WF-1000XM5 noise-canceling earbuds.",
    highlights: [
      "Dynamic Driver X",
      "Up to 24 hours battery life"
    ],
    specs: [
      { key: "Driver Unit", value: "8.4 mm" }
    ],
    warranty: "1 Year Official Brand Warranty",
    freeDelivery: true,
    tags: ["sony", "earbuds", "tws", "anc"]
  },
  {
    _id: "660000000000000000000012",
    title: "HyperX Cloud Alpha Wireless Gaming Headset (300-Hour Battery Life)",
    slug: "hyperx-cloud-alpha-wireless-headset",
    brand: "HyperX",
    category: "Gaming & VR",
    subCategory: "Gaming Audio",
    price: 13499,
    originalPrice: 16999,
    discountPercent: 21,
    rating: 4.9,
    numReviews: 410,
    thumbnail: "https://images.unsplash.com/photo-1599669454699-248893623440?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1599669454699-248893623440?w=800&q=80"
    ],
    isFeatured: true,
    isDeal: false,
    shortDescription: "Massive 300 hours of battery life, Dual Chamber 50mm drivers, and DTS Headphone:X Spatial Audio.",
    description: "Play for over a week with 300 hours of battery life.",
    highlights: [
      "300 hours battery life",
      "DTS Spatial Audio"
    ],
    specs: [
      { key: "Battery Life", value: "Up to 300 Hours" }
    ],
    warranty: "2 Years HyperX Manufacturer Warranty",
    freeDelivery: true,
    tags: ["hyperx", "headset", "gaming", "wireless"]
  }
];
