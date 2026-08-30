import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/nexVolt-logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full px-3 sm:px-6 lg:px-8 mt-auto">
      {/* Curved Top Footer Card with Signature Glowing Shadow and Glassmorphism */}
      <div className="max-w-7xl mx-auto bg-white/50 backdrop-blur-2xl border-t border-x border-white/70 rounded-t-[36px] sm:rounded-t-[48px] shadow-2xl shadow-blue-500/10 p-6 sm:p-10 pb-8 transition-all duration-300">
        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-10 pb-8 border-b border-slate-200/80 text-slate-600 text-xs">
          {/* Brand summary */}
          <div className="md:col-span-2 space-y-3.5">
            <Link to="/" className="inline-block group">
              <img
                src={logoImg}
                alt="NexVolt Logo"
                className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-102"
              />
            </Link>
            <p className="text-slate-600 text-xs leading-relaxed max-w-sm font-medium">
              NexVolt is India's premier destination for high-performance flagship smartphones, pro creator workstations, audiophile sound, and next-gen smart tech with certified manufacturer warranty and express delivery.
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-slate-900 font-extrabold text-xs tracking-wider uppercase">Electronics</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/products?category=Smartphones" className="hover:text-[#0066FF] transition">Flagship Smartphones</Link></li>
              <li><Link to="/products?category=Laptops%20%26%20Computers" className="hover:text-[#0066FF] transition">Laptops & Workstations</Link></li>
              <li><Link to="/products?category=Audio%20%26%20Headphones" className="hover:text-[#0066FF] transition">ANC Headphones & Buds</Link></li>
              <li><Link to="/products?category=Smartwatches%20%26%20Wearables" className="hover:text-[#0066FF] transition">Smartwatches & Fitness</Link></li>
              <li><Link to="/products?category=Gaming%20%26%20VR" className="hover:text-[#0066FF] transition">PS5 & Gaming Hardware</Link></li>
              <li><Link to="/products?category=Cameras%20%26%20Drones" className="hover:text-[#0066FF] transition">4K Drones & Cameras</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-slate-900 font-extrabold text-xs tracking-wider uppercase">Customer Hub</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/orders" className="hover:text-[#0066FF] transition">Track Your Order</Link></li>
              <li><Link to="/wishlist" className="hover:text-[#0066FF] transition">My Saved Wishlist</Link></li>
              <li><Link to="/cart" className="hover:text-[#0066FF] transition">Shopping Bag</Link></li>
              <li><span className="hover:text-[#0066FF] cursor-pointer transition">Warranty & Claims</span></li>
              <li><span className="hover:text-[#0066FF] cursor-pointer transition">Shipping & Returns</span></li>
              <li><span className="hover:text-[#0066FF] cursor-pointer transition">Terms of Service</span></li>
            </ul>
          </div>

          {/* Merchant & Company */}
          <div className="space-y-3">
            <h4 className="text-slate-900 font-extrabold text-xs tracking-wider uppercase">Merchant & Brand</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/merchant/sign-in" className="text-[#0066FF] font-bold hover:underline">Seller Hub Login</Link></li>
              <li><Link to="/merchant/sign-up" className="hover:text-[#0066FF] transition">Become a Verified Seller</Link></li>
              <li><span className="hover:text-[#0066FF] cursor-pointer transition">Authenticity Guarantee</span></li>
              <li><span className="hover:text-[#0066FF] cursor-pointer transition">Privacy Policy</span></li>
              <li><span className="hover:text-[#0066FF] cursor-pointer transition">Contact Support</span></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex items-center justify-center text-xs text-slate-500 font-medium">
          <p>© 2026 NexVolt Electronics Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
