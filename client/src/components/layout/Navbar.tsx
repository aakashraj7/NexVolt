import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  LayoutGrid,
  ChevronDown,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Gamepad2,
  Camera,
  Flame,
  Store,
  LayoutDashboard,
  Eye,
  Edit,
  Plus
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { CustomUserMenu } from '../auth/CustomUserMenu';
import { MOCK_PRODUCTS } from '../../lib/mockData';
import { api } from '../../lib/api';
import type { Product } from '../../types';

import logoImg from '../../assets/nexVolt-logo.png';

export const Navbar: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const [isMerchant, setIsMerchant] = useState(false);
  const [merchantProducts, setMerchantProducts] = useState<Product[]>([]);
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !user) {
      setIsMerchant(false);
      setMerchantProducts([]);
      return;
    }
    const checkRole = async () => {
      try {
        const roleData = await api.checkUserRole(user.id, user.primaryEmailAddress?.emailAddress);
        const merchantActive = roleData?.isMerchant === true || roleData?.role === 'merchant';
        setIsMerchant(merchantActive);
        if (merchantActive) {
          const prodsRes = await api.getMerchantProducts(user.id, { limit: 100 });
          if (prodsRes?.products) {
            setMerchantProducts(prodsRes.products);
          }
        }
      } catch {
        setIsMerchant(false);
      }
    };
    checkRole();
  }, [isSignedIn, user]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close suggestions and categories dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(e.target as Node)) {
        setShowCategoriesMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filter live search suggestions (Scoped to merchant's products if isMerchant)
  const suggestions = searchQuery.trim()
    ? isMerchant
      ? merchantProducts.filter(
          (p) =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 6)
      : MOCK_PRODUCTS.filter(
          (p) =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      if (isMerchant) {
        navigate(`/merchant/dashboard?tab=products&search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const navCategories = [
    { name: 'Smartphones', icon: Smartphone, desc: 'iPhones, Galaxy, Pixels & foldables' },
    { name: 'Laptops & Computers', icon: Laptop, desc: 'MacBooks, RTX laptops & rigs' },
    { name: 'Audio & Headphones', icon: Headphones, desc: 'ANC headsets, studio monitors & buds' },
    { name: 'Smartwatches & Wearables', icon: Watch, desc: 'Apple Watch, Garmin & trackers' },
    { name: 'Gaming & VR', icon: Gamepad2, desc: 'PS5, Xbox, VR headsets & gear' },
    { name: 'Cameras & Drones', icon: Camera, desc: '4K drones, mirrorless & action cams' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full pt-2 sm:pt-3 pb-2 sm:pb-3 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Curvey Floating Navbar Capsule */}
        <div className="bg-white/50 backdrop-blur-2xl border border-white/70 rounded-2xl sm:rounded-full shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 px-3.5 sm:px-6 py-2.5 transition-all duration-300">
          <div className="flex items-center justify-between gap-2.5 lg:gap-5">
            {/* 1. Left: Logo & Merchant Mode Bandage Sticker */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link to="/" className="shrink-0 flex items-center group">
                <img
                  src={logoImg}
                  alt="NexVolt"
                  className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-102"
                />
              </Link>

              {/* Bandage Style Sticker for Merchant Mode */}
              {isMerchant && (
                <Link
                  to="/merchant/dashboard"
                  className="relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-black text-[9px] sm:text-[11px] tracking-wider uppercase shadow-md shadow-amber-500/25 border-y border-dashed border-amber-700/50 rounded-xs -rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-200 group shrink-0 select-none cursor-pointer font-poppins"
                  title="Merchant Mode Active - Click to open Seller Dashboard"
                >
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-3 bg-amber-700/30 rounded-r-xs pointer-events-none" />
                  <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-900 group-hover:scale-110 transition-transform" />
                  <span className="font-bold tracking-wide">Merchant Mode</span>
                  <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-3 bg-amber-700/30 rounded-l-xs pointer-events-none" />
                </Link>
              )}
            </div>

            {/* 2. Quick Access: All Products & Categories Dropdown (Customer Mode Only) */}
            {!isMerchant && (
              <div className="hidden sm:flex items-center gap-2">
                {/* Direct All Products Button */}
                <Link
                  to="/products"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 bg-slate-100/90 hover:bg-[#0066FF] text-slate-700 hover:text-white text-xs font-bold transition-all shadow-xs whitespace-nowrap font-poppins group"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  <span>Products</span>
                </Link>

                {/* Categories Dropdown */}
                <div className="relative" ref={categoriesMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowCategoriesMenu(!showCategoriesMenu)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold transition shadow-xs whitespace-nowrap font-poppins ${
                      showCategoriesMenu
                        ? 'bg-slate-200/90 border-slate-300 text-slate-900'
                        : 'bg-slate-100/90 hover:bg-slate-200/80 border-slate-200 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                    <span>Categories</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showCategoriesMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Categories Mega Dropdown Menu */}
                  {showCategoriesMenu && (
                    <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Browse Categories
                        </span>
                        <Link
                          to="/products"
                          onClick={() => setShowCategoriesMenu(false)}
                          className="text-[11px] font-bold text-[#0066FF] hover:underline"
                        >
                          View All
                        </Link>
                      </div>

                      <div className="space-y-1">
                        {navCategories.map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <Link
                              key={cat.name}
                              to={`/products?category=${encodeURIComponent(cat.name)}`}
                              onClick={() => setShowCategoriesMenu(false)}
                              className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-[#0066FF] flex items-center justify-center shrink-0 transition">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 group-hover:text-[#0066FF] transition truncate">
                                  {cat.name}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {cat.desc}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      <div className="pt-2 mt-1 border-t border-slate-100">
                        <Link
                          to="/products?deal=true"
                          onClick={() => setShowCategoriesMenu(false)}
                          className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100/80 text-amber-800 text-xs font-bold transition"
                        >
                          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span>Today's Flash Deals & Discounts</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Enhanced Search */}
            <div className="flex-1 max-w-xl lg:max-w-2xl hidden md:block" ref={searchContainerRef}>
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={isMerchant ? "Search your store products (e.g. iPhone, RTX, SKU)..." : "Search laptops, smartphones, headphones, RTX GPUs..."}
                  className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-full py-2.5 pl-11 pr-26 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 px-5 py-1.5 rounded-full bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition font-poppins cursor-pointer"
                >
                  Search
                </button>

                {/* Live Search Suggestions Dropdown */}
                {showSuggestions && searchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-150 font-poppins">
                    <div className="p-2 space-y-1">
                      <div className="flex items-center justify-between px-3 py-1 border-b border-slate-100 mb-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {isMerchant ? `Your Store Listings (${suggestions.length})` : 'Matching Electronics'}
                        </p>
                        {isMerchant && (
                          <span className="text-[10px] font-semibold text-[#0066FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Merchant Scoped
                          </span>
                        )}
                      </div>

                      {suggestions.length > 0 ? (
                        suggestions.map((item) => (
                          <div
                            key={item._id}
                            className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-slate-50 transition group"
                          >
                            <Link
                              to={`/products/${item.slug || item._id}`}
                              onClick={() => setShowSuggestions(false)}
                              className="flex items-center gap-3 flex-1 min-w-0"
                            >
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-10 h-10 object-cover rounded-xl bg-slate-100 border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#0066FF] transition">
                                  {item.title}
                                </p>
                                <div className="flex items-center gap-2 text-[11px]">
                                  <span className="text-[#0066FF] font-mono font-bold">
                                    ₹{item.price.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-500 font-medium text-[10px]">
                                    {item.category}
                                  </span>
                                </div>
                              </div>
                            </Link>

                            {isMerchant ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowSuggestions(false);
                                    navigate(`/merchant/dashboard?tab=products&editProductId=${item._id}`);
                                  }}
                                  className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-[#0066FF] text-[#0066FF] hover:text-white border border-blue-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Edit this product in Product Studio"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <Link
                                  to={`/products/${item.slug || item._id}`}
                                  onClick={() => setShowSuggestions(false)}
                                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                                  title="View Customer Product Page"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            ) : (
                              <Link
                                to={`/products/${item.slug || item._id}`}
                                onClick={() => setShowSuggestions(false)}
                                className="text-xs font-bold text-[#0066FF] px-2 py-1 hover:underline"
                              >
                                View
                              </Link>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center space-y-2">
                          <p className="text-xs text-slate-500 font-medium">
                            {isMerchant
                              ? `No products in your store match "${searchQuery}".`
                              : `No products found matching "${searchQuery}".`}
                          </p>
                          {isMerchant && (
                            <Link
                              to="/merchant/dashboard?tab=products"
                              onClick={() => setShowSuggestions(false)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0066FF] text-white text-xs font-bold shadow-xs hover:bg-blue-600 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add New Product</span>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right Action Icons Group */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* If NOT Merchant: Show Wishlist & Cart */}
              {!isMerchant ? (
                <>
                  {/* 4. Wishlist Shortcut */}
                  <Link
                    to="/wishlist"
                    className="flex flex-col items-center justify-center text-slate-700 hover:text-[#0066FF] transition px-1.5 sm:px-2 py-0.5 group relative"
                    title="Saved Wishlist"
                  >
                    <div className="relative">
                      <Heart className="w-5 h-5 text-slate-700 group-hover:text-[#0066FF] group-hover:scale-105 transition-transform" />
                      {isSignedIn && totalWishlistItems > 0 && (
                        <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-xs">
                          {totalWishlistItems}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 group-hover:text-[#0066FF] mt-0.5">
                      Wishlist
                    </span>
                  </Link>

                  {/* 5. Clear Cart Status */}
                  <Link
                    to="/cart"
                    className="flex flex-col items-center justify-center text-slate-700 hover:text-[#0066FF] transition px-2 py-0.5 group relative"
                    title="Shopping Bag"
                  >
                    <div className="relative">
                      <ShoppingBag className="w-5 h-5 text-slate-700 group-hover:text-[#0066FF] group-hover:scale-105 transition-transform" />
                      {isSignedIn && totalItems > 0 && (
                        <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-[#0066FF] text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-xs">
                          {totalItems}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 group-hover:text-[#0066FF] mt-0.5">
                      Cart
                    </span>
                  </Link>
                </>
              ) : (
                /* Merchant Shortcut: Quick Storefront & Dashboard Pills */
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/merchant/storefront"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition shadow-xs group font-poppins"
                    title="Live Store Preview"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800 transition-colors" />
                    <span>Storefront</span>
                  </Link>
                  <Link
                    to="/merchant/dashboard"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-[#0066FF] border border-blue-200 hover:border-[#0066FF] text-[#0066FF] hover:text-white text-xs font-bold transition-all shadow-xs group font-poppins"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Dashboard</span>
                  </Link>
                </div>
              )}

              {/* 6. Primary CTA / User Dropdown */}
              <CustomUserMenu />

              {/* Mobile Menu Trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search & Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white border border-slate-200 rounded-3xl p-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
            {/* Mobile search */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isMerchant ? "Search store catalog..." : "Search electronics..."}
                className="w-full bg-slate-100 border border-slate-200 rounded-full py-2 pl-9 pr-20 text-sm text-slate-900 outline-none"
              />
              <button
                type="submit"
                className="absolute right-1 px-4 py-1.5 rounded-full bg-[#0066FF] text-white text-xs font-bold"
              >
                Search
              </button>
            </form>

            {isMerchant ? (
              <div className="space-y-1 pt-1 font-poppins">
                <Link
                  to="/merchant/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-slate-900 bg-amber-100 hover:bg-amber-200/80 font-black text-sm transition"
                >
                  <Store className="w-4 h-4 text-amber-800" />
                  <span>Seller Operations Dashboard</span>
                </Link>
                <Link
                  to="/merchant/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-sm transition"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-500" />
                  <span>Merchant Store Profile</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                <Link
                  to="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#0066FF] font-bold hover:bg-slate-50 text-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Products (All Categories)</span>
                </Link>

                {navCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={cat.name}
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium"
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{cat.name}</span>
                    </Link>
                  );
                })}

                <Link
                  to="/products?deal=true"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-700 bg-amber-50 font-bold text-sm"
                >
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Today's Lightning Deals</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
