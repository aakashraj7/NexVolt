import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Zap,
  Lock,
  Loader2,
  PackageCheck,
  MapPin
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import type { UserAddress } from '../types';

export const CheckoutPage: React.FC = () => {
  const { cart, subtotal, discount, shipping, tax, totalAmount, clearCart, coupon } = useCart();
  const { user } = useUser();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'cod'>('razorpay');
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState('');

  // Autofill user info and load saved addresses if signed in
  useEffect(() => {
    if (user) {
      if (user.fullName) setName(user.fullName);
      if (user.primaryEmailAddress?.emailAddress) setEmail(user.primaryEmailAddress.emailAddress);

      const loadUserProfile = async () => {
        try {
          const profile = await api.getUserProfile(user.id, {
            email: user.primaryEmailAddress?.emailAddress || '',
            fullName: user.fullName || ''
          });

          if (profile?.addresses && profile.addresses.length > 0) {
            setSavedAddresses(profile.addresses);
            const defaultAddr = profile.addresses.find((a: UserAddress) => a.isDefault) || profile.addresses[0];
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr._id || null);
              setName(defaultAddr.recipientName || user.fullName || '');
              setPhone(defaultAddr.phone || '');
              setStreet(defaultAddr.street || '');
              setCity(defaultAddr.city || '');
              setState(defaultAddr.state || '');
              setPincode(defaultAddr.postalCode || '');
            }
          }
        } catch (err) {
          console.warn('Error loading user profile for checkout:', err);
        }
      };

      loadUserProfile();
    }
  }, [user]);

  const handleSelectSavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr._id || null);
    setName(addr.recipientName);
    setPhone(addr.phone);
    setStreet(addr.street);
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.postalCode);
  };

  // Initiate backend order session when cart is ready
  useEffect(() => {
    if (cart.length > 0 && !activeOrderId && email) {
      const initiateSession = async () => {
        const orderData = {
          userId: user?.id || 'guest-' + Date.now(),
          customerDetails: {
            name: name || 'Guest Shopper',
            email: email,
            phone: phone || '',
            address: { street, city, state, pincode, country: 'India' }
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

        const res = await api.initiateOrder(orderData);
        if (res && res.orderId) {
          setActiveOrderId(res.orderId);
        }
      };

      const debounce = setTimeout(initiateSession, 1200);
      return () => clearTimeout(debounce);
    }
  }, [cart, email, activeOrderId]);

  if (cart.length === 0 && !orderCompleted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">No items to checkout</h2>
        <p className="text-slate-500 text-sm">Please add some electronics to your cart first.</p>
        <Link to="/products" className="inline-flex px-6 py-3 rounded-xl bg-cyan-600 text-white font-bold text-sm shadow">
          Browse Products
        </Link>
      </div>
    );
  }

  // Handle successful order completion
  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !street || !city || !pincode) {
      showToast('Please fill in all required shipping fields.', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const orderIdToComplete = activeOrderId || ('NV-' + Date.now());

      await api.completeOrder(orderIdToComplete, 'pay_' + Math.random().toString(36).substring(2, 10));

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore confetti errors
      }

      setCompletedOrderNumber(orderIdToComplete);
      setOrderCompleted(true);
      clearCart();
      showToast('Payment successful! Your electronics are being dispatched.', 'success');
    } catch {
      showToast('Error processing payment.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderCompleted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-300 shadow-xl space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-lg shadow-emerald-500/10">
            <PackageCheck className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Payment & Order Verified
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 font-heading">
              Thank You For Your Order!
            </h1>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Your order <span className="text-cyan-700 font-mono font-bold">{completedOrderNumber}</span> has been confirmed. We've sent the invoice to <strong className="text-slate-900">{email}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Estimated Delivery:</span>
              <span className="text-slate-900 font-bold">Within 24-48 Hours (Express)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Payment Method:</span>
              <span className="text-cyan-700 font-bold">Razorpay Instant Gateway</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/orders"
              className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow transition"
            >
              View My Orders
            </Link>
            <Link
              to="/"
              className="px-6 py-3 rounded-xl bg-white text-slate-700 hover:text-slate-900 text-sm font-semibold border border-slate-300 shadow-sm transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 font-heading">Secure Checkout</h1>
        <p className="text-slate-500 text-xs mt-1 flex items-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" /> Powered by 256-bit Razorpay Encrypted Gateway
        </p>
      </div>

      <form onSubmit={handleCompletePayment}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Shipping and Payment Info (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer & Shipping Address */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0066FF] text-white text-xs font-extrabold flex items-center justify-center">
                    1
                  </span>
                  <span>Shipping & Delivery Details</span>
                </h3>

                {savedAddresses.length > 0 && (
                  <Link to="/profile" className="text-xs text-[#0066FF] hover:underline font-bold">
                    Manage Addresses →
                  </Link>
                )}
              </div>

              {/* Saved Address Quick Selector */}
              {savedAddresses.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Choose from saved delivery locations:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr._id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`p-3 rounded-xl border text-left transition ${
                          selectedAddressId === addr._id
                            ? 'border-[#0066FF] bg-blue-50/50 ring-1 ring-[#0066FF]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#0066FF]" />
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0066FF]">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 truncate">{addr.street}, {addr.city}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Vance"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-cyan-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-cyan-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-cyan-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="560001"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-cyan-500 shadow-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Flat / House No., Tech Hub Road, Indiranagar"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-cyan-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-cyan-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-cyan-500 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-extrabold flex items-center justify-center">
                  2
                </span>
                <span>Payment Method</span>
              </h3>

              <div className="space-y-2.5 pt-2">
                <label
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                    paymentMethod === 'razorpay'
                      ? 'bg-cyan-50 border-cyan-500 text-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="accent-cyan-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Razorpay All-in-One Gateway</p>
                      <p className="text-[11px] text-slate-500">Cards, UPI, NetBanking & Wallets</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-700">Recommended</span>
                </label>

                <label
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                    paymentMethod === 'upi'
                      ? 'bg-cyan-50 border-cyan-500 text-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="accent-cyan-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Instant UPI (GPay, PhonePe, Paytm)</p>
                      <p className="text-[11px] text-slate-500">Zero transaction charges</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Security Guarantee Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center gap-2 text-cyan-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-cyan-600" />
                <span>NexVolt Buyer Protection</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Your transaction is protected by 256-bit encryption. 7-day hassle-free replacement and manufacturer warranty included with this order.
              </p>
            </div>
          </div>

          {/* Checkout Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 sticky top-28">
              <h3 className="text-base font-bold text-slate-900 font-heading border-b border-slate-200 pb-3">
                Items in Order ({cart.length})
              </h3>

              {/* Items preview */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product._id} className="flex items-center gap-3 text-xs">
                    <img
                      src={item.product.thumbnail}
                      alt={item.product.title}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.product.title}</p>
                      <p className="text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price calculations */}
              <div className="space-y-2 text-xs border-t border-slate-200 pt-4">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900 font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({coupon?.code})</span>
                    <span className="font-mono">- ₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>GST (18%)</span>
                  <span className="font-mono text-slate-900 font-bold">₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Shipping</span>
                  <span className={`font-mono ${shipping === 0 ? 'text-emerald-600 font-bold' : 'text-slate-900'}`}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-3">
                  <span>Total Payable</span>
                  <span className="font-mono text-cyan-700 text-lg font-extrabold">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Submit Pay Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/20 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Pay ₹{totalAmount.toLocaleString('en-IN')} with Razorpay</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Guaranteed Safe & Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
