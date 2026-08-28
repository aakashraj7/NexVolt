import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Heart, ShoppingBag, Trash2, Zap, ArrowLeft, Lock, User } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';

export const WishlistPage: React.FC = () => {
  const { wishlist, removeFromWishlist, moveToCart, moveAllToCart, clearWishlist } = useWishlist();
  const { isSignedIn, isLoaded } = useUser();

  // Auth gate for non-logged in users
  if (isLoaded && !isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 font-heading">Sign In to View Your Wishlist</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Please sign in to save your favorite electronics, sync wishlists across devices, and track exclusive deals.
            </p>
          </div>
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5"
          >
            <User className="w-4 h-4" />
            <span>Sign In to NexVolt</span>
          </Link>
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
            <Heart className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 font-heading">Your Wishlist is Empty</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Save your favorite smartphones, headphones, gaming gear, and monitors to keep an eye on price drops!
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5"
          >
            <Zap className="w-4 h-4" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-heading">Saved Wishlist</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            You have <span className="text-rose-600 font-bold">{wishlist.length}</span> electronics saved for later
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={moveAllToCart}
            className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Move All to Cart</span>
          </button>
          <button
            onClick={clearWishlist}
            className="px-4 py-2 rounded-xl bg-white text-slate-500 hover:text-rose-600 text-xs font-semibold border border-slate-300 shadow-sm transition"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-2xl p-4 flex flex-col justify-between border border-slate-200 shadow-sm relative group"
          >
            <button
              onClick={() => removeFromWishlist(product._id)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 text-slate-400 hover:text-rose-600 border border-slate-200 shadow-sm transition"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <Link to={`/products/${product.slug}`} className="block aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </Link>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                {product.brand}
              </span>
              <Link
                to={`/products/${product.slug}`}
                className="text-xs font-bold text-slate-900 hover:text-[#0066FF] transition line-clamp-2 leading-snug block"
              >
                {product.title}
              </Link>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-base font-extrabold text-slate-900">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-xs text-slate-400 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => moveToCart(product)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Move to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0066FF] hover:text-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
};
