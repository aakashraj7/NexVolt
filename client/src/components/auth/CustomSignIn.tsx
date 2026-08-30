import React, { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  KeyRound,
  X
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';

interface CustomSignInProps {
  onSwitchMode?: () => void;
}

export const CustomSignIn: React.FC<CustomSignInProps> = ({ onSwitchMode }) => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    if (!isLoaded || isGoogleLoading) return;
    try {
      setIsGoogleLoading(true);
      setErrorMessage('');
      sessionStorage.setItem('nexvolt_auth_portal', 'customer');
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback?portal=customer`,
        redirectUrlComplete: `${window.location.origin}/`,
        continueSignUp: true
      });
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMessage(err.errors?.[0]?.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  // Handle Email / Password Sign In
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    // Pre-check role guard against accidental merchant login on customer portal
    try {
      const guard = await api.enforcePortalGuard({ email: email.trim(), portal: 'customer' });
      if (guard && !guard.allowed) {
        const msg = guard.message || 'This action is not possible. This account is registered as a Merchant. Please use the Merchant Portal.';
        showToast(msg, 'error');
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }
    } catch (gErr) {
      console.warn('Portal guard pre-check warning:', gErr);
    }

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password: password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        showToast('Welcome back to NexVolt!', 'success');
        navigate('/');
      } else {
        console.log('Additional verification required', result);
        setErrorMessage('Verification step required. Please check your email.');
      }
    } catch (err: any) {
      console.error('Sign In Error:', err);
      const msg = err.errors?.[0]?.message || 'Invalid email or password. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Request Forgot Password Code
  const handleRequestForgotCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await api.sendPasswordVerificationCode(forgotEmail.trim(), 'reset');
      showToast(res.message || 'Verification code sent to your email!', 'info');
      setForgotStep('verify');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error sending reset code. Please try again.', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Verify Code & Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCode || !forgotNewPassword) {
      showToast('Please enter the 6-digit code and a new password.', 'error');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await api.verifyAndSetPassword({
        email: forgotEmail.trim(),
        code: forgotCode.trim(),
        newPassword: forgotNewPassword
      });
      showToast(res.message || 'Password reset successfully! You can now sign in.', 'success');
      setShowForgotModal(false);
      setForgotStep('request');
      setForgotCode('');
      setForgotNewPassword('');
      setPassword(forgotNewPassword);
      setEmail(forgotEmail);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid code or error resetting password.', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      <div className="bg-white/50 backdrop-blur-2xl rounded-3xl lg:rounded-[36px] p-7 sm:p-9 shadow-2xl shadow-blue-500/10 border border-white/70 relative overflow-hidden transition-all duration-300">
        {/* Top Header Text (Clean, No Badge, No Emojis) */}
        <div className="text-center mb-6">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#0066FF] mb-1.5">
            Welcome Back
          </p>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
            Sign In to <span className="text-[#0066FF]">NexVolt</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1.5 font-medium leading-relaxed max-w-xs mx-auto">
            Access your tech orders, saved gear, and exclusive member discounts.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-toast-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Google OAuth Button with Active Loading Animation */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
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
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-200/80"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">
            OR SIGN IN WITH EMAIL
          </span>
          <div className="flex-grow border-t border-slate-200/80"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              EMAIL ADDRESS
            </label>
            <div className="relative group">
              <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-white/60 border border-slate-200/90 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 text-xs placeholder-slate-400 transition-all duration-200 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              PASSWORD
            </label>
            <div className="relative group">
              <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-white/60 border border-slate-200/90 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-2.5 pl-10 pr-10 text-slate-900 text-xs placeholder-slate-400 transition-all duration-200 outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setShowForgotModal(true);
              }}
              className="text-xs font-bold text-[#0066FF] hover:underline"
            >
              Forgot Password?
            </button>
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
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <div className="mt-6 text-center text-xs text-slate-500 font-medium">
          Don't have a NexVolt account?{' '}
          {onSwitchMode ? (
            <button
              type="button"
              onClick={onSwitchMode}
              className="text-[#0066FF] hover:text-blue-700 font-bold hover:underline"
            >
              Create Account
            </button>
          ) : (
            <Link to="/sign-up" className="text-[#0066FF] hover:text-blue-700 font-bold hover:underline">
              Create Account
            </Link>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-toast-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <KeyRound className="w-4 h-4 text-[#0066FF]" />
                <span>Reset Your Password</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotStep === 'request' ? (
              <form onSubmit={handleRequestForgotCode} className="space-y-3">
                <p className="text-slate-500 text-xs">
                  Enter your registered account email. We'll send a 6-digit verification code.
                </p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-xl bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {forgotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-slate-500 text-xs">
                  Enter the 6-digit code sent to <strong className="text-slate-900">{forgotEmail}</strong> and your new password.
                </p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.trim())}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono tracking-widest text-center outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-xl bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {forgotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Reset Password & Finish'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
