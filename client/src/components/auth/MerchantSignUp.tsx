import React, { useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Store, AlertCircle, Loader2, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const MerchantSignUp: React.FC = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('Smartphones & Audio');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Email verification step states
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Handle Google OAuth Sign Up for Merchants
  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/merchant/dashboard'
      });
    } catch (err: any) {
      console.error('Google Merchant Sign Up Error:', err);
      setErrorMessage(err.errors?.[0]?.message || 'Failed to register with Google');
      setIsLoading(false);
    }
  };

  // Submit initial merchant signup form
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (!email || !password || !storeName || !ownerName) {
      setErrorMessage('Please fill in all required merchant registration fields.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const nameParts = ownerName.trim().split(' ');
      const firstName = nameParts[0] || 'Merchant';
      const lastName = nameParts.slice(1).join(' ') || storeName;

      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      // Send verification email code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
      showToast('Verification code sent to your business email!', 'info');
    } catch (err: any) {
      console.error('Merchant Sign Up Error:', err);
      const msg = err.errors?.[0]?.message || 'Failed to create merchant account. Please verify details.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit 6-digit verification code & complete registration
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (!verificationCode) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        showToast('Merchant account created! Welcome to NexVolt Seller Hub.', 'success');
        navigate('/merchant/dashboard');
      } else {
        setErrorMessage('Verification incomplete. Please check your details.');
      }
    } catch (err: any) {
      console.error('Verification Error:', err);
      const msg = err.errors?.[0]?.message || 'Invalid verification code. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 relative overflow-hidden">
        {/* Verification View */}
        {pendingVerification ? (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-blue-50 border border-blue-200 text-[#0066FF] mb-3 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Verify Merchant Email</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">
                We sent a 6-digit verification code to <span className="text-[#0066FF] font-bold">{email}</span>.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full text-center text-2xl tracking-widest font-mono bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 rounded-xl py-3 text-slate-900 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !isLoaded}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Merchant Registration</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 mt-2 font-medium"
              >
                ← Back to edit details
              </button>
            </form>
          </div>
        ) : (
          /* Normal Merchant Registration Form */
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0066FF] text-xs font-bold uppercase tracking-wider mb-3">
                <Store className="w-3.5 h-3.5 text-[#0066FF]" /> NexVolt Seller Onboarding
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Become a NexVolt Merchant</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">
                Sell flagship electronics with 0% listing fees & automated AI revenue recovery.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading || !isLoaded}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm transition duration-200 shadow-xs disabled:opacity-50"
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
              <span>Register as Merchant with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-xs uppercase text-slate-400 font-bold tracking-wider">
                Or fill store profile
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Store / Brand Name *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="VoltMatrix Tech Hub"
                    required
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl py-2.5 pl-9 pr-3 text-slate-900 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Contact Person / Owner Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Marcus Vance"
                    required
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl py-2.5 pl-9 pr-3 text-slate-900 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Business Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seller@voltmatrix.com"
                    required
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl py-2.5 pl-9 pr-3 text-slate-900 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Primary Electronics Category
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl py-2.5 pl-9 pr-3 text-slate-900 text-sm outline-none"
                  >
                    <option value="Smartphones & Audio">Smartphones & Audio</option>
                    <option value="Laptops & Workstations">Laptops & Workstations</option>
                    <option value="Gaming Hardware & VR">Gaming Hardware & VR</option>
                    <option value="Smartwatches & Wearables">Smartwatches & Wearables</option>
                    <option value="Cameras & 4K Drones">Cameras & 4K Drones</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password (min. 8 characters) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={8}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl py-2.5 pl-9 pr-10 text-slate-900 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isLoaded}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition duration-200 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Registering Merchant...</span>
                  </>
                ) : (
                  <>
                    <span>Create Merchant Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              Already registered as a merchant?{' '}
              <Link to="/merchant/sign-in" className="text-[#0066FF] hover:text-blue-700 font-bold hover:underline">
                Sign In to Seller Hub
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
