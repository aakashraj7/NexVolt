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
  Building2
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
  const { addToCart, removeFromCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Saved user addresses state for delivery selector
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);
  const addressDropdownRef = useRef<HTMLDivElement>(null);

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

  // Review form states
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard!', 'info');
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
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                {product.brand}
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

          {/* Delivery Address Selector for Logged In User */}
          {isSignedIn && user && userAddresses.length > 0 && (() => {
            const activeAddress = userAddresses.find(a => a._id === selectedAddressId) || userAddresses[0];

            return (
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Delivering to:</span>
                  </span>
                  <Link to="/profile" className="text-[11px] text-[#0066FF] hover:underline font-bold">
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

                      <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between px-2">
                        <Link
                          to="/profile"
                          onClick={() => setAddressDropdownOpen(false)}
                          className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1 py-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New / Manage in Profile</span>
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

          {/* Quantity & CTA buttons */}
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
                  onClick={() => setQuantity(Math.min(product.stockCount || 10, quantity + 1))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-emerald-600 font-bold">
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Buy & Cart Buttons - Mobile optimized stacking */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  const added = addToCart(product, quantity);
                  if (added) navigate('/cart');
                }}
                className="flex-1 py-3.5 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now with 1-Click</span>
              </button>

              {/* Dynamic Add / Remove from Cart Button */}
              {itemInCart ? (
                <button
                  type="button"
                  onClick={() => removeFromCart(product._id)}
                  className="py-3.5 sm:py-4 px-6 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-sm transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Remove from Cart</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => addToCart(product, quantity)}
                  className="py-3.5 sm:py-4 px-6 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-bold text-sm transition shadow-xs flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-[#0066FF]" />
                  <span>Add to Cart</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`py-3.5 sm:py-4 px-4 rounded-xl border transition shadow-sm flex items-center justify-center ${
                  isFavorited
                    ? 'bg-rose-50 border-rose-300 text-rose-600'
                    : 'bg-white border-slate-300 text-slate-500 hover:text-rose-600'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>
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

        {/* Write a Review Form */}
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
      </div>

      {/* Related Products Carousel */}
      {related.length > 0 && (
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
    </div>
  );
};
