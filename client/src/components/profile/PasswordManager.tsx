import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, Mail, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

interface PasswordManagerProps {
  userId?: string;
  email?: string;
  hasPassword?: boolean;
  userDoc?: any;
  onRefresh?: () => void | Promise<void>;
  onPasswordUpdated?: () => void;
}

export const PasswordManager: React.FC<PasswordManagerProps> = ({
  userId,
  email,
  hasPassword,
  userDoc,
  onRefresh,
  onPasswordUpdated
}) => {
  const { showToast } = useToast();

  const resolvedUserId = userId || userDoc?.userId || '';
  const resolvedEmail = email || userDoc?.email || '';
  const resolvedHasPassword = hasPassword !== undefined ? hasPassword : Boolean(userDoc?.hasPassword);
  const handleUpdated = onPasswordUpdated || onRefresh || (() => {});

  const [step, setStep] = useState<'initial' | 'verify'>('initial');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  const actionType = resolvedHasPassword ? 'reset' : 'create';

  const handleSendCode = async () => {
    if (!resolvedEmail) {
      setErrorMessage('User email is required.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.sendPasswordVerificationCode(resolvedEmail, actionType);
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setStep('verify');
      showToast(`Verification code sent to ${resolvedEmail}`, 'info');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !newPassword) {
      setErrorMessage('Please enter the verification code and your new password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await api.verifyAndSetPassword({
        userId: resolvedUserId,
        email: resolvedEmail,
        code: code.trim(),
        newPassword
      });

      setSuccessMessage(res.message || 'Password successfully updated!');
      showToast(res.message || 'Password updated!', 'success');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setStep('initial');
      handleUpdated();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0066FF] border border-blue-200">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 font-heading">
              {hasPassword ? 'Reset Account Password' : 'Create Your Password'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {hasPassword
                ? 'Update your password by verifying your registered email address.'
                : 'You currently sign in via Google. Create an account password to enable direct email & password sign-in.'}
            </p>
          </div>
        </div>

        <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold ${
          hasPassword ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {hasPassword ? 'Password Active' : 'Google Auth Only (No Password)'}
        </span>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {step === 'initial' ? (
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center gap-3 text-xs text-slate-700">
            <Mail className="w-4 h-4 text-[#0066FF]" />
            <span>Verification code will be sent to: <strong className="text-slate-900">{email}</strong></span>
          </div>

          <button
            type="button"
            onClick={handleSendCode}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>{hasPassword ? 'Send Code to Reset Password' : 'Send Code to Create Password'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      ) : (
        <form onSubmit={handleVerifyAndSet} className="space-y-4 max-w-lg">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#0066FF]" /> Check your email inbox
            </p>
            <p className="text-slate-600 text-[11px]">
              We sent a 6-digit security code to <strong>{email}</strong>.
            </p>
            {devCode && (
              <p className="text-[11px] font-mono text-[#0066FF] font-bold mt-1">
                Development Test Code: {devCode}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              6-Digit Verification Code *
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              className="w-full text-center text-xl font-mono tracking-widest bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl py-2.5 text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {hasPassword ? 'New Password *' : 'Create Password *'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                minLength={8}
                required
                className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-900 outline-none"
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                minLength={8}
                required
                className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('initial')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Password...</span>
                </>
              ) : (
                <>
                  <span>{hasPassword ? 'Save New Password' : 'Create Account Password'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>End-to-end encrypted password protection for your NexVolt account.</span>
      </div>
    </div>
  );
};
