import React, { useState, useRef, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import {
  User,
  Package,
  Heart,
  LogOut,
  ChevronDown,
  Loader2,
  LayoutDashboard,
  PackagePlus,
  Receipt,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';

export const CustomUserMenu: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsMerchant(false);
      return;
    }
    const checkRole = async () => {
      try {
        const roleData = await api.checkUserRole(user.id, user.primaryEmailAddress?.emailAddress);
        setIsMerchant(roleData?.isMerchant === true || roleData?.role === 'merchant');
      } catch {
        setIsMerchant(false);
      }
    };
    checkRole();
  }, [user]);

  if (!isLoaded || !user) {
    return (
      <Link
        to="/sign-in"
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 whitespace-nowrap"
      >
        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Sign In</span>
      </Link>
    );
  }

  const handleSignOut = async () => {
    if (isSigningOut) return;
    try {
      setIsSigningOut(true);
      await signOut({ redirectUrl: isMerchant ? '/merchant/sign-in' : '/sign-in' });
      showToast('Signed out successfully. See you soon!', 'info');
      setIsOpen(false);
    } catch (err) {
      console.error('Sign out error:', err);
      showToast('Error signing out. Please try again.', 'error');
    } finally {
      setIsSigningOut(false);
    }
  };

  const displayName = user.fullName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || (isMerchant ? 'Merchant' : 'Member');
  const email = user.primaryEmailAddress?.emailAddress || '';
  const avatarUrl = user.imageUrl;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-slate-100 border border-slate-300 hover:border-[#0066FF] transition shadow-xs cursor-pointer select-none"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className={`w-7 h-7 rounded-full object-cover border ${isMerchant ? 'border-amber-500 ring-1 ring-amber-400/50' : 'border-[#0066FF]/40'}`}
          />
        ) : (
          <div className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center ${isMerchant ? 'bg-gradient-to-tr from-amber-500 to-amber-600' : 'bg-gradient-to-tr from-[#0066FF] to-[#0052CC]'}`}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-xs font-bold text-slate-800 max-w-[100px] truncate hidden md:inline">
          {displayName}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Profile Header */}
          <div className="p-3 border-b border-slate-100 mb-1">
            <div className="flex items-center gap-2.5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className={`w-10 h-10 rounded-full object-cover border ${isMerchant ? 'border-amber-500 ring-2 ring-amber-400/30' : 'border-[#0066FF]'}`}
                />
              ) : (
                <div className={`w-10 h-10 rounded-full text-white font-bold text-sm flex items-center justify-center ${isMerchant ? 'bg-gradient-to-tr from-amber-500 to-amber-600' : 'bg-gradient-to-tr from-[#0066FF] to-[#0052CC]'}`}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                  {isMerchant && <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 truncate">{email}</p>
                {isMerchant ? (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                    Verified Merchant
                  </span>
                ) : (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-[#0066FF] border border-blue-200 text-[10px] font-bold rounded-md">
                    Customer Account
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-0.5">
            {isMerchant ? (
              /* Dedicated Merchant Navigation Menu */
              <>
                <Link
                  to="/merchant/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:text-[#0066FF] hover:bg-blue-50/60 transition group"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#0066FF] group-hover:scale-110 transition-transform" />
                  <span>Merchant Dashboard</span>
                </Link>

                <Link
                  to="/merchant/dashboard?tab=products"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <PackagePlus className="w-4 h-4 text-emerald-600" />
                  <span>Store Catalog</span>
                </Link>

                <Link
                  to="/merchant/dashboard?tab=orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <Receipt className="w-4 h-4 text-purple-600" />
                  <span>Customer Sales Orders</span>
                </Link>

                <Link
                  to="/merchant/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Store Profile & Settings</span>
                </Link>
              </>
            ) : (
              /* Dedicated Customer Navigation Menu */
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <User className="w-4 h-4 text-[#0066FF]" />
                  <span>My Profile & Addresses</span>
                </Link>

                <Link
                  to="/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <Package className="w-4 h-4 text-[#0066FF]" />
                  <span>My Orders</span>
                </Link>

                <Link
                  to="/wishlist"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Saved Wishlist</span>
                </Link>
              </>
            )}

            <div className="border-t border-slate-100 my-1 pt-1">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-left cursor-pointer ${
                  isSigningOut
                    ? 'bg-rose-50 text-rose-700 cursor-not-allowed opacity-90'
                    : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 active:scale-95'
                }`}
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />
                    <span className="animate-pulse">Signing Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
