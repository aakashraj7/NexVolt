import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  X,
  Zap,
  ArrowLeft,
  User,
  Lock
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartPage: React.FC = () => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    subtotal,
    discount,
    coupon,
    applyCoupon,
    removeCoupon,
    shipping,
    tax,
    totalAmount
  } = useCart();

  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput);
      setCouponInput('');
    }
  };

  // Auth gate for non-logged in users
  if (isLoaded && !isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 font-heading">Sign In to Access Your Cart</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Please sign in to save your cart items, sync across all your devices, and proceed to checkout.
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

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 font-heading">Your Shopping Bag is Empty</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Looks like you haven't added any electronics to your cart yet. Explore our latest flagship arrivals!
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5"
          >
            <Zap className="w-4 h-4" />
            <span>Discover Electronics</span>
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
          <h1 className="text-3xl font-bold text-slate-900 font-heading">Shopping Cart</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            You have <span className="text-[#0066FF] font-bold">{totalItems}</span> electronics items in your cart
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Shopping Cart</span>
        </button>
      </div>

      {/* Main Cart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.product._id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative"
            >
              {/* Thumbnail */}
              <Link
                to={`/products/${item.product.slug}`}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0"
              >
                <img
                  src={item.product.thumbnail}
                  alt={item.product.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  {item.product.brand}
                </span>
                <Link
                  to={`/products/${item.product.slug}`}
                  className="text-sm font-bold text-slate-900 hover:text-[#0066FF] transition line-clamp-2 leading-snug block"
                >
                  {item.product.title}
                </Link>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <span className="text-base font-extrabold text-slate-900">
                    ₹{item.product.price.toLocaleString('en-IN')}
                  </span>
                  {item.product.originalPrice > item.product.price && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{item.product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity adjuster */}
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-900 font-mono">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Remove action */}
                <button
                  onClick={() => removeFromCart(item.product._id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0066FF] hover:text-blue-700 transition pt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Order Summary Box (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 sticky top-28">
            <h3 className="text-lg font-bold text-slate-900 font-heading border-b border-slate-200 pb-3">
              Order Summary
            </h3>

            {/* Promo code form */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Have a Promo Code?
              </label>
              {coupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#0066FF]" />
                    <span>{coupon.code} ({coupon.discountPercent}% OFF)</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1 text-slate-500 hover:text-slate-900 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="e.g. NEXVOLT10"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase outline-none focus:border-[#0066FF]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition whitespace-nowrap"
                  >
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Price lines */}
            <div className="space-y-2.5 text-xs border-t border-slate-200 pt-4">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span className="font-mono">- ₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 font-medium">
                <span>Estimated GST (18%)</span>
                <span className="font-bold text-slate-900 font-mono">₹{tax.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-600 font-medium">
                <span>Express Shipping</span>
                <span className={`font-mono ${shipping === 0 ? 'text-emerald-600 font-bold' : 'text-slate-900'}`}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-3">
                <span>Total Amount</span>
                <span className="font-mono text-[#0066FF] font-extrabold">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition duration-200 flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Security Guarantee */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Razorpay 256-bit Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
