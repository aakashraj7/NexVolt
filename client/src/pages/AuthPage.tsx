import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CustomSignIn } from '../components/auth/CustomSignIn';
import { CustomSignUp } from '../components/auth/CustomSignUp';
import { Tag, ShoppingCart, Truck, Shield } from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'sign-in' | 'sign-up';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'sign-in' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrentPathSignUp = location.pathname.startsWith('/sign-up');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(
    isCurrentPathSignUp ? 'sign-up' : initialMode
  );
  const [animDirection, setAnimDirection] = useState<'left' | 'right'>('right');

  useEffect(() => {
    const isSignUp = location.pathname.startsWith('/sign-up');
    setMode(isSignUp ? 'sign-up' : 'sign-in');
  }, [location.pathname]);

  const handleSwitchMode = (targetMode: 'sign-in' | 'sign-up') => {
    setAnimDirection(targetMode === 'sign-up' ? 'left' : 'right');
    setMode(targetMode);
    navigate(targetMode === 'sign-up' ? '/sign-up' : '/sign-in');
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-hidden bg-transparent">
      {/* Subtle Ambient Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-cyan-300/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          
          {/* Left Branding & Benefits Showcase (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5 py-2 lg:pr-8">
            {/* Animated Headline & Subtitle based on mode */}
            <div key={mode} className="space-y-5 animate-auth-fade">
              {mode === 'sign-in' ? (
                <>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-heading leading-[1.15] tracking-tight">
                    Powering <br />
                    Next-Gen <br />
                    <span className="text-[#0066FF]">Electronics Commerce.</span>
                  </h1>

                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md font-medium">
                    Sign in to track orders in real-time, redeem loyalty coupons, save flagship electronics to your wishlist, and enjoy instant 1-click checkout.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-heading leading-[1.15] tracking-tight">
                    Join the <br />
                    NexVolt <br />
                    <span className="text-[#0066FF]">Tech Revolution.</span>
                  </h1>

                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md font-medium">
                    Create an account in seconds. Get member-only access to lightning sales, early access drops for high-end gear, and instant express shipping.
                  </p>
                </>
              )}

              {/* 3 Feature Items */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold group">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    Exclusive 10% discount coupon <strong className="text-[#0066FF] font-extrabold">NEXVOLT10</strong> {mode === 'sign-in' ? 'on signing in' : 'on signing up'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold group">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    {mode === 'sign-in'
                      ? 'Sync shopping cart across all your devices seamlessly'
                      : 'Zero spam, end-to-end encrypted profile security'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold group">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <span>Priority express dispatch and hassle-free returns</span>
                </div>
              </div>
            </div>

            {/* Bottom Security Trust Card */}
            <div className="pt-2">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/60 backdrop-blur-2xl border border-white/80 shadow-2xl shadow-blue-500/10 flex items-center gap-3 max-w-md">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200">
                  <Shield className="w-4 h-4 text-[#0066FF]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-poppins">Secure. Trusted. Built for You.</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Your data is safe with enterprise-grade security.</p>
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
                <CustomSignIn onSwitchMode={() => handleSwitchMode('sign-up')} />
              ) : (
                <CustomSignUp onSwitchMode={() => handleSwitchMode('sign-in')} />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
