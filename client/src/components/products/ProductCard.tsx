import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Zap, Check, Trash2, ArrowRight } from 'lucide-react';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useUser } from '@clerk/clerk-react';
import { api } from '../../lib/api';

interface ProductCardProps {
  product: Product;
  isMerchantView?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isMerchantView }) => {
  const { user, isSignedIn } = useUser();
  const [isMerchant, setIsMerchant] = useState(isMerchantView ?? false);
  const { addToCart, removeFromCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    if (isMerchantView !== undefined) {
      setIsMerchant(isMerchantView);
      return;
    }
    if (isSignedIn && user) {
      api.checkUserRole(user.id, user.primaryEmailAddress?.emailAddress).then((res) => {
        if (res?.isMerchant === true || res?.role === 'merchant') {
          setIsMerchant(true);
        }
      }).catch(() => {});
    }
  }, [isSignedIn, user, isMerchantView]);

  const isFavorited = isInWishlist(product._id);
  const itemInCart = isInCart(product._id);

  return (
    <div className="group bg-white/50 backdrop-blur-2xl rounded-3xl p-4 flex flex-col justify-between border border-white/70 hover:border-[#0066FF]/40 shadow-xl shadow-blue-500/8 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden font-poppins">
      {/* Top Badges & Wishlist Trigger */}
      <div className="relative">
        <div className="flex items-center justify-between gap-2 absolute top-2 left-2 right-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.discountPercent > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs tracking-wider uppercase font-mono">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

          {!isMerchant && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className={`p-2 rounded-full border transition-all ${
                isFavorited
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                  : 'bg-white/90 text-slate-400 hover:text-rose-500 border-slate-200 hover:border-rose-200 shadow-sm'
              }`}
              title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
            </button>
          )}
        </div>

        {/* Product Image Link */}
        <Link to={`/products/${product.slug}`} className="block relative pt-[85%] overflow-hidden rounded-xl bg-slate-100 mb-4">
          <img
            src={product.thumbnail}
            alt={product.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
      </div>

      {/* Product Information */}
      <div className="flex flex-col flex-grow">
        {/* Brand & Category */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
          <span className="uppercase tracking-wider text-cyan-600 font-bold">{product.brand}</span>
          <span>{product.category.split('&')[0]}</span>
        </div>

        {/* Product Title */}
        <Link
          to={`/products/${product.slug}`}
          className="text-sm font-bold text-slate-900 hover:text-cyan-600 transition line-clamp-2 mb-2 leading-snug"
          title={product.title}
        >
          {product.title}
        </Link>

        {/* Rating stars & review count */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center text-amber-500">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="text-xs font-bold ml-1 text-slate-700">{product.rating}</span>
          </div>
          <span className="text-slate-300 text-xs">•</span>
          <span className="text-[11px] text-slate-500">({product.numReviews.toLocaleString()} reviews)</span>
        </div>

        {/* Price Row */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-slate-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-500" /> Free Express Delivery
            </div>
          </div>

          {/* Cart Button for Customers vs View Details for Merchants */}
          {!isMerchant ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (itemInCart) {
                  removeFromCart(product._id);
                } else {
                  addToCart(product, 1);
                }
              }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 group/btn ${
                itemInCart
                  ? 'bg-gradient-to-tr from-[#0066FF] to-[#0052CC] hover:from-rose-600 hover:to-rose-700 text-white shadow-md shadow-blue-500/25 hover:shadow-rose-500/25 border border-blue-500/20'
                  : 'bg-slate-100/90 hover:bg-[#0066FF] text-slate-700 hover:text-white border border-slate-200/90 hover:border-[#0066FF] shadow-2xs hover:shadow-md hover:shadow-blue-500/20'
              }`}
              title={itemInCart ? 'In Cart • Click to remove' : 'Add to Shopping Cart'}
            >
              {itemInCart ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5] group-hover/btn:hidden" />
                  <Trash2 className="w-4 h-4 hidden group-hover/btn:block" />
                </>
              ) : (
                <ShoppingCart className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
              )}
            </button>
          ) : (
            <Link
              to={`/products/${product.slug || product._id}`}
              className="px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-[#0066FF] text-slate-700 hover:text-white border border-slate-200 text-xs font-bold transition flex items-center gap-1 shadow-2xs group/btn"
              title="View Product Details"
            >
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
