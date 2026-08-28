import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { MerchantSignIn } from '../components/auth/MerchantSignIn';
import { MerchantSignUp } from '../components/auth/MerchantSignUp';
import { Percent, Award, Store, Shield } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

interface MerchantAuthPageProps {
  initialMode?: 'sign-in' | 'sign-up';
}

export const MerchantAuthPage: React.FC<MerchantAuthPageProps> = ({ initialMode = 'sign-in' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();
  const { showToast } = useToast();

  const isCurrentPathSignUp = location.pathname.startsWith('/merchant/sign-up');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(
    isCurrentPathSignUp ? 'sign-up' : initialMode
  );
  const [animDirection, setAnimDirection] = useState<'left' | 'right'>('right');

  // If already signed in as an existing customer, prevent viewing the merchant auth page
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    const checkRole = async () => {
      const roleData = await api.checkUserRole(user.id, user.primaryEmailAddress?.emailAddress);
      if (roleData?.exists === true && (!roleData.isMerchant && roleData.role !== 'merchant')) {
        showToast('This action is not possible. Customer accounts cannot access the Merchant Portal.', 'error');
        navigate('/', { replace: true });
      }
    };
    checkRole();
  }, [isLoaded, isSignedIn, user, navigate, showToast]);

  useEffect(() => {
    const isSignUp = location.pathname.startsWith('/merchant/sign-up');
    setMode(isSignUp ? 'sign-up' : 'sign-in');
  }, [location.pathname]);

  const handleSwitchMode = (targetMode: 'sign-in' | 'sign-up') => {
    setAnimDirection(targetMode === 'sign-up' ? 'left' : 'right');
    setMode(targetMode);
    navigate(targetMode === 'sign-up' ? '/merchant/sign-up' : '/merchant/sign-in');
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-hidden bg-transparent">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-cyan-300/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          
          {/* Left Seller Benefits Showcase (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5 py-2 lg:pr-8">
            <div key={mode} className="space-y-5 animate-auth-fade">
              {mode === 'sign-in' ? (
                <>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-heading leading-[1.15] tracking-tight">
                    Powering <br />
                    Next-Gen <br />
                    <span className="text-[#0066FF]">Merchant Commerce.</span>
                  </h1>

                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md font-medium">
                    Manage your electronics inventory, track customer orders, and access AI Revenue Recovery.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-heading leading-[1.15] tracking-tight">
                    Launch Your Brand on <br />
                    <span className="text-[#0066FF]">NexVolt Electronics.</span>
                  </h1>

                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md font-medium">
                    Join premier electronics manufacturers, brands, and certified retailers across India. Reach hundreds of thousands of verified tech enthusiasts.
                  </p>
                </>
              )}

              {/* 3 Seller Features */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold group">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <span>Industry-lowest 0% listing commission during launch</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold group">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <span>Verified merchant badge & priority search placement</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold group">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <span>Full inventory management, order dispatch & AI recovery suite</span>
                </div>
              </div>
            </div>

            {/* Bottom Security Trust Card */}
            <div className="pt-2">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white shadow-xs flex items-center gap-3 max-w-md">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200">
                  <Shield className="w-4 h-4 text-[#0066FF]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Secure. Trusted. Built for Sellers.</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Your business data and payments are secured end-to-end.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section with Smooth Sliding Form Container (6 cols) */}
          <div className="lg:col-span-6 flex items-center justify-center lg:justify-end">
            <div
              key={mode}
              className={`w-full ${
                animDirection === 'left' ? 'animate-auth-slide-left' : 'animate-auth-slide-right'
              }`}
            >
              {mode === 'sign-in' ? (
                <MerchantSignIn onSwitchMode={() => handleSwitchMode('sign-up')} />
              ) : (
                <MerchantSignUp onSwitchMode={() => handleSwitchMode('sign-in')} />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
