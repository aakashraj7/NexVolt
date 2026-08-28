import React from 'react';
import { MerchantSignUp } from '../components/auth/MerchantSignUp';
import { Store, Percent, Award, Sparkles } from 'lucide-react';

export const MerchantSignUpPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Seller Benefits Showcase */}
        <div className="lg:col-span-6 space-y-6 hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" /> 0% Platform Fee for 90 Days
          </div>

          <h1 className="text-4xl font-extrabold text-slate-900 font-heading leading-tight">
            Launch Your Brand on <br />
            <span className="text-gradient">NexVolt Electronics.</span>
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed max-w-md">
            Join premier electronics manufacturers, brands, and certified retailers across India. Reach hundreds of thousands of verified tech enthusiasts with built-in conversion boost.
          </p>

          <div className="space-y-3.5 pt-4">
            <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200">
                <Percent className="w-4 h-4" />
              </div>
              <span>Industry-lowest 0% listing commission during launch</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200">
                <Award className="w-4 h-4" />
              </div>
              <span>Verified merchant badge & priority search placement</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-200">
                <Store className="w-4 h-4" />
              </div>
              <span>Full inventory management, order dispatch & AI recovery suite</span>
            </div>
          </div>
        </div>

        {/* Right Merchant Sign Up Component */}
        <div className="lg:col-span-6 w-full">
          <MerchantSignUp />
        </div>
      </div>
    </div>
  );
};
