import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  ArrowLeft,
  Search,
  Package,
  Loader2,
  Plus
} from 'lucide-react';
import { api } from '../lib/api';
import { ProductCard } from '../components/products/ProductCard';
import type { Product } from '../types';

export const MerchantStorefrontPage: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating'>('featured');

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/merchant/sign-in');
      return;
    }

    if (isLoaded && isSignedIn && user) {
      const loadStorefrontData = async () => {
        try {
          setLoading(true);
          const [profileData, prodsRes] = await Promise.all([
            api.getMerchantProfile(user.id, {
              email: user.primaryEmailAddress?.emailAddress || '',
              fullName: user.fullName || ''
            }),
            api.getMerchantProducts(user.id, { limit: 100 })
          ]);

          if (profileData && profileData.merchantProfile) {
            setUserProfile(profileData);
          }

          if (prodsRes?.products) {
            setProducts(prodsRes.products);
          }
        } catch (err) {
          console.error('Error loading merchant storefront:', err);
        } finally {
          setLoading(false);
        }
      };

      loadStorefrontData();
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  const merchantProfile = userProfile?.merchantProfile;
  const storeName = merchantProfile?.storeName || `${user?.fullName || 'Seller'}'s Tech Store`;

  // Filter products scoped strictly to this merchant
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  let filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (sortBy === 'price_asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    filteredProducts.sort((a, b) => b.rating - a.rating);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-poppins">
      {/* Top Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <Link
          to="/merchant/dashboard"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0066FF] border border-slate-200 font-bold text-xs shadow-xs transition w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Merchant Hub</span>
        </Link>

        <Link
          to="/merchant/dashboard?tab=products"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md transition w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Manage & Add Products</span>
        </Link>
      </div>

      {/* Storefront Hero Card (Harmonious Light Glassmorphic Style) */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl shadow-blue-500/8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 tracking-tight">
            {storeName}
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
            {merchantProfile?.storeDescription || 'Official brand electronics, guaranteed genuine warranty, express dispatch across India.'}
          </p>
        </div>

        <div className="flex items-center gap-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl px-5 py-3.5 shrink-0 self-start md:self-auto shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#0066FF] text-white flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 leading-none">
              {products.length}
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">
              Active Listings
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Merchant Products */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search inside merchant store */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inside your store..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#0066FF] rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 outline-none transition"
          />
        </div>

        {/* Category Pills and Sort */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === ''
                ? 'bg-[#0066FF] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Categories ({products.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none transition cursor-pointer"
          >
            <option value="featured">Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 text-[#0066FF] animate-spin" />
          <p className="text-xs font-bold">Loading your store catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto border border-blue-200">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              No products found in your store
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {searchQuery || selectedCategory
                ? 'Try adjusting your search query or category filter.'
                : 'You have not added any products to your seller catalog yet.'}
            </p>
          </div>
          <Link
            to="/merchant/dashboard?tab=products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Products in Dashboard</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <p>
              Showing <span className="font-bold text-slate-900">{filteredProducts.length}</span> live products in your storefront
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} isMerchantView={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default MerchantStorefrontPage;
