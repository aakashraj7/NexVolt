import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Zap,
  Lock,
  Loader2,
  MapPin,
  AlertTriangle,
  CreditCard,
  Banknote,
  Plus,
  X,
  Check,
  Home,
  Briefcase,
  Building2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import type { UserAddress, UserProfile } from '../types';

export const CheckoutPage: React.FC = () => {
  const { cart, subtotal, discount, shipping, tax, totalAmount, coupon } = useCart();
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // In-page Address Addition Modal State
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState<'Home' | 'Office' | 'Studio' | 'Custom'>('Home');
  const [newAddrCustomLabel, setNewAddrCustomLabel] = useState('');
  const [newAddrRecipient, setNewAddrRecipient] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrLandmark, setNewAddrLandmark] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrState, setNewAddrState] = useState('');
  const [newAddrPostalCode, setNewAddrPostalCode] = useState('');
  const [newAddrIsDefault, setNewAddrIsDefault] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const handleOpenAddAddressModal = () => {
    setNewAddrRecipient(user?.fullName || name || '');
    setNewAddrPhone(phone || '');
    setNewAddrStreet('');
    setNewAddrLandmark('');
    setNewAddrCity('');
    setNewAddrState('');
    setNewAddrPostalCode('');
    setNewAddrLabel('Home');
    setNewAddrCustomLabel('');
    setNewAddrIsDefault(savedAddresses.length === 0);
    setShowAddAddressModal(true);
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user?.id) {
      showToast('Please sign in to save addresses.', 'error');
      return;
    }

    const cleanPhone = newAddrPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    try {
      setSavingAddress(true);
      const payload = {
        label: newAddrLabel,
        customLabel: newAddrLabel === 'Custom' ? newAddrCustomLabel : undefined,
        recipientName: newAddrRecipient,
        phone: cleanPhone,
        street: newAddrStreet,
        landmark: newAddrLandmark,
        city: newAddrCity,
        state: newAddrState,
        postalCode: newAddrPostalCode,
        country: 'India',
        isDefault: newAddrIsDefault
      };

      const res = await api.addUserAddress(user.id, payload);
      if (res && res.addresses) {
        setSavedAddresses(res.addresses);
        const newAdded = res.newAddress || res.addresses[res.addresses.length - 1];
        if (newAdded) {
          handleSelectSavedAddress(newAdded);
        }
      }

      showToast('New delivery address added & selected!', 'success');
      setShowAddAddressModal(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error saving address. Please try again.', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  // Autofill user info and load saved addresses if signed in
  useEffect(() => {
    if (user) {
      if (user.fullName) setName(user.fullName);
      if (user.primaryEmailAddress?.emailAddress) setEmail(user.primaryEmailAddress.emailAddress);

      const loadUserProfile = async () => {
        try {
          const isGoogle = user.externalAccounts?.some((acc: any) => acc.provider === 'google' || acc.provider === 'oauth_google');
          const profile = await api.getUserProfile(user.id, {
            email: user.primaryEmailAddress?.emailAddress || '',
            fullName: user.fullName || '',
            provider: isGoogle ? 'google' : 'email_password'
          });

          if (profile) {
            setUserProfile(profile);
            if (profile.phone) setPhone(profile.phone);
          }

          if (profile?.addresses && profile.addresses.length > 0) {
            setSavedAddresses(profile.addresses);
            const defaultAddr = profile.addresses.find((a: UserAddress) => a.isDefault) || profile.addresses[0];
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr._id || null);
              setName(defaultAddr.recipientName || user.fullName || '');
              setPhone(defaultAddr.phone || profile.phone || '');
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

  const isGoogle = user?.externalAccounts?.some((acc: any) => acc.provider === 'google' || acc.provider === 'oauth_google');
  const isEmailVerified = Boolean(isGoogle || userProfile?.authProvider === 'google' || userProfile?.isEmailVerified);
  const isVerifiedCustomer = Boolean(isEmailVerified);

  // Guard: Redirect unverified users away from Checkout Page
  useEffect(() => {
    if (isLoaded && isSignedIn && userProfile) {
      if (!isVerifiedCustomer) {
        showToast('Email verification required before accessing checkout.', 'error');
        navigate('/cart', { replace: true });
      }
    }
  }, [isLoaded, isSignedIn, userProfile, isVerifiedCustomer, navigate]);

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
          paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'
        };

        const res = await api.initiateOrder(orderData);
        if (res && res.orderId) {
          setActiveOrderId(res.orderId);
        }
      };

      const debounce = setTimeout(initiateSession, 1200);
      return () => clearTimeout(debounce);
    }
  }, [cart, email, activeOrderId, paymentMethod]);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 font-poppins relative">
        <div className="bg-white/50 backdrop-blur-2xl rounded-3xl lg:rounded-[36px] p-10 sm:p-12 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-4">
          <h2 className="text-2xl font-black text-slate-900 font-heading">No items to checkout</h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Please add some electronics to your cart first.</p>
          <Link to="/products" className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] text-white font-bold text-xs shadow-md">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // Handle Complete Order (Razorpay / Pay on Delivery)
  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerifiedCustomer) {
      showToast('Email verification required: Please verify your email before placing your order.', 'error');
      navigate('/profile');
      return;
    }

    if (!name || !email || !street || !city || !pincode) {
      showToast('Please fill in all required shipping fields.', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const orderPayload = {
        userId: user?.id || 'guest',
        customerDetails: {
          name,
          email,
          phone,
          address: {
            street,
            city,
            state,
            pincode,
            country: 'India'
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
        paymentMethod: paymentMethod === 'razorpay' ? 'Razorpay' : 'Pay on Delivery (COD)'
      };

      const initiateRes = await api.initiateOrder(orderPayload);
      const orderIdToComplete = initiateRes?.orderId || activeOrderId || ('NV-' + Date.now());

      navigate(`/order/processing/${orderIdToComplete}`, {
        state: {
          order: {
            ...orderPayload,
            orderId: orderIdToComplete
          },
          from: 'checkout'
        }
      });
    } catch (err: any) {
      console.error('Checkout initiation error:', err);
      showToast(err.response?.data?.message || 'Error processing checkout.', 'error');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-poppins relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-300/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4 relative z-10">
        <h1 className="text-3xl font-black text-slate-900 font-heading tracking-tight">Manual Checkout</h1>
        <p className="text-slate-500 text-xs mt-1 flex items-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" /> Complete your shipping address and select payment method
        </p>
      </div>

      <form onSubmit={handleCompletePayment} className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Shipping and Payment Info (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer & Shipping Address Card */}
            <div className="bg-white/50 backdrop-blur-2xl rounded-3xl lg:rounded-[36px] p-6 sm:p-8 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 font-heading flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#0066FF] text-white text-xs font-black flex items-center justify-center shadow-xs">
                    1
                  </span>
                  <span>Shipping & Delivery Details</span>
                </h3>

                <button
                  type="button"
                  onClick={handleOpenAddAddressModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 text-xs font-bold transition cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Address</span>
                </button>
              </div>

              {/* Saved addresses selector */}
              {savedAddresses.length > 0 && (
                <div className="space-y-2 pb-3 border-b border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-700">Select From Saved Addresses:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr._id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                          selectedAddressId === addr._id
                            ? 'border-[#0066FF] bg-blue-50/80 ring-1 ring-[#0066FF] shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:border-slate-300'
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
                        <p className="text-[11px] text-slate-600 truncate font-medium">{addr.street}, {addr.city}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Vance"
                    className="w-full bg-white/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF] shadow-2xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-white/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF] shadow-2xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF] shadow-2xs font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">PIN / Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="560001"
                    className="w-full bg-white/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF] shadow-2xs font-mono font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Delivery Street Address *</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Flat / House No., Building Name, Street"
                    className="w-full bg-white/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF] shadow-2xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full bg-white/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF] shadow-2xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full bg-white/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF] shadow-2xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method (Razorpay Online / Pay on Delivery) Card */}
            <div className="bg-white/50 backdrop-blur-2xl rounded-3xl lg:rounded-[36px] p-6 sm:p-8 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-5 transition-all duration-300">
              <h3 className="text-base font-black text-slate-900 font-heading flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#0066FF] text-white text-xs font-black flex items-center justify-center shadow-xs">
                  2
                </span>
                <span>Payment Method</span>
              </h3>

              <div className="space-y-3 pt-1">
                {/* 1. Razorpay All-in-One Online Gateway */}
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === 'razorpay'
                      ? 'bg-blue-50/80 border-[#0066FF] text-slate-900 shadow-xs ring-1 ring-[#0066FF]'
                      : 'bg-white/70 border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="accent-[#0066FF] w-4 h-4 cursor-pointer"
                    />
                    <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-[#0066FF] flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 font-poppins">Razorpay All-in-One Gateway</p>
                      <p className="text-[11px] text-slate-500 font-poppins font-medium">UPI (GPay, PhonePe), Cards & NetBanking</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-[#0066FF] bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                    Recommended
                  </span>
                </label>

                {/* 2. Pay on Delivery / Cash on Delivery */}
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === 'cod'
                      ? 'bg-blue-50/80 border-[#0066FF] text-slate-900 shadow-xs ring-1 ring-[#0066FF]'
                      : 'bg-white/70 border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-[#0066FF] w-4 h-4 cursor-pointer"
                    />
                    <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 font-poppins">Pay on Delivery (Cash on Delivery)</p>
                      <p className="text-[11px] text-slate-500 font-poppins font-medium">Pay with Cash or UPI upon doorstep delivery</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Checkout Summary Card (5 cols) with Login Form Aesthetic */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/50 backdrop-blur-2xl rounded-3xl lg:rounded-[36px] p-6 sm:p-8 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-5 sticky top-28 transition-all duration-300">
              <h3 className="text-base font-black text-slate-900 font-heading border-b border-slate-200/80 pb-3">
                Items in Order ({cart.length})
              </h3>

              {/* Items preview */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product._id} className="flex items-center gap-3 text-xs">
                    <img
                      src={item.product.thumbnail}
                      alt={item.product.title}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200/80 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.product.title}</p>
                      <p className="text-slate-500 font-medium">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price calculations */}
              <div className="space-y-2.5 text-xs border-t border-slate-200/80 pt-4">
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
                <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200/80 pt-3">
                  <span>Total Payable</span>
                  <span className="font-mono text-[#0066FF] text-lg font-black">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Submit Pay Button */}
              <button
                type="submit"
                disabled={isProcessing || !isVerifiedCustomer}
                className={`w-full py-4 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition duration-200 flex items-center justify-center gap-2 active:scale-[0.99] ${
                  !isVerifiedCustomer
                    ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-not-allowed opacity-90 shadow-amber-500/20'
                    : 'bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-500/20 cursor-pointer font-poppins'
                }`}
              >
                {!isVerifiedCustomer ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Verification Required to Order</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : paymentMethod === 'cod' ? (
                  <>
                    <Banknote className="w-4 h-4" />
                    <span>Place Order with Pay on Delivery (₹{totalAmount.toLocaleString('en-IN')})</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Pay ₹{totalAmount.toLocaleString('en-IN')} with Razorpay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* In-Page Add Delivery Address Modal */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 font-poppins">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">Add Delivery Address</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Save a new address to use for this order</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAddressModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewAddress} className="space-y-4">
              {/* Address Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Address Label *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Home', 'Office', 'Studio', 'Custom'] as const).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setNewAddrLabel(lbl)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        newAddrLabel === lbl
                          ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {lbl === 'Home' && <Home className="w-3.5 h-3.5" />}
                      {lbl === 'Office' && <Briefcase className="w-3.5 h-3.5" />}
                      {lbl === 'Studio' && <Building2 className="w-3.5 h-3.5" />}
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {newAddrLabel === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Label Name *</label>
                  <input
                    type="text"
                    required
                    value={newAddrCustomLabel}
                    onChange={(e) => setNewAddrCustomLabel(e.target.value)}
                    placeholder="e.g. Vacation Villa / Warehouse"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={newAddrRecipient}
                    onChange={(e) => setNewAddrRecipient(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone (10 digits) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newAddrPhone}
                    onChange={(e) => setNewAddrPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9000000000"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street Address, Flat / House No *</label>
                <input
                  type="text"
                  required
                  value={newAddrStreet}
                  onChange={(e) => setNewAddrStreet(e.target.value)}
                  placeholder="42, Anna Salai, T. Nagar"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={newAddrLandmark}
                  onChange={(e) => setNewAddrLandmark(e.target.value)}
                  placeholder="Near T. Nagar Bus Stand"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newAddrCity}
                    onChange={(e) => setNewAddrCity(e.target.value)}
                    placeholder="Chennai"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newAddrState}
                    onChange={(e) => setNewAddrState(e.target.value)}
                    placeholder="Tamil Nadu"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newAddrPostalCode}
                    onChange={(e) => setNewAddrPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="600017"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="checkoutModalSetDefault"
                  checked={newAddrIsDefault}
                  onChange={(e) => setNewAddrIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 cursor-pointer"
                />
                <label htmlFor="checkoutModalSetDefault" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Set as my default delivery address
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {savingAddress ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Address...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Use Address</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CheckoutPage;
