export interface Spec {
  key: string;
  value: string;
}

export interface Review {
  _id?: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  verifiedPurchase?: boolean;
  date?: string;
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  brand: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  numReviews: number;
  inStock: boolean;
  stockCount: number;
  thumbnail: string;
  images: string[];
  badge?: string;
  isFeatured?: boolean;
  isDeal?: boolean;
  shortDescription: string;
  description: string;
  highlights?: string[];
  specs: Spec[];
  warranty?: string;
  freeDelivery?: boolean;
  tags?: string[];
  reviews?: Review[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedVariant?: string;
  priceAtAddition: number;
}

export interface Coupon {
  code: string;
  discountPercent: number;
}

export interface Category {
  name: string;
  count: number;
  icon: string;
  image: string;
  description: string;
}

export interface OrderItem {
  product: string | Product;
  title: string;
  thumbnail: string;
  price: number;
  quantity: number;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

export interface Order {
  _id?: string;
  orderId: string;
  userId: string;
  customerDetails: CustomerDetails;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  checkoutStatus: 'initiated' | 'abandoned' | 'recovered' | 'completed';
  createdAt?: string;
}

export type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'rating' | 'discount' | 'popular';
