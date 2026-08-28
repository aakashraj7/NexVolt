import React from 'react';
import { CustomSignIn } from '../components/auth/CustomSignIn';
import { Zap, CheckCircle2 } from 'lucide-react';

export const SignInPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Branding Showcase (5 cols) */}
        <div className="lg:col-span-6 space-y-6 hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-800 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-cyan-600" /> NexVolt VIP Lounge
          </div>

          <h1 className="text-4xl font-extrabold text-slate-900 font-heading leading-tight">
            Powering Next-Gen <br />
            <span className="text-gradient">Electronics Commerce.</span>
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed max-w-md">
            Sign in to track orders in real-time, redeem loyalty coupons, save flagship electronics to your wishlist, and enjoy instant 1-click checkout.
          </p>

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Exclusive 10% discount coupon <strong className="text-cyan-700">NEXVOLT10</strong> on signing in</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Sync shopping cart across all your devices seamlessly</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Priority express dispatch and hassle-free returns</span>
            </div>
          </div>
        </div>

        {/* Right Custom Sign In Box (6 cols) */}
        <div className="lg:col-span-6 w-full">
          <CustomSignIn />
        </div>
      </div>
    </div>
  );
};
