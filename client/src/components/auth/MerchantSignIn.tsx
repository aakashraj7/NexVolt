import React, { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Store, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const MerchantSignIn: React.FC = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Google OAuth Sign In for Merchants
  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/merchant/dashboard'
      });
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMessage(err.errors?.[0]?.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  // Handle Merchant Email / Password Sign In
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (!email || !password) {
      setErrorMessage('Please provide your merchant email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        showToast('Welcome to NexVolt Merchant Hub!', 'success');
        navigate('/merchant/dashboard');
      } else {
        setErrorMessage('Verification step required. Please check your business email.');
      }
    } catch (err: any) {
      console.error('Merchant Sign In Error:', err);
      const msg = err.errors?.[0]?.message || 'Invalid merchant credentials. Please verify your details.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 relative overflow-hidden">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0066FF] text-xs font-bold uppercase tracking-wider mb-3">
            <Store className="w-3.5 h-3.5 text-[#0066FF]" /> NexVolt Seller Hub
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Merchant Sign In</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            Manage your electronics inventory, track customer orders, and access AI Revenue Recovery.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || !isLoaded}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm transition duration-200 shadow-xs group disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Sign In as Merchant with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs uppercase text-slate-400 font-bold tracking-wider">
            Or with business email
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Merchant / Business Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seller@brandstore.com"
                required
                className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm placeholder-slate-400 transition outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 rounded-xl py-3 pl-11 pr-11 text-slate-900 text-sm placeholder-slate-400 transition outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !isLoaded}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition duration-200 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Access Merchant Hub</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified Merchant Portal Protection</span>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          New seller on NexVolt?{' '}
          <Link to="/merchant/sign-up" className="text-[#0066FF] hover:text-blue-700 font-bold hover:underline">
            Register as a Merchant
          </Link>
        </div>
      </div>
    </div>
  );
};
