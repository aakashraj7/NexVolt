import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { useToast } from './ToastContext';
import { useCart } from './CartContext';
import { api } from '../lib/api';

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => boolean;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  moveToCart: (product: Product) => void;
  moveAllToCart: () => void;
  clearWishlist: () => void;
  totalWishlistItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'nexvolt_wishlist_items';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addToCart } = useCart();

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync Wishlist with MongoDB on login, and reset on logout
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setWishlist([]);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {
        console.error(e);
      }
      return;
    }

    const syncUserWishlist = async () => {
      if (isLoaded && isSignedIn && user?.id) {
        try {
          const dbWishlist = await api.getWishlist(user.id);
          if (Array.isArray(dbWishlist)) {
            setWishlist(dbWishlist);
          }
        } catch (err) {
          console.error('Error fetching user wishlist from DB:', err);
        }
      }
    };

    syncUserWishlist();
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some((item) => item._id === productId);
  }, [wishlist]);

  const toggleWishlist = (product: Product): boolean => {
    if (!isSignedIn) {
      showToast('Please sign in to save electronics to your wishlist.', 'info');
      navigate('/sign-in');
      return false;
    }

    const exists = isInWishlist(product._id);
    if (exists) {
      setWishlist((prev) => prev.filter((item) => item._id !== product._id));
      showToast(`Removed "${product.title.slice(0, 24)}..." from Wishlist`, 'info');
    } else {
      setWishlist((prev) => [...prev, product]);
      showToast(`Added "${product.title.slice(0, 24)}..." to Wishlist!`, 'success');
    }

    // Save progress to MongoDB
    if (user?.id) {
      api.toggleWishlist(user.id, product._id);
    }

    return true;
  };

  const removeFromWishlist = (productId: string) => {
    if (!isSignedIn) {
      showToast('Please sign in to manage your wishlist.', 'info');
      navigate('/sign-in');
      return;
    }

    setWishlist((prev) => prev.filter((item) => item._id !== productId));

    // Save progress to MongoDB
    if (user?.id) {
      api.toggleWishlist(user.id, productId);
    }

    showToast('Item removed from Wishlist', 'info');
  };

  const moveToCart = (product: Product) => {
    if (!isSignedIn) {
      showToast('Please sign in to move items to cart.', 'info');
      navigate('/sign-in');
      return;
    }
    const added = addToCart(product, 1);
    if (added) {
      removeFromWishlist(product._id);
    }
  };

  const moveAllToCart = () => {
    if (!isSignedIn) {
      showToast('Please sign in to manage your cart.', 'info');
      navigate('/sign-in');
      return;
    }

    wishlist.forEach((product) => {
      addToCart(product, 1);
    });
    setWishlist([]);

    // Save progress to MongoDB
    if (user?.id) {
      api.clearWishlist(user.id);
    }

    showToast('Moved all saved items to Cart!', 'success');
  };

  const clearWishlist = () => {
    setWishlist([]);

    // Save progress to MongoDB
    if (user?.id) {
      api.clearWishlist(user.id);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        moveToCart,
        moveAllToCart,
        clearWishlist,
        totalWishlistItems: wishlist.length
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
