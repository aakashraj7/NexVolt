import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import type { Product, CartItem, Coupon } from '../types';
import { useToast } from './ToastContext';
import { api } from '../lib/api';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedVariant?: string) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  totalItems: number;
  subtotal: number;
  discount: number;
  coupon: Coupon | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  shipping: number;
  tax: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'nexvolt_cart_items';
const COUPON_STORAGE_KEY = 'nexvolt_applied_coupon';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [coupon, setCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync Cart with MongoDB on login, and reset on logout
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setCart([]);
      setCoupon(null);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(COUPON_STORAGE_KEY);
      } catch (e) {
        console.error(e);
      }
      return;
    }

    const syncUserCart = async () => {
      if (isLoaded && isSignedIn && user?.id) {
        try {
          const dbCart = await api.getCart(user.id);
          if (dbCart && Array.isArray(dbCart.items)) {
            // Format db items into CartItem format
            const formatted: CartItem[] = dbCart.items
              .filter((item: any) => item.product)
              .map((item: any) => ({
                product: item.product,
                quantity: item.quantity,
                selectedColor: item.selectedColor || '',
                selectedVariant: item.selectedVariant || '',
                priceAtAddition: item.priceAtAddition || item.product?.price || 0
              }));
            setCart(formatted);
          }
        } catch (err) {
          console.error('Error fetching user cart from DB:', err);
        }
      }
    };

    syncUserCart();
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      if (coupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save coupon to localStorage', e);
    }
  }, [coupon]);

  const isInCart = useCallback((productId: string) => {
    return cart.some((item) => item.product?._id === productId);
  }, [cart]);

  const addToCart = (product: Product, quantity = 1, selectedColor = '', selectedVariant = ''): boolean => {
    if (!isSignedIn) {
      showToast('Please sign in to add items to your cart.', 'info');
      navigate('/sign-in');
      return false;
    }

    setCart((prev) => {
      const index = prev.findIndex((item) => item.product._id === product._id);
      if (index > -1) {
        const next = [...prev];
        next[index].quantity += quantity;
        return next;
      }
      return [
        ...prev,
        {
          product,
          quantity,
          selectedColor,
          selectedVariant,
          priceAtAddition: product.price
        }
      ];
    });

    // Save progress to MongoDB
    if (user?.id) {
      api.addToCart(user.id, product._id, quantity, user.primaryEmailAddress?.emailAddress);
    }

    showToast(`Added "${product.title.slice(0, 28)}..." to cart!`, 'success');
    return true;
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (!isSignedIn) {
      showToast('Please sign in to manage your cart.', 'info');
      navigate('/sign-in');
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    );

    // Save progress to MongoDB
    if (user?.id) {
      api.updateCartItem(user.id, productId, quantity);
    }
  };

  const removeFromCart = (productId: string) => {
    const itemToRemove = cart.find((item) => item.product._id === productId);
    setCart((prev) => prev.filter((item) => item.product._id !== productId));

    // Save progress to MongoDB
    if (user?.id) {
      api.removeCartItem(user.id, productId);
    }

    if (itemToRemove) {
      showToast(`Removed "${itemToRemove.product.title.slice(0, 24)}..." from cart`, 'info');
    }
  };

  const clearCart = () => {
    setCart([]);
    setCoupon(null);

    // Save progress to MongoDB
    if (user?.id) {
      api.clearCart(user.id);
    }
  };

  const applyCoupon = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    const VALID_COUPONS: Record<string, number> = {
      'NEXVOLT10': 10,
      'RAZORPAY20': 20,
      'SUPERTECH15': 15,
      'RECOVER500': 10
    };

    if (VALID_COUPONS[clean]) {
      setCoupon({
        code: clean,
        discountPercent: VALID_COUPONS[clean]
      });
      showToast(`Coupon ${clean} applied! You saved ${VALID_COUPONS[clean]}%`, 'success');
      return true;
    } else {
      showToast('Invalid promo code. Try NEXVOLT10 or RAZORPAY20', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    showToast('Coupon removed', 'info');
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);
  const discount = coupon ? Math.round((subtotal * coupon.discountPercent) / 100) : 0;
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.18); // 18% GST for electronics
  const totalAmount = taxableAmount + tax + shipping;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isInCart,
        totalItems,
        subtotal,
        discount,
        coupon,
        applyCoupon,
        removeCoupon,
        shipping,
        tax,
        totalAmount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
