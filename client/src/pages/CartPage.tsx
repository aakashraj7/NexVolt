import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  X,
  Zap,
  ArrowLeft,
  User,
  Lock,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  MapPin
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import type { UserProfile, UserAddress } from '../types';

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

  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [couponInput, setCouponInput] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProcessingOneClick, setIsProcessingOneClick] = useState(false);

  // Fetch user profile to verify status and retrieve default delivery address
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const fetchProfile = async () => {
        try {
          const isGoogle = user.externalAccounts?.some((acc: any) => acc.provider === 'google' || acc.provider === 'oauth_google');
          const p = await api.getUserProfile(user.id, {
            email: user.primaryEmailAddress?.emailAddress || '',
            fullName: user.fullName || '',
            provider: isGoogle ? 'google' : 'email_password'
          });
          if (p) setUserProfile(p);
        } catch (e) {
          console.warn('Cart profile check error:', e);
        }
      };
      fetchProfile();
    }
  }, [isLoaded, isSignedIn, user]);

  const isGoogle = user?.externalAccounts?.some((acc: any) => acc.provider === 'google' || acc.provider === 'oauth_google');
  const isEmailVerified = Boolean(isGoogle || userProfile?.authProvider === 'google' || userProfile?.isEmailVerified);
  const isVerifiedCustomer = Boolean(isEmailVerified);

  const defaultAddress: UserAddress | undefined = 
    userProfile?.addresses?.find((a: UserAddress) => a.isDefault) || userProfile?.addresses?.[0];

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput);
      setCouponInput('');
    }
  };

  // 1-Click Instant Order Place via Razorpay
  const handleOneClickCheckout = async () => {
    if (!isSignedIn || !user) {
      showToast('Please sign in to place an order.', 'info');
      navigate('/sign-in');
      return;
    }

    if (!isVerifiedCustomer) {
      showToast('Email verification required before placing orders.', 'error');
      navigate('/profile');
      return;
    }

    if (!defaultAddress) {
      showToast('No saved delivery address found. Please proceed to Manual Checkout to enter your shipping details.', 'info');
      navigate('/checkout');
      return;
    }

    setIsProcessingOneClick(true);

    try {
      // 1. Create order session in backend
      const orderPayload = {
        userId: user.id,
        customerDetails: {
          name: defaultAddress.recipientName || userProfile?.fullName || user.fullName || 'Valued Shopper',
          email: user.primaryEmailAddress?.emailAddress || userProfile?.email || '',
          phone: defaultAddress.phone || userProfile?.phone || '',
          address: {
            street: defaultAddress.street,
            city: defaultAddress.city,
            state: defaultAddress.state,
            pincode: defaultAddress.postalCode,
            country: defaultAddress.country || 'India'
          }
        },
        items: cart.map(i => ({
          product: i.product._id,
          title: i.product.title,
          thumbnail: i.product.thumbnail,
          price: i.product.price,
          quantity: i.quantity
        })),
        subtotal,
        tax,
        shipping,
        discountAmount: discount,
        totalAmount,
        currency: 'INR',
        paymentMethod: 'Razorpay'
      };

      const initiateRes = await api.initiateOrder(orderPayload);
      const activeOrderId = initiateRes?.orderId || ('NV-' + Date.now());

      // Transition to dedicated Order Processing & Payment Status Window
      navigate(`/order/processing/${activeOrderId}`, {
        state: {
          order: {
            ...orderPayload,
            orderId: activeOrderId
          },
          from: 'cart'
        }
      });
    } catch (err: any) {
      console.error('1-Click checkout error:', err);
      showToast(err.response?.data?.message || 'Failed to initiate 1-Click checkout.', 'error');
    } finally {
      setIsProcessingOneClick(false);
    }
  };

  // Auth gate for non-logged in users
  if (isLoaded && !isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center relative">
        <div className="bg-white/50 backdrop-blur-2xl rounded-3xl lg:rounded-[36px] p-10 sm:p-12 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto border border-blue-200/80 shadow-sm">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 font-heading">Sign In to Access Your Cart</h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto font-medium">
              Please sign in to save your cart items, sync across all your devices, and proceed to checkout.
            </p>
          </div>
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5"
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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center relative">
        <div className="bg-white/50 backdrop-blur-2xl rounded-3xl lg:rounded-[36px] p-10 sm:p-12 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto border border-blue-200/80 shadow-sm">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 font-heading">Your Shopping Bag is Empty</h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto font-medium">
              Looks like you haven't added any electronics to your cart yet. Explore our latest flagship arrivals!
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5"
          >
            <Zap className="w-4 h-4" />
            <span>Discover Electronics</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-poppins relative">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-300/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 font-heading tracking-tight">Shopping Cart</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            You have <span className="text-[#0066FF] font-bold">{totalItems}</span> items in your cart
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer p-2 rounded-xl hover:bg-rose-50/60"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Shopping Cart</span>
        </button>
      </div>

      {/* Main Cart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.product._id}
              className="bg-white/50 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 border border-white/70 hover:border-slate-200/90 shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative group"
            >
              {/* Thumbnail */}
              <Link
                to={`/products/${item.product.slug}`}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0"
              >
                <img
                  src={item.product.thumbnail}
                  alt={item.product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0066FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                  {item.product.brand}
                </span>
                <Link
                  to={`/products/${item.product.slug}`}
                  className="text-sm font-bold text-slate-900 hover:text-[#0066FF] transition line-clamp-2 leading-snug block"
                >
                  {item.product.title}
                </Link>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <span className="text-base font-black text-slate-900 font-mono">
                    ₹{item.product.price.toLocaleString('en-IN')}
                  </span>
                  {item.product.originalPrice > item.product.price && (
                    <span className="text-xs text-slate-400 line-through font-mono">
                      ₹{item.product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity adjuster */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center bg-white/80 border border-slate-200 rounded-xl p-1 shadow-2xs">
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-900 font-mono">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Remove action */}
                <button
                  onClick={() => removeFromCart(item.product._id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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

        {/* Order Summary Box (4 cols) with Login Form Style */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/50 backdrop-blur-2xl rounded-3xl lg:rounded-[36px] p-6 sm:p-8 shadow-2xl shadow-blue-500/10 border border-white/70 relative overflow-hidden transition-all duration-300 space-y-5 sticky top-28">
            <h3 className="text-lg font-black text-slate-900 font-heading border-b border-slate-200/80 pb-3">
              Order Summary
            </h3>

            {/* Promo code form */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
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
                    className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
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
                    placeholder="E.G. NEXVOLT10"
                    className="w-full bg-white/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 uppercase outline-none focus:border-[#0066FF] shadow-2xs font-mono font-medium"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition whitespace-nowrap cursor-pointer shadow-sm"
                  >
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Price lines */}
            <div className="space-y-2.5 text-xs border-t border-slate-200/80 pt-4">
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

              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200/80 pt-3">
                <span>Total Amount</span>
                <span className="font-mono text-[#0066FF] font-black text-lg">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checkout Action Section */}
            <div className="space-y-3 pt-2 border-t border-slate-200/80">
              {!isVerifiedCustomer ? (
                /* Unverified Account Gate (No Emojis, Clean Professional State) */
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Account Verification Required</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                      To protect buyer transactions, please verify your Email address in your profile before accessing checkout.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer font-poppins"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Verify Account to Unlock Checkout</span>
                  </button>
                </div>
              ) : (
                /* Verified Customer Options: 1-Click Razorpay & Manual Checkout */
                <div className="space-y-3">
                  {/* Option 1: 1-Click Instant Razorpay Checkout */}
                  <button
                    type="button"
                    disabled={isProcessingOneClick}
                    onClick={handleOneClickCheckout}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer font-poppins"
                  >
                    {isProcessingOneClick ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing 1-Click Pay...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        <span>1-Click Instant Pay (Razorpay)</span>
                      </>
                    )}
                  </button>

                  {defaultAddress && (
                    <p className="text-[10px] text-slate-500 text-center truncate flex items-center justify-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-[#0066FF]" />
                      <span>Delivering to default: <strong>{defaultAddress.street}, {defaultAddress.city}</strong></span>
                    </p>
                  )}

                  {/* Clean Divider */}
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* Option 2: Proceed to Manual Checkout */}
                  <button
                    type="button"
                    onClick={() => navigate('/checkout')}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer font-poppins"
                  >
                    <span>Proceed to Manual Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    Choose custom delivery address or Pay on Delivery (COD)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CartPage;
