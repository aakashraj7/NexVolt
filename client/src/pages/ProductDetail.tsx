import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Star,
  ShoppingBag,
  Heart,
  Check,
  ChevronRight,
  ChevronDown,
  Zap,
  Copy,
  Loader2,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Home,
  Briefcase,
  Building2,
  X,
  CreditCard,
  AlertCircle,
  Store,
  Edit
} from 'lucide-react';
import { api } from '../lib/api';
import type { Product, UserAddress } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { ProductCard } from '../components/products/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const [isMerchantUser, setIsMerchantUser] = useState(false);
  const { addToCart, removeFromCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSignedIn && user) {
      api.checkUserRole(user.id, user.primaryEmailAddress?.emailAddress).then((res) => {
        setIsMerchantUser(res?.isMerchant === true || res?.role === 'merchant');
      }).catch(() => {
        setIsMerchantUser(false);
      });
    } else {
      setIsMerchantUser(false);
    }
  }, [isSignedIn, user]);

  // Saved user addresses state for delivery selector
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);
  const addressDropdownRef = useRef<HTMLDivElement>(null);

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

  // Review form states
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // 1-Click Express Checkout Modal States
  const [showOneClickConfirmModal, setShowOneClickConfirmModal] = useState(false);
  const [isInitiatingOneClick, setIsInitiatingOneClick] = useState(false);

  const handleOpenAddAddressModal = () => {
    setAddressDropdownOpen(false);
    setNewAddrRecipient(user?.fullName || '');
    setNewAddrPhone('');
    setNewAddrStreet('');
    setNewAddrLandmark('');
    setNewAddrCity('');
    setNewAddrState('');
    setNewAddrPostalCode('');
    setNewAddrLabel('Home');
    setNewAddrCustomLabel('');
    setNewAddrIsDefault(userAddresses.length === 0);
    setShowAddAddressModal(true);
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user?.id) {
      showToast('Please sign in to add delivery addresses.', 'error');
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
        setUserAddresses(res.addresses);
        if (res.newAddress?._id) {
          setSelectedAddressId(res.newAddress._id);
        } else if (res.addresses.length > 0) {
          setSelectedAddressId(res.addresses[res.addresses.length - 1]._id);
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

  // Close address dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (addressDropdownRef.current && !addressDropdownRef.current.contains(e.target as Node)) {
        setAddressDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Load user saved addresses if signed in
  useEffect(() => {
    const loadAddresses = async () => {
      if (isSignedIn && user?.id) {
        try {
          const profile = await api.getUserProfile(user.id, {
            email: user.primaryEmailAddress?.emailAddress || '',
            fullName: user.fullName || ''
          });
          if (profile?.addresses && profile.addresses.length > 0) {
            setUserAddresses(profile.addresses);
            const defaultAddr = profile.addresses.find((a: UserAddress) => a.isDefault) || profile.addresses[0];
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr._id || null);
            }
          }
        } catch (err) {
          console.warn('Error loading addresses for product page:', err);
        }
      } else {
        setUserAddresses([]);
        setSelectedAddressId(null);
      }
    };

    loadAddresses();
  }, [isSignedIn, user]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!idOrSlug) return;
      try {
        setLoading(true);
        const data = await api.getProduct(idOrSlug);
        setProduct(data.product);
        setRelated(data.related);
        setActiveImage(data.product.images?.[0] || data.product.thumbnail);
        setQuantity(1);
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [idOrSlug]);

  const handleTriggerOneClick = () => {
    if (!isSignedIn || !user) {
      showToast('Please sign in to use 1-Click Express Checkout.', 'info');
      navigate('/sign-in');
      return;
    }
    setShowOneClickConfirmModal(true);
  };

  const handleProceedOneClick = async () => {
    if (!product || !user) return;
    try {
      setIsInitiatingOneClick(true);
      const activeAddress = userAddresses.find(a => a._id === selectedAddressId) || userAddresses[0] || {
        street: '42, Anna Salai, T. Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600017',
        country: 'India',
        recipientName: user.fullName || 'Customer',
        phone: user.primaryPhoneNumber?.phoneNumber || '9000000000'
      };

      const lineTotal = product.price * quantity;
      const tax = Math.round(lineTotal * 0.18);
      const totalAmount = lineTotal;

      const orderPayload = {
        userId: user.id,
        customerDetails: {
          name: activeAddress.recipientName || user.fullName || 'Customer',
          email: user.primaryEmailAddress?.emailAddress || '',
          phone: activeAddress.phone || user.primaryPhoneNumber?.phoneNumber || '9876543210',
          address: {
            street: activeAddress.street,
            city: activeAddress.city,
            state: activeAddress.state,
            pincode: activeAddress.postalCode,
            country: activeAddress.country || 'India'
          }
        },
        items: [{
          product: product._id,
          title: product.title,
          thumbnail: product.thumbnail,
          price: product.price,
          quantity: quantity
        }],
        subtotal: lineTotal - tax,
        tax,
        shipping: 0,
        discountAmount: 0,
        totalAmount,
        currency: 'INR',
        paymentMethod: 'Razorpay'
      };

      const initiateRes = await api.initiateOrder(orderPayload);
      const activeOrderId = initiateRes?.orderId || ('NV-' + Date.now());

      setShowOneClickConfirmModal(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      navigate(`/order/processing/${activeOrderId}`, {
        state: {
          order: {
            ...orderPayload,
            orderId: activeOrderId
          },
          from: 'product',
          immediateStatus: 'initiating'
        }
      });
    } catch (err: any) {
      console.error('1-Click checkout initiation error:', err);
      showToast(err.response?.data?.message || 'Failed to initiate 1-Click checkout.', 'error');
    } finally {
      setIsInitiatingOneClick(false);
    }
  };

  const handleManualBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard!', 'info');
    }
  };

  if (loading || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading product specs...</p>
      </div>
    );
  }

  const isFavorited = isInWishlist(product._id);
  const itemInCart = isInCart(product._id);
  const savings = product.originalPrice - product.price;

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    try {
      setSubmittingReview(true);
      const newReview = {
        userName: reviewName,
        rating: reviewRating,
        comment: reviewComment,
        verifiedPurchase: true,
        date: new Date().toISOString()
      };

      setProduct((prev) => {
        if (!prev) return prev;
        const updatedReviews = [newReview, ...(prev.reviews || [])];
        return {
          ...prev,
          reviews: updatedReviews,
          numReviews: updatedReviews.length
        };
      });

      showToast('Thank you! Review submitted.', 'success');
      setReviewName('');
      setReviewComment('');
    } catch (err) {
      showToast('Error submitting review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-12">
      {/* Breadcrumbs - Responsive horizontal scrollable */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap py-1">
        <Link to="/" className="hover:text-[#0066FF] transition shrink-0">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link to="/products" className="hover:text-[#0066FF] transition shrink-0">Electronics</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-[#0066FF] transition shrink-0">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-800 truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Gallery (6 cols) - On desktop: left thumbnails + main image. On mobile: main image top + thumbnails bottom */}
        <div className="lg:col-span-6 flex flex-col md:flex-row gap-4 items-start">
          {/* Thumbnail Strip: Bottom on mobile (order-2), Left vertical on desktop (order-1) */}
          {product.images && product.images.length > 1 && (
            <div className="flex flex-row md:flex-col gap-3 shrink-0 order-2 md:order-1 p-1 w-full md:w-auto overflow-x-auto md:overflow-visible no-scrollbar justify-start sm:justify-center md:justify-start">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 border-2 transition-all shrink-0 flex items-center justify-center ${
                    activeImage === img
                      ? 'border-[#0066FF] shadow-sm'
                      : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
          )}

          {/* Main Large Image Showcase */}
          <div className="relative flex-1 rounded-3xl overflow-hidden bg-white border border-slate-200 p-4 sm:p-6 aspect-square flex items-center justify-center shadow-xs order-1 md:order-2 w-full">
            <img
              src={activeImage}
              alt={product.title}
              className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
            />
            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md">
                {product.discountPercent}% OFF
              </span>
            )}
            <button
              onClick={handleCopyLink}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 border border-slate-200 text-slate-600 hover:text-[#0066FF] hover:border-blue-300 transition shadow-xs"
              title="Copy Product Link"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Product Buy Box (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                {product.brand}
              </span>
              <span className="text-xs font-semibold text-slate-600 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                Sold by: <strong className="text-slate-800">{product.merchantStoreName || product.merchantName || 'NexVolt Verified Partner'}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading leading-tight">
              {product.title}
            </h1>
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{product.rating}</span>
            </div>
            <span className="text-slate-500 text-xs font-medium">
              {product.numReviews.toLocaleString()} verified ratings & customer reviews
            </span>
          </div>

          {/* Price breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900 font-heading">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-base text-slate-400 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              {savings > 0 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  You Save ₹{savings.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {/* Short Description */}
          <p className="text-slate-700 text-sm leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Key Highlights */}
          {product.highlights && product.highlights.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Key Highlights</h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {product.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Delivery Address Selector for Logged In Customer */}
          {!isMerchantUser && isSignedIn && user && userAddresses.length > 0 && (() => {
            const activeAddress = userAddresses.find(a => a._id === selectedAddressId) || userAddresses[0];

            return (
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Delivering to:</span>
                  </span>
                  <Link to="/profile?tab=addresses" className="text-[11px] text-[#0066FF] hover:underline font-bold">
                    Manage Addresses
                  </Link>
                </div>

                {/* Custom Modern Dropdown Selector */}
                <div className="relative" ref={addressDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setAddressDropdownOpen(!addressDropdownOpen)}
                    className="w-full bg-white border border-slate-300 hover:border-[#0066FF] focus:border-[#0066FF] rounded-xl p-2.5 sm:p-3 text-left transition-all duration-200 shadow-2xs hover:shadow-md flex items-center justify-between gap-2.5 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200/80 group-hover:scale-105 transition-transform">
                        {activeAddress.label.toLowerCase() === 'home' && <Home className="w-3.5 h-3.5" />}
                        {activeAddress.label.toLowerCase() === 'office' && <Briefcase className="w-3.5 h-3.5" />}
                        {activeAddress.label.toLowerCase() !== 'home' && activeAddress.label.toLowerCase() !== 'office' && <Building2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">
                            {activeAddress.label === 'Custom' ? (activeAddress.customLabel || 'Custom') : activeAddress.label}
                          </span>
                          {activeAddress.isDefault && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">
                          {activeAddress.street}, {activeAddress.city} ({activeAddress.postalCode})
                        </p>
                      </div>
                    </div>

                    <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-400 group-hover:text-[#0066FF] transition-colors shrink-0">
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${addressDropdownOpen ? 'rotate-180 text-[#0066FF]' : ''}`} />
                    </div>
                  </button>

                  {/* Floating Glassmorphic Dropdown List */}
                  {addressDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/98 backdrop-blur-2xl border border-slate-200 rounded-2xl p-1.5 shadow-2xl space-y-1 animate-toast-in">
                      <div className="max-h-56 overflow-y-auto space-y-1 no-scrollbar">
                        {userAddresses.map((addr) => {
                          const isSelected = addr._id === activeAddress._id;
                          return (
                            <button
                              key={addr._id}
                              type="button"
                              onClick={() => {
                                setSelectedAddressId(addr._id || null);
                                setAddressDropdownOpen(false);
                              }}
                              className={`w-full p-2.5 rounded-xl text-left transition-all duration-150 flex items-center justify-between gap-2.5 border ${
                                isSelected
                                  ? 'bg-blue-50/90 border-blue-200 text-slate-900 shadow-2xs'
                                  : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                  isSelected ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                  {addr.label.toLowerCase() === 'home' && <Home className="w-3.5 h-3.5" />}
                                  {addr.label.toLowerCase() === 'office' && <Briefcase className="w-3.5 h-3.5" />}
                                  {addr.label.toLowerCase() !== 'home' && addr.label.toLowerCase() !== 'office' && <Building2 className="w-3.5 h-3.5" />}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-900">
                                      {addr.label === 'Custom' ? (addr.customLabel || 'Custom') : addr.label}
                                    </span>
                                    {addr.isDefault && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100/80 text-emerald-800">
                                        Default
                                      </span>
                                    )}
                                    {addr.recipientName && (
                                      <span className="text-[10px] text-slate-400 truncate">
                                        • {addr.recipientName}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate font-medium">
                                    {addr.street}, {addr.city} ({addr.postalCode})
                                  </p>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-[#0066FF] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between px-2 gap-2">
                        <button
                          type="button"
                          onClick={handleOpenAddAddressModal}
                          className="text-xs font-bold text-[#0066FF] hover:text-blue-700 flex items-center gap-1.5 py-1 transition"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Add New Address</span>
                        </button>

                        <Link
                          to="/profile?tab=addresses"
                          onClick={() => setAddressDropdownOpen(false)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline py-1"
                        >
                          Manage in Profile
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 font-medium">
                  1-Click Buy Now applies to your selected delivery address by default.
                </p>
              </div>
            );
          })()}

          {/* Merchant Mode Notice vs Consumer Quantity & CTA buttons */}
          {isMerchantUser ? (
            <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Store className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Product Catalog Preview (Merchant Mode)</span>
                </div>
                <Link
                  to={`/merchant/dashboard?tab=products&editProductId=${product._id}`}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-950" />
                  <span>Edit in Product Studio</span>
                </Link>
              </div>
              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                You are viewing this listing in Merchant Mode. Consumer actions (1-Click instant checkout, standard cart, and wishlist) are disabled for seller accounts.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity:</span>
                <div className="flex items-center bg-white border border-slate-300 rounded-xl p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-sm font-bold text-slate-900 font-mono">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(99, quantity + 1))}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="space-y-3">
                {/* Row 1: 1-Click vs Manual Checkout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. 1-Click Express Checkout */}
                  <button
                    type="button"
                    onClick={handleTriggerOneClick}
                    className="py-3.5 sm:py-4 px-5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Buy Now with 1-Click</span>
                  </button>

                  {/* 2. Manual Standard Checkout */}
                  <button
                    type="button"
                    onClick={handleManualBuyNow}
                    className="py-3.5 sm:py-4 px-5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-[#0066FF] font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <CreditCard className="w-4 h-4 text-slate-600" />
                    <span>Buy Now (Manual)</span>
                  </button>
                </div>

                {/* Row 2: Add to Cart & Wishlist */}
                <div className="flex items-center gap-3">
                  {/* Dynamic Add / Remove from Cart Button */}
                  {itemInCart ? (
                    <button
                      type="button"
                      onClick={() => removeFromCart(product._id)}
                      className="flex-1 py-3 px-5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Remove from Cart</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(product, quantity)}
                      className="flex-1 py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-slate-600" />
                      <span>Add to Shopping Cart</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    className={`py-3 px-4 rounded-xl border transition shadow-xs flex items-center justify-center cursor-pointer ${
                      isFavorited
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-slate-50'
                    }`}
                    title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tech Specifications Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
          Technical Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {product.specs && product.specs.map((spec, i) => (
            <div key={i} className="flex justify-between py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-500">{spec.key}</span>
              <span className="font-bold text-slate-900 text-right">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Reviews & Ratings Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 border border-slate-200 shadow-sm space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">Customer Reviews</h3>
            <p className="text-xs text-slate-500 mt-1">Real feedback from verified NexVolt electronics buyers</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">{product.rating}</span>
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
          </div>
        </div>

        {/* Existing Reviews List */}
        <div className="space-y-4">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((rev, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0066FF] to-[#0052CC] text-white font-bold text-xs flex items-center justify-center">
                      {rev.userName.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-slate-900">{rev.userName}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                      Verified Buyer
                    </span>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, j) => (
                      <Star key={j} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No reviews yet. Be the first to share your experience!</p>
          )}
        </div>

        {/* Write a Review Form (Customer Mode Only) */}
        {!isMerchantUser && (
          <form onSubmit={handleAddReview} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Write a Customer Review</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Alex Vance"
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0066FF] shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0066FF] shadow-sm"
                >
                  <option value={5}>5 Stars - Outstanding</option>
                  <option value={4}>4 Stars - Great</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Poor</option>
                  <option value={1}>1 Star - Terrible</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Review</label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="What did you love about this gear?"
                required
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-[#0066FF] shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2.5 rounded-xl bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-xs shadow transition"
            >
              Submit Review
            </button>
          </form>
        )}
      </div>

      {/* Related Products Carousel (Customer Mode Only) */}
      {!isMerchantUser && related.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            Related Electronics You May Like
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </div>
      )}

      {/* In-Page Add Address Modal */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-toast-in text-xs flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add New Delivery Address</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Save a new shipping location for 1-Click checkout</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddAddressModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveNewAddress} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* Label Presets */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Address Label / Type *
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['Home', 'Office', 'Studio', 'Custom'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setNewAddrLabel(item)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all duration-200 active:scale-95 flex items-center gap-1.5 ${
                        newAddrLabel === item
                          ? 'bg-[#0066FF] text-white shadow-xs scale-[1.02]'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item === 'Home' && <Home className="w-3.5 h-3.5" />}
                      {item === 'Office' && <Briefcase className="w-3.5 h-3.5" />}
                      {item === 'Studio' && <Building2 className="w-3.5 h-3.5" />}
                      <span>{item}</span>
                    </button>
                  ))}
                </div>

                {newAddrLabel === 'Custom' && (
                  <input
                    type="text"
                    required
                    value={newAddrCustomLabel}
                    onChange={(e) => setNewAddrCustomLabel(e.target.value)}
                    placeholder="e.g. Parent's House, Farmhouse, School"
                    className="w-full mt-2 bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={newAddrRecipient}
                    onChange={(e) => setNewAddrRecipient(e.target.value)}
                    placeholder="Full recipient name"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone (10 digits) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newAddrPhone}
                    onChange={(e) => setNewAddrPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address, Flat / Building *</label>
                <input
                  type="text"
                  required
                  value={newAddrStreet}
                  onChange={(e) => setNewAddrStreet(e.target.value)}
                  placeholder="Flat / House No, Street name, Area"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={newAddrLandmark}
                  onChange={(e) => setNewAddrLandmark(e.target.value)}
                  placeholder="Near Metro / Landmark"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newAddrCity}
                    onChange={(e) => setNewAddrCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newAddrState}
                    onChange={(e) => setNewAddrState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newAddrPostalCode}
                    onChange={(e) => setNewAddrPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="560001"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="modalSetDefault"
                  checked={newAddrIsDefault}
                  onChange={(e) => setNewAddrIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 cursor-pointer"
                />
                <label htmlFor="modalSetDefault" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Set as my default delivery address
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  {savingAddress ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Address...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Select Address</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 1-Click Express Checkout Confirmation Modal */}
      {showOneClickConfirmModal && product && (() => {
        const activeAddress = userAddresses.find(a => a._id === selectedAddressId) || userAddresses[0];
        const lineTotal = product.price * quantity;
        const tax = Math.round(lineTotal * 0.18);
        const subtotal = lineTotal - tax;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 font-poppins">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200 shadow-sm shrink-0">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
                      Confirm 1-Click Order?
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Fast express checkout without touching your cart
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOneClickConfirmModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Snapshot */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0 shadow-2xs"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                    {product.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Qty: <span className="font-bold text-slate-800">{quantity}</span> • Unit Price: ₹{product.price.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black font-mono text-[#0066FF]">
                    ₹{lineTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Delivery Address Destination */}
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/70 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Delivering To:</span>
                  </span>
                  {activeAddress && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-blue-700 border border-blue-200">
                      {activeAddress.label}
                    </span>
                  )}
                </div>
                {activeAddress ? (
                  <p className="text-[11px] text-slate-600 font-medium">
                    <span className="font-bold text-slate-900">{activeAddress.recipientName}</span> • {activeAddress.street}, {activeAddress.city} - {activeAddress.postalCode}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No saved address selected. Standard address will be used.</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden text-xs bg-white">
                <div className="p-3 bg-slate-50 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({quantity} item{quantity > 1 ? 's' : ''}):</span>
                    <span className="font-mono font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% Included):</span>
                    <span className="font-mono font-bold text-slate-900">₹{tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Express Air Shipping:</span>
                    <span className="font-bold text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="font-mono text-base text-[#0066FF]">₹{lineTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Clear Explicit Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Payment & Checkout Policy</span>
                </div>
                <ul className="text-[11px] text-amber-800/90 space-y-1 list-disc list-inside font-medium leading-relaxed">
                  <li>This 1-click action redirects directly to the secure <strong>Razorpay Payment Gateway</strong>.</li>
                  <li><strong>Pay on Delivery (COD)</strong> is available on <strong>Manual Checkout</strong> only.</li>
                </ul>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOneClickConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isInitiatingOneClick}
                  onClick={handleProceedOneClick}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isInitiatingOneClick ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Initiating Checkout...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Proceed to 1-Click Payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
