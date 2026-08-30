import React, { useState, useRef, useEffect } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Store,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  Check,
  Smartphone,
  Laptop,
  Gamepad2,
  Watch,
  Camera
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface MerchantSignUpProps {
  onSwitchMode?: () => void;
}

const CATEGORY_OPTIONS = [
  { name: 'Smartphones & Audio', icon: Smartphone, desc: 'Flagships, ANC headsets & buds' },
  { name: 'Laptops & Computers', icon: Laptop, desc: 'MacBooks, RTX rigs & workstations' },
  { name: 'Gaming & VR Gear', icon: Gamepad2, desc: 'PS5, GPUs, controllers & gear' },
  { name: 'Smartwatches & Wearables', icon: Watch, desc: 'Apple Watch, Garmin & wearables' },
  { name: 'Cameras & Drones', icon: Camera, desc: '4K drones, mirrorless & action cams' },
];

export const MerchantSignUp: React.FC<MerchantSignUpProps> = ({ onSwitchMode }) => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('Smartphones & Audio');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Email verification step states
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategoryObj =
    CATEGORY_OPTIONS.find((c) => c.name === category) || CATEGORY_OPTIONS[0];

  // Handle Google OAuth Sign Up for Merchants
  const handleGoogleSignUp = async () => {
    if (!isLoaded || isGoogleLoading) return;
    try {
      setIsGoogleLoading(true);
      setErrorMessage('');
      sessionStorage.setItem('nexvolt_auth_portal', 'merchant');
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback?portal=merchant`,
        redirectUrlComplete: `${window.location.origin}/merchant/onboarding`,
        continueSignIn: true
      });
    } catch (err: any) {
      console.error('Google Merchant Sign Up Error:', err);
      setErrorMessage(err.errors?.[0]?.message || 'Failed to register with Google');
      setIsGoogleLoading(false);
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
        emailAddress: email.trim(),
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
        navigate('/merchant/onboarding');
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
    <div className="w-full max-w-md mx-auto relative animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-white/50 backdrop-blur-2xl rounded-3xl lg:rounded-[36px] p-7 sm:p-9 shadow-2xl shadow-blue-500/10 border border-white/70 relative overflow-visible transition-all duration-300">
        {/* Verification View */}
        {pendingVerification ? (
          <div className="animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto mb-3 border border-blue-200 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Verify Business Email</h2>
              <p className="text-slate-500 text-xs mt-1.5 font-medium">
                We sent a 6-digit verification code to <strong className="text-[#0066FF]">{email}</strong>.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-toast-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                  className="w-full text-center text-xl tracking-widest font-mono bg-white/70 border border-slate-200/90 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 text-slate-900 outline-none transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Email & Launch Onboarding</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                ← Back to Edit Registration
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* Header Text (Clean, No Badge, No Emojis) */}
            <div className="text-center mb-6">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#0066FF] mb-1.5">
                Seller Registration
              </p>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                Register <span className="text-[#0066FF]">Store</span>
              </h2>
              <p className="text-slate-500 text-xs mt-1.5 font-medium leading-relaxed max-w-xs mx-auto">
                Sell your electronics to verified buyers across India with zero commission.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-toast-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading || isGoogleLoading || !isLoaded}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/90 hover:bg-white border border-slate-200/90 hover:border-slate-300 text-slate-700 font-bold text-xs transition-all duration-200 shadow-2xs hover:shadow-xs group disabled:opacity-75 active:scale-[0.99]"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0066FF]" />
                  <span className="animate-pulse text-[#0066FF] font-extrabold">Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Register with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-200/80"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">
                OR FILL BUSINESS PROFILE
              </span>
              <div className="flex-grow border-t border-slate-200/80"></div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Store / Brand Name *
                  </label>
                  <div className="relative group">
                    <Store className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Apex Tech"
                      className="w-full bg-white/60 border border-slate-200/90 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-2.5 pl-9 pr-3 text-slate-900 text-xs outline-none transition-all duration-200 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Owner Name *
                  </label>
                  <div className="relative group">
                    <User className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Alex Vance"
                      className="w-full bg-white/60 border border-slate-200/90 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-2.5 pl-9 pr-3 text-slate-900 text-xs outline-none transition-all duration-200 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Modern Custom Category Dropdown */}
              <div className="relative" ref={categoryDropdownRef}>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Primary Electronics Category
                </label>

                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className={`w-full flex items-center justify-between bg-white/60 hover:bg-white border rounded-xl py-2.5 px-3.5 text-xs text-slate-900 transition-all duration-200 shadow-2xs group outline-none ${
                    showCategoryDropdown
                      ? 'border-[#0066FF] ring-2 ring-[#0066FF]/15 bg-white'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
                      {React.createElement(selectedCategoryObj.icon, { className: 'w-3 h-3' })}
                    </div>
                    <span className="font-bold text-slate-800 truncate">{category}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0 ${
                      showCategoryDropdown ? 'rotate-180 text-[#0066FF]' : ''
                    }`}
                  />
                </button>

                {/* Animated Dropdown Menu */}
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/90 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                    {CATEGORY_OPTIONS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = item.name === category;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setCategory(item.name);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 group ${
                            isSelected
                              ? 'bg-blue-50/90 text-[#0066FF] font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-[#0066FF] text-white shadow-xs'
                                  : 'bg-slate-100 group-hover:bg-blue-50 text-slate-500 group-hover:text-[#0066FF]'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate leading-tight">{item.name}</p>
                              <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">{item.desc}</p>
                            </div>
                          </div>

                          {isSelected && <Check className="w-4 h-4 text-[#0066FF] shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Business Email Address *
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@yourbrand.com"
                    className="w-full bg-white/60 border border-slate-200/90 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-2.5 pl-9 pr-3 text-slate-900 text-xs placeholder-slate-400 transition-all duration-200 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-white/60 border border-slate-200/90 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-2.5 pl-9 pr-9 text-slate-900 text-xs placeholder-slate-400 transition-all duration-200 outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading || !isLoaded}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Store Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Merchant Account</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer link */}
            <div className="mt-5 text-center text-xs text-slate-500 font-medium">
              Already registered as a seller?{' '}
              {onSwitchMode ? (
                <button
                  type="button"
                  onClick={onSwitchMode}
                  className="text-[#0066FF] hover:text-blue-700 font-bold hover:underline"
                >
                  Sign In
                </button>
              ) : (
                <Link to="/merchant/sign-in" className="text-[#0066FF] hover:text-blue-700 font-bold hover:underline">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
