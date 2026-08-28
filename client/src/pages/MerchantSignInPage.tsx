import React from 'react';
import { MerchantSignIn } from '../components/auth/MerchantSignIn';
import { Store, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export const MerchantSignInPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Merchant Branding & Value Props */}
        <div className="lg:col-span-6 space-y-6 hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider">
            <Store className="w-3.5 h-3.5 text-[#0066FF]" /> NexVolt Seller Portal
          </div>

          <h1 className="text-4xl font-extrabold text-slate-900 font-heading leading-tight">
            Grow Your Tech Business <br />
            <span className="text-gradient">With Automated AI Sales.</span>
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed max-w-md">
            Sign in to your merchant dashboard to add new electronic flagships, monitor real-time orders, manage inventory, and recover lost checkout revenue with NexVolt AI Agents.
          </p>

          <div className="space-y-3.5 pt-4">
            <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span>Automated AI revenue recovery on all abandoned customer checkouts</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200">
                <Zap className="w-4 h-4" />
              </div>
              <span>Instant 24-hr express logistics & Pan-India dispatch network</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>Zero transaction fraud risk with 256-bit Razorpay payouts</span>
            </div>
          </div>
        </div>

        {/* Right Merchant Sign In Component */}
        <div className="lg:col-span-6 w-full">
          <MerchantSignIn />
        </div>
      </div>
    </div>
  );
};
