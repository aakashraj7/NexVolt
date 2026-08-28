import React from 'react';
import { CustomSignUp } from '../components/auth/CustomSignUp';
import { Gift, CheckCircle2 } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Branding Showcase */}
        <div className="lg:col-span-6 space-y-6 hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-800 text-xs font-bold uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5 text-cyan-600" /> New Member Welcome Pass
          </div>

          <h1 className="text-4xl font-extrabold text-slate-900 font-heading leading-tight">
            Join the NexVolt <br />
            <span className="text-gradient">Tech Revolution.</span>
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed max-w-md">
            Create an account in seconds. Get member-only access to lightning sales, early access drops for high-end gear, and instant express shipping.
          </p>

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>One-click Google or Email authentication</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Zero spam, end-to-end encrypted profile</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
              <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>7-day instant replacement on all electronic gear</span>
            </div>
          </div>
        </div>

        {/* Right Custom Sign Up Box */}
        <div className="lg:col-span-6 w-full">
          <CustomSignUp />
        </div>
      </div>
    </div>
  );
};
