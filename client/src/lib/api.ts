import axios from 'axios';
import type { Product, Category, Order } from '../types';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export const api = {
  // Products
  async getProducts(params?: {
    search?: string;
    category?: string;
    brand?: string;
    merchantId?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    isFeatured?: boolean;
    isDeal?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number; filters: { brands: string[]; categories: string[] } }> {
    try {
      const res = await apiClient.get('/products', { params });
      if (res.data && res.data.success) {
        return {
          products: res.data.products,
          total: res.data.total,
          filters: res.data.filters || { brands: [], categories: [] }
        };
      }
    } catch (err) {
      console.warn('Backend API unavailable, using local product catalog data:', err);
    }

    // Fallback client-side filtering
    let list = [...MOCK_PRODUCTS];
    if (params?.merchantId) {
      list = list.filter(p => p.merchantId === params.merchantId);
    }
    if (params?.isFeatured) {
      list = list.filter(p => p.isFeatured);
    }
    if (params?.isDeal) {
      list = list.filter(p => p.isDeal);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (params?.category) {
      const cats = params.category.split(',').map(c => c.trim().toLowerCase());
      list = list.filter(p => cats.includes(p.category.toLowerCase()));
    }
    if (params?.brand) {
      const brands = params.brand.split(',').map(b => b.trim().toLowerCase());
      list = list.filter(p => brands.includes(p.brand.toLowerCase()));
    }
    if (params?.minPrice !== undefined) {
      list = list.filter(p => p.price >= (params.minPrice || 0));
    }
    if (params?.maxPrice !== undefined) {
      list = list.filter(p => p.price <= (params.maxPrice || Infinity));
    }
    if (params?.rating !== undefined) {
      list = list.filter(p => p.rating >= (params.rating || 0));
    }

    // Sorting
    if (params?.sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (params?.sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (params?.sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (params?.sort === 'discount') {
      list.sort((a, b) => b.discountPercent - a.discountPercent);
    } else if (params?.sort === 'popular') {
      list.sort((a, b) => b.numReviews - a.numReviews);
    }

    const allBrands = Array.from(new Set(MOCK_PRODUCTS.map(p => p.brand)));
    const allCategories = Array.from(new Set(MOCK_PRODUCTS.map(p => p.category)));

    return {
      products: list,
      total: list.length,
      filters: { brands: allBrands, categories: allCategories }
    };
  },

  async getProduct(idOrSlug: string): Promise<{ product: Product; related: Product[] }> {
    try {
      const res = await apiClient.get(`/products/${idOrSlug}`);
      if (res.data && res.data.success) {
        return {
          product: res.data.product,
          related: res.data.related || []
        };
      }
    } catch (err) {
      console.warn('Backend API unavailable, using local mock data for product:', err);
    }

    const found = MOCK_PRODUCTS.find(p => p._id === idOrSlug || p.slug === idOrSlug) || MOCK_PRODUCTS[0];
    const related = MOCK_PRODUCTS.filter(p => p.category === found.category && p._id !== found._id).slice(0, 4);
    return { product: found, related };
  },

  async getFeaturedDeals(): Promise<Product[]> {
    try {
      const res = await apiClient.get('/products/deals');
      if (res.data && res.data.success) {
        return res.data.deals;
      }
    } catch (err) {
      console.warn('Backend API deals unavailable, using local mock data');
    }
    return MOCK_PRODUCTS.filter(p => p.isDeal);
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await apiClient.get('/categories');
      if (res.data && res.data.success) {
        return res.data.categories;
      }
    } catch (err) {
      console.warn('Backend API categories unavailable, using local mock data');
    }
    return MOCK_CATEGORIES;
  },

  // Cart API
  async getCart(userId: string) {
    try {
      const res = await apiClient.get(`/cart/${userId}`);
      if (res.data && res.data.success) {
        return res.data.cart;
      }
    } catch (err) {
      console.warn('Backend cart API unavailable');
    }
    return null;
  },

  async addToCart(userId: string, productId: string, quantity = 1, userEmail = '') {
    try {
      const res = await apiClient.post(`/cart/${userId}/add`, { productId, quantity, userEmail });
      if (res.data && res.data.success) {
        return res.data.cart;
      }
    } catch (err) {
      console.warn('Backend addToCart unavailable');
    }
    return null;
  },

  async updateCartItem(userId: string, productId: string, quantity: number) {
    try {
      const res = await apiClient.put(`/cart/${userId}/update`, { productId, quantity });
      if (res.data && res.data.success) {
        return res.data.cart;
      }
    } catch (err) {
      console.warn('Backend updateCart unavailable');
    }
    return null;
  },

  async removeCartItem(userId: string, productId: string) {
    try {
      const res = await apiClient.delete(`/cart/${userId}/remove/${productId}`);
      if (res.data && res.data.success) {
        return res.data.cart;
      }
    } catch (err) {
      console.warn('Backend removeCart unavailable');
    }
    return null;
  },

  async clearCart(userId: string) {
    try {
      const res = await apiClient.delete(`/cart/${userId}/clear`);
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend clearCart unavailable');
    }
    return null;
  },

  // Wishlist API
  async getWishlist(userId: string) {
    try {
      const res = await apiClient.get(`/wishlist/${userId}`);
      if (res.data && res.data.success) {
        return res.data.wishlist?.products || [];
      }
    } catch (err) {
      console.warn('Backend getWishlist unavailable');
    }
    return null;
  },

  async toggleWishlist(userId: string, productId: string) {
    try {
      const res = await apiClient.post(`/wishlist/${userId}/toggle`, { productId });
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend toggleWishlist unavailable');
    }
    return null;
  },

  async clearWishlist(userId: string) {
    try {
      const res = await apiClient.delete(`/wishlist/${userId}/clear`);
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend clearWishlist unavailable');
    }
    return null;
  },

  // Orders & Revenue Recovery
  async initiateOrder(orderData: Partial<Order>) {
    try {
      const res = await apiClient.post('/orders/initiate', orderData);
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend initiateOrder unavailable');
    }
    return {
      success: true,
      orderId: 'NV-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000),
      order: orderData
    };
  },

  async getOrderById(orderId: string) {
    try {
      const res = await apiClient.get(`/orders/single/${orderId}`);
      if (res.data && res.data.success) {
        return res.data.order;
      }
    } catch (err) {
      console.warn('Backend getOrderById unavailable');
    }
    return null;
  },

  async completeOrder(orderId: string, paymentId?: string, paymentMethod?: string) {
    try {
      const res = await apiClient.post(`/orders/${orderId}/complete`, { paymentId, paymentMethod });
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend completeOrder unavailable');
    }
    return { success: true };
  },

  async failOrder(orderId: string, reason?: string) {
    try {
      const res = await apiClient.post(`/orders/${orderId}/fail`, { reason });
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend failOrder unavailable');
    }
    return { success: true };
  },

  async markAbandonedOrder(orderId: string) {
    try {
      await apiClient.post(`/orders/${orderId}/abandon`);
    } catch (err) {
      console.warn('Backend markAbandoned unavailable');
    }
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const res = await apiClient.get(`/orders/user/${userId}`);
      if (res.data && res.data.success) {
        return res.data.orders;
      }
    } catch (err) {
      console.warn('Backend getUserOrders unavailable');
    }
    return [];
  },

  // Merchant & Seller API
  async getMerchantStats(merchantId?: string) {
    try {
      const res = await apiClient.get('/merchant/stats', { params: { merchantId } });
      if (res.data && res.data.success) {
        return res.data.stats;
      }
    } catch (err) {
      console.warn('Backend getMerchantStats unavailable');
    }
    return null;
  },

  async getMerchantProducts(merchantId: string, params?: { search?: string; category?: string; page?: number; limit?: number }) {
    try {
      const res = await apiClient.get('/merchant/products', { params: { merchantId, ...params } });
      if (res.data && res.data.success) {
        return {
          products: res.data.products,
          total: res.data.total
        };
      }
    } catch (err) {
      console.warn('Backend getMerchantProducts unavailable, falling back to filter:', err);
    }
    return { products: [], total: 0 };
  },

  async getMerchantOrders(params?: { status?: string; search?: string; merchantId?: string }) {
    try {
      const res = await apiClient.get('/merchant/orders', { params });
      if (res.data && res.data.success) {
        return res.data.orders;
      }
    } catch (err) {
      console.warn('Backend getMerchantOrders unavailable');
    }
    return [];
  },

  async updateOrderStatus(orderId: string, paymentStatus?: string, checkoutStatus?: string) {
    try {
      const res = await apiClient.put(`/merchant/orders/${orderId}/status`, { paymentStatus, checkoutStatus });
      return res.data;
    } catch (err) {
      console.warn('Backend updateOrderStatus unavailable');
      return null;
    }
  },

  async createMerchantProduct(productData: any) {
    try {
      const res = await apiClient.post('/merchant/products', productData);
      return res.data;
    } catch (err: any) {
      console.warn('Backend createProduct error:', err);
      throw err;
    }
  },

  async updateMerchantProduct(id: string, updates: any) {
    try {
      const res = await apiClient.put(`/merchant/products/${id}`, updates);
      return res.data;
    } catch (err: any) {
      console.warn('Backend updateProduct error:', err);
      throw err;
    }
  },

  async deleteMerchantProduct(id: string) {
    try {
      const res = await apiClient.delete(`/merchant/products/${id}`);
      return res.data;
    } catch (err: any) {
      console.warn('Backend deleteProduct error:', err);
      throw err;
    }
  },

  // User Profile & Custom Addresses & Password Management
  async getUserProfile(userId: string, params?: { email?: string; fullName?: string; provider?: string }) {
    try {
      const res = await apiClient.get(`/users/profile/${userId}`, { params });
      if (res.data && res.data.success) {
        return res.data.profile;
      }
    } catch (err) {
      console.warn('Backend getUserProfile unavailable');
    }
    return null;
  },

  async updateUserProfile(userId: string, data: any) {
    try {
      const res = await apiClient.post(`/users/profile/${userId}`, data);
      return res.data;
    } catch (err) {
      console.warn('Backend updateUserProfile error:', err);
      throw err;
    }
  },

  async addUserAddress(userId: string, addressData: any) {
    try {
      const res = await apiClient.post(`/users/profile/${userId}/addresses`, addressData);
      return res.data;
    } catch (err) {
      console.warn('Backend addUserAddress error:', err);
      throw err;
    }
  },

  async updateUserAddress(userId: string, addressId: string, addressData: any) {
    try {
      const res = await apiClient.put(`/users/profile/${userId}/addresses/${addressId}`, addressData);
      return res.data;
    } catch (err) {
      console.warn('Backend updateUserAddress error:', err);
      throw err;
    }
  },

  async deleteUserAddress(userId: string, addressId: string) {
    try {
      const res = await apiClient.delete(`/users/profile/${userId}/addresses/${addressId}`);
      return res.data;
    } catch (err) {
      console.warn('Backend deleteUserAddress error:', err);
      throw err;
    }
  },

  async setDefaultUserAddress(userId: string, addressId: string) {
    try {
      const res = await apiClient.put(`/users/profile/${userId}/addresses/${addressId}/default`);
      return res.data;
    } catch (err) {
      console.warn('Backend setDefaultUserAddress error:', err);
      throw err;
    }
  },

  async sendPasswordVerificationCode(email: string, type: 'create' | 'reset' = 'create') {
    try {
      const res = await apiClient.post('/users/password/send-code', { email, type });
      return res.data;
    } catch (err: any) {
      console.warn('Backend sendPasswordVerificationCode error:', err);
      throw err;
    }
  },

  async verifyAndSetPassword(payload: { userId?: string; email: string; code: string; newPassword: string }) {
    try {
      const res = await apiClient.post('/users/password/verify-and-set', payload);
      return res.data;
    } catch (err: any) {
      console.warn('Backend verifyAndSetPassword error:', err);
      throw err;
    }
  },

  async sendPhoneOtp(userId: string, phone: string) {
    try {
      const res = await apiClient.post('/users/send-phone-otp', { userId, phone });
      return res.data;
    } catch (err: any) {
      console.warn('Backend sendPhoneOtp error:', err);
      throw err;
    }
  },

  async verifyPhoneOtp(userId: string, phone: string, otp: string) {
    try {
      const res = await apiClient.post('/users/verify-phone-otp', { userId, phone, otp });
      return res.data;
    } catch (err: any) {
      console.warn('Backend verifyPhoneOtp error:', err);
      throw err;
    }
  },

  async sendEmailOtp(userId: string, email: string) {
    try {
      const res = await apiClient.post('/users/send-email-otp', { userId, email });
      return res.data;
    } catch (err: any) {
      console.warn('Backend sendEmailOtp error:', err);
      throw err;
    }
  },

  async verifyEmailOtp(userId: string, otp: string) {
    try {
      const res = await apiClient.post('/users/verify-email-otp', { userId, otp });
      return res.data;
    } catch (err: any) {
      console.warn('Backend verifyEmailOtp error:', err);
      throw err;
    }
  },

  async checkPhoneAvailability(phone: string, userId?: string) {
    try {
      const res = await apiClient.get('/users/check-phone', { params: { phone, userId } });
      return res.data;
    } catch (err) {
      console.warn('Backend checkPhoneAvailability error:', err);
      return { available: true };
    }
  },

  async getMerchantProfile(userId: string, initialData?: { email?: string; fullName?: string; storeName?: string; provider?: string; authProvider?: string }) {
    try {
      const res = await apiClient.get(`/users/merchant-profile/${userId}`, { params: initialData });
      return res.data;
    } catch (err) {
      console.warn('Backend getMerchantProfile error:', err);
      return null;
    }
  },

  async updateMerchantProfile(userId: string, merchantData: any) {
    try {
      const res = await apiClient.post(`/users/merchant-profile/${userId}`, merchantData);
      return res.data;
    } catch (err) {
      console.warn('Backend updateMerchantProfile error:', err);
      throw err;
    }
  },

  async checkUserRole(userId: string, email?: string, provider?: string) {
    try {
      const res = await apiClient.get(`/users/check-role/${userId || 'guest'}`, { params: { email, provider } });
      return res.data;
    } catch (err) {
      console.warn('Backend checkUserRole error:', err);
      return { exists: false, isMerchant: false, role: 'user' };
    }
  },

  async enforcePortalGuard(payload: { userId?: string; email?: string; portal: 'customer' | 'merchant' }) {
    try {
      const res = await apiClient.post('/users/enforce-portal-guard', payload);
      return res.data;
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data;
      }
      return { allowed: true };
    }
  },

  async deactivateCustomerAccount(userId: string) {
    try {
      const res = await apiClient.post(`/users/deactivate-customer/${userId}`);
      return res.data;
    } catch (err: any) {
      console.warn('Backend deactivateCustomerAccount error:', err);
      throw err;
    }
  },

  async deactivateMerchantAccount(userId: string) {
    try {
      const res = await apiClient.post(`/users/deactivate-merchant/${userId}`);
      return res.data;
    } catch (err: any) {
      console.warn('Backend deactivateMerchantAccount error:', err);
      throw err;
    }
  },

  async uploadImage(image: string, folder: string = 'nexvolt_products') {
    try {
      const res = await apiClient.post('/upload', { image, folder });
      return res.data;
    } catch (err: any) {
      console.warn('Backend uploadImage error:', err);
      // Fallback returning original image string if network/server has error
      return { success: true, url: image, isLocalFallback: true };
    }
  }
};
