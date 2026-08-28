import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart, Zap } from 'lucide-react';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorited = isInWishlist(product._id);

  return (
    <div className="group bg-white rounded-2xl p-4 flex flex-col justify-between border border-slate-200 hover:border-cyan-500/50 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
      {/* Top Badges & Wishlist Trigger */}
      <div className="relative">
        <div className="flex items-center justify-between gap-2 absolute top-2 left-2 right-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.badge && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-50 border border-cyan-200 text-cyan-700 shadow-sm">
                {product.badge}
              </span>
            )}
            {product.discountPercent > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

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

          {/* Quick Add To Cart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product, 1);
            }}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-cyan-600 text-slate-700 hover:text-white border border-slate-200 hover:border-cyan-600 shadow-sm transition-all duration-200 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-600"
            title="Add to Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
