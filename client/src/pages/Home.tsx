import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
  Sparkles,
  Flame,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Gamepad2,
  Camera,
  Layers,
  ChevronRight,
  Clock,
  Store,
  TrendingUp,
  Percent,
  ShieldCheck
} from 'lucide-react';
import { ProductCard } from '../components/products/ProductCard';
import { api } from '../lib/api';
import type { Product, Category } from '../types';

export const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Flash Sale Countdown Timer
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 42,
    seconds: 19,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, deals, cats] = await Promise.all([
          api.getProducts({ isFeatured: true, limit: 8 }),
          api.getFeaturedDeals(),
          api.getCategories()
        ]);
        setFeaturedProducts(prodRes.products);
        setDealProducts(deals);
        setCategories(cats);
      } catch (err) {
        console.error('Error loading home page data:', err);
      }
    };
    fetchData();
  }, []);

  const heroSlide = {
    title: "Next-Gen Tech. Uncompromising Power.",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=85",
    link: "/products"
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone': return <Smartphone className="w-6 h-6 text-cyan-600" />;
      case 'Laptop': return <Laptop className="w-6 h-6 text-blue-600" />;
      case 'Headphones': return <Headphones className="w-6 h-6 text-purple-600" />;
      case 'Watch': return <Watch className="w-6 h-6 text-amber-600" />;
      case 'Gamepad2': return <Gamepad2 className="w-6 h-6 text-rose-600" />;
      case 'Camera': return <Camera className="w-6 h-6 text-emerald-600" />;
      default: return <Zap className="w-6 h-6 text-cyan-600" />;
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SHOWCASE SECTION */}
      <section className="relative overflow-hidden pt-8 pb-12 md:py-16 bg-gradient-to-b from-cyan-50/50 via-slate-50 to-slate-50 border-b border-slate-200/80">
        {/* Glow ambient lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-cyan-200/40 via-blue-200/30 to-purple-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100/80 border border-cyan-300 text-cyan-800 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>NexVolt Flagship Showcase</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] font-heading">
                Electrify Your <br />
                <span className="text-gradient">Digital Universe.</span>
              </h1>

              <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Discover titanium-built flagship phones, 240Hz OLED gaming machines, studio headphones, and next-gen smart drones with guaranteed 1-day express dispatch.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/products"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/20 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Explore All Electronics</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/products?deal=true"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 font-bold text-sm shadow-sm transition"
                >
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Flash Tech Deals</span>
                </Link>
              </div>

              {/* Stats Bar */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 text-left">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900 font-heading">50K+</p>
                  <p className="text-xs text-slate-500 font-medium">Happy Tech Enthusiasts</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-cyan-600 font-heading">100%</p>
                  <p className="text-xs text-slate-500 font-medium">Authentic Warranty</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-blue-600 font-heading">24-Hr</p>
                  <p className="text-xs text-slate-500 font-medium">Express Dispatch</p>
                </div>
              </div>
            </div>

            {/* Hero Right Media Spotlight */}
            <div className="lg:col-span-5">
              <div className="relative group">
                <div className="relative rounded-2xl overflow-hidden bg-white p-4 border border-slate-200 shadow-xl">
                  <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 mb-4">
                    <img
                      src={heroSlide.image}
                      alt="MacBook Pro & Electronics"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-cyan-800 border border-cyan-200 flex items-center gap-1.5 shadow-sm">
                      <Zap className="w-3.5 h-3.5 text-cyan-600" /> Spotlight of the Week
                    </div>
                  </div>

                  <div className="p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">MacBook Pro 16" M3 Max</span>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">In Stock</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      The most powerful Mac laptop ever built for pro developers & creators.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xl font-extrabold text-slate-900">₹3,49,900</span>
                      <Link
                        to="/products/apple-macbook-pro-16-m3-max"
                        className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      >
                        <span>View Specs</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES BROWSER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-cyan-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5" /> Curated Catalogs
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
              Browse by Electronics Category
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 hover:underline"
          >
            <span>View all catalogs</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group bg-white rounded-2xl p-4 flex flex-col items-center text-center border border-slate-200 hover:border-cyan-500/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:border-cyan-300 transition-all shadow-inner">
                {getCategoryIcon(cat.icon)}
              </div>
              <h3 className="text-xs font-bold text-slate-800 group-hover:text-cyan-700 transition line-clamp-1">
                {cat.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{cat.count}+ Products</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. LIGHTNING FLASH SALE COUNTDOWN SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900 border border-cyan-800 text-white relative overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400" /> Limited Time Flash Deals
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                Grab Mega Discounts Up to 35% OFF
              </h2>
            </div>

            {/* Countdown timer blocks */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" /> Ends In:
              </span>
              <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-white">
                <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 shadow text-cyan-400">
                  {String(timeLeft.hours).padStart(2, '0')}h
                </div>
                <span className="text-cyan-400 font-bold">:</span>
                <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 shadow text-cyan-400">
                  {String(timeLeft.minutes).padStart(2, '0')}m
                </div>
                <span className="text-cyan-400 font-bold">:</span>
                <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 shadow text-amber-400">
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </div>
              </div>
            </div>
          </div>

          {/* Deals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {dealProducts.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS CATALOG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-cyan-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" /> High Performance
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
              Featured Flagships & Creators Gear
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 hover:underline"
          >
            <span>Explore full store</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. SELL ON NEXVOLT - MERCHANT ONBOARDING CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-12 bg-white border border-slate-200 shadow-md relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0066FF] text-xs font-bold uppercase tracking-wider">
                <Store className="w-3.5 h-3.5 text-[#0066FF]" /> NexVolt Merchant Hub
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
                Are You an Electronics Brand or Retailer? <br />
                <span className="text-gradient">Sell to 100K+ Verified Tech Buyers.</span>
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                List your flagship electronics with <strong>0% platform commission for 90 days</strong>, pan-India express fulfillment logistics, and our autonomous <strong>AI Revenue Recovery agent</strong> that recovers lost customer checkouts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200">
                    <Percent className="w-4 h-4" />
                  </div>
                  <span>0% Listing Fees</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span>AI Revenue Recovery</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>Instant Razorpay Payouts</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center lg:items-end gap-3">
              <Link
                to="/merchant/sign-up"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-center"
              >
                <span>Register as Merchant</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/merchant/sign-in"
                className="text-xs font-bold text-slate-600 hover:text-[#0066FF] transition"
              >
                Already a Seller? Sign in to Merchant Portal →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. NEWSLETTER & COUPON CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 border border-cyan-200 text-center relative overflow-hidden shadow-sm">
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 border border-cyan-300 text-cyan-800 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-cyan-600" /> NexVolt VIP Perks
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
              Unlock Flat 10% Off Instant Discount
            </h2>
            <p className="text-slate-600 text-sm">
              Use promo code <span className="font-mono text-cyan-700 font-bold bg-white px-2 py-0.5 rounded border border-cyan-200 shadow-sm">NEXVOLT10</span> or <span className="font-mono text-amber-700 font-bold bg-white px-2 py-0.5 rounded border border-amber-200 shadow-sm">RAZORPAY20</span> at checkout.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email for VIP drops..."
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 shadow-sm"
              />
              <button
                type="button"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-md transition whitespace-nowrap"
              >
                Claim Offer
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
