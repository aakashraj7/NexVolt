import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import logoImg from '../../assets/nexVolt-logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-100/90 border-t border-slate-200 pt-12 pb-10 text-slate-600 text-sm">
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-200">
        {/* Brand summary */}
        <div className="md:col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="NexVolt Logo"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </Link>
          <p className="text-slate-600 text-xs leading-relaxed max-w-sm">
            NexVolt is the premier destination for high-performance flagship smartphones, pro creator workstations, audiophile sound, and next-gen smart tech with certified manufacturer warranty and express delivery.
          </p>

          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/70 border border-slate-300 text-slate-700 text-xs font-semibold">
              <CreditCard className="w-3.5 h-3.5 text-cyan-600" /> Secure 256-bit Encrypted Checkout
            </span>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h4 className="text-slate-900 font-bold text-sm tracking-wider uppercase">Electronics</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/products?category=Smartphones" className="hover:text-cyan-600 transition">Flagship Smartphones</Link></li>
            <li><Link to="/products?category=Laptops%20%26%20Computers" className="hover:text-cyan-600 transition">Laptops & Workstations</Link></li>
            <li><Link to="/products?category=Audio%20%26%20Headphones" className="hover:text-cyan-600 transition">ANC Headphones & Audio</Link></li>
            <li><Link to="/products?category=Smartwatches%20%26%20Wearables" className="hover:text-cyan-600 transition">Smartwatches & Fitness</Link></li>
            <li><Link to="/products?category=Gaming%20%26%20VR" className="hover:text-cyan-600 transition">PS5 & Gaming Hardware</Link></li>
            <li><Link to="/products?category=Cameras%20%26%20Drones" className="hover:text-cyan-600 transition">4K Drones & Cameras</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="space-y-3">
          <h4 className="text-slate-900 font-bold text-sm tracking-wider uppercase">Customer Hub</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/orders" className="hover:text-cyan-600 transition">Track Your Order</Link></li>
            <li><Link to="/wishlist" className="hover:text-cyan-600 transition">My Saved Wishlist</Link></li>
            <li><Link to="/cart" className="hover:text-cyan-600 transition">Shopping Bag</Link></li>
            <li><span className="hover:text-cyan-600 cursor-pointer">Warranty & Claims</span></li>
            <li><span className="hover:text-cyan-600 cursor-pointer">Shipping & Delivery Policy</span></li>
            <li><span className="hover:text-cyan-600 cursor-pointer">Terms & Conditions</span></li>
          </ul>
        </div>

        {/* About NexVolt */}
        <div className="space-y-3">
          <h4 className="text-slate-900 font-bold text-sm tracking-wider uppercase">About NexVolt</h4>
          <ul className="space-y-2 text-xs">
            <li><span className="hover:text-cyan-600 cursor-pointer">Company Story</span></li>
            <li><span className="hover:text-cyan-600 cursor-pointer">Authenticity Guarantee</span></li>
            <li><span className="hover:text-cyan-600 cursor-pointer">Careers</span></li>
            <li><span className="hover:text-cyan-600 cursor-pointer">Press & Media</span></li>
            <li><span className="hover:text-cyan-600 cursor-pointer">Privacy Policy</span></li>
            <li><span className="hover:text-cyan-600 cursor-pointer">Contact Support</span></li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex items-center justify-center text-xs">
        <p className="text-slate-500">
          © 2026 NexVolt Electronics Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
