import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  User,
  MapPin,
  KeyRound,
  Calendar,
  Phone,
  Mail,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  X,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import type { UserProfile, UserAddress } from '../types';
import { useToast } from '../context/ToastContext';
import { AddressManager } from '../components/profile/AddressManager';
import { PasswordManager } from '../components/profile/PasswordManager';

export const ProfilePage: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security' | 'danger'>(
    tabParam === 'addresses' || tabParam === 'security' || tabParam === 'danger' ? tabParam : 'profile'
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Danger Zone Deactivation states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Phone Verification Notice Modal state
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);

  // Email Verification Modal states
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [emailVerifyOtp, setEmailVerifyOtp] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailOtpCountdown, setEmailOtpCountdown] = useState(0);

  // Sync activeTab with URL tab param and ensure top visibility
  useEffect(() => {
    if (tabParam === 'addresses' || tabParam === 'security' || tabParam === 'profile' || tabParam === 'danger') {
      setActiveTab(tabParam as any);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tabParam]);

  // Countdown timer for email OTP resend
  useEffect(() => {
    let timer: any;
    if (emailOtpCountdown > 0) {
      timer = setInterval(() => setEmailOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [emailOtpCountdown]);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say' | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const email = user.primaryEmailAddress?.emailAddress || '';
      const name = user.fullName || '';
      const isGoogle = user.externalAccounts?.some((acc: any) => acc.provider === 'google' || acc.provider === 'oauth_google');
      const isEmailVerified = Boolean(
        isGoogle ||
        user.primaryEmailAddress?.verification?.status === 'verified'
      );

      const data = await api.getUserProfile(user.id, {
        email,
        fullName: name,
        provider: isGoogle ? 'google' : 'email_password',
        isEmailVerified
      });

      if (data) {
        setProfile(data);
        setFullName(data.fullName || user.fullName || '');
        setPhone(data.phone || user.primaryPhoneNumber?.phoneNumber || '');
        setGender(data.gender || '');
        setDateOfBirth(data.dateOfBirth || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/sign-in');
      return;
    }
    if (isLoaded && isSignedIn && user) {
      const verifyRole = async () => {
        try {
          const roleData = await api.checkUserRole(user.id, user.primaryEmailAddress?.emailAddress);
          if (roleData?.isMerchant === true || roleData?.role === 'merchant') {
            navigate('/merchant/dashboard?tab=settings', { replace: true });
            return;
          }
        } catch (e) {
          console.warn('Profile role check warning:', e);
        }
        fetchProfile();
      };
      verifyRole();
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSavingProfile(true);
      const cleanOld = (profile?.phone || '').toString().replace(/\D/g, '').slice(-10);
      const cleanNew = phone.toString().replace(/\D/g, '').slice(-10);
      const phoneChanged = cleanOld && cleanNew && cleanOld !== cleanNew;

      const updateData = {
        fullName,
        phone: cleanNew,
        gender,
        dateOfBirth
      };

      const res = await api.updateUserProfile(user.id, updateData);
      if (res.profile) {
        setProfile(res.profile);
        if (phoneChanged) {
          showToast('Mobile number updated. Please verify your new mobile number.', 'info');
        } else {
          showToast('Profile information updated successfully!', 'success');
        }
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      const msg = err.response?.data?.message || 'Failed to update profile.';
      showToast(msg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // 1. Mobile Phone Verification Notice Handler
  const handleOpenPhoneVerify = () => {
    setShowPhoneVerifyModal(true);
  };

  // 2. Real Email Verification Handlers
  const handleSendEmailOtp = async () => {
    if (!user) return;
    const targetEmail = user.primaryEmailAddress?.emailAddress || profile?.email || email || '';
    try {
      setEmailSending(true);
      
      // 1. Send real verification email via Clerk's email service directly to user's inbox
      if (user.primaryEmailAddress && user.primaryEmailAddress.verification?.status !== 'verified') {
        try {
          await user.primaryEmailAddress.prepareVerification({ strategy: 'email_code' });
        } catch (clerkErr: any) {
          console.warn('Clerk email delivery status:', clerkErr);
        }
      }

      // 2. Also register verification request with backend
      await api.sendEmailOtp(user.id, targetEmail);

      showToast(`Verification code sent to ${targetEmail}. Please check your email inbox.`, 'success');
      setEmailOtpCountdown(60);
    } catch (err: any) {
      console.error('Error sending email OTP:', err);
      showToast(err.response?.data?.message || 'Failed to send email verification code.', 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const handleOpenEmailVerify = () => {
    setEmailVerifyOtp('');
    setShowEmailVerifyModal(true);
    handleSendEmailOtp();
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailVerifyOtp || emailVerifyOtp.length < 6) {
      showToast('Please enter the complete 6-digit verification code from your email.', 'error');
      return;
    }
    if (!user) return;

    try {
      setEmailVerifying(true);
      
      // 1. Verify with Clerk's email verification engine
      let clerkVerified = false;
      if (user.primaryEmailAddress && user.primaryEmailAddress.verification?.status !== 'verified') {
        try {
          const res = await user.primaryEmailAddress.attemptVerification({ code: emailVerifyOtp });
          if (res.verification?.status === 'verified') {
            clerkVerified = true;
          }
        } catch (clerkErr: any) {
          console.warn('Clerk email verification:', clerkErr);
        }
      }

      // 2. Verify with backend and update MongoDB
      const res = await api.verifyEmailOtp(user.id, emailVerifyOtp);
      if (res.success || clerkVerified) {
        showToast('Email verified successfully! You are now a verified customer.', 'success');
        try {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        } catch {}
        setShowEmailVerifyModal(false);
        await fetchProfile();
      }
    } catch (err: any) {
      console.error('Error verifying email OTP:', err);
      showToast(err.response?.data?.message || 'Invalid or expired verification code. Please check your email.', 'error');
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleAddressesUpdated = (addresses: UserAddress[]) => {
    if (profile) {
      setProfile({
        ...profile,
        addresses
      });
    }
  };

  // Handle Complete Customer Account Deactivation
  const handleConfirmDeactivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || deactivateConfirmText.trim().toUpperCase() !== 'DELETE') {
      showToast('Please type DELETE to confirm deactivation.', 'error');
      return;
    }

    try {
      setIsDeactivating(true);
      await api.deactivateCustomerAccount(user.id);
      showToast('Your account and data have been permanently deactivated.', 'success');
      setShowDeactivateModal(false);
      await signOut();
      navigate('/');
    } catch (err: any) {
      console.error('Deactivation error:', err);
      showToast('Failed to deactivate account. Please try again.', 'error');
    } finally {
      setIsDeactivating(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin" />
        <p className="text-slate-500 font-bold text-xs">Loading your profile details...</p>
      </div>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress || profile?.email || '';
  const isGoogle = user?.externalAccounts?.some((acc: any) => acc.provider === 'google' || acc.provider === 'oauth_google');
  
  // Verification Checks: Email verification grants Verified Customer status
  const isEmailVerified = Boolean(
    isGoogle ||
    profile?.authProvider === 'google' ||
    profile?.isEmailVerified ||
    user?.primaryEmailAddress?.verification?.status === 'verified'
  );
  const isPhoneVerified = Boolean(profile?.isPhoneVerified && (profile?.phone || phone));
  const isVerifiedCustomer = Boolean(isEmailVerified);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
      {/* Header Profile Summary Capsule */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-900/5 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <img
            src={user?.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
            alt="Profile Avatar"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-md bg-slate-100"
          />
          <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white ${
            isVerifiedCustomer ? 'bg-emerald-500' : 'bg-amber-500'
          }`} title={isVerifiedCustomer ? 'Verified Customer' : 'Verification Pending'}>
            {isVerifiedCustomer ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 font-heading">
              {profile?.fullName || user?.fullName || 'NexVolt Member'}
            </h1>

            {isVerifiedCustomer ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 w-fit mx-auto sm:mx-0 shadow-2xs font-poppins">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Customer</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80 w-fit mx-auto sm:mx-0 shadow-2xs font-poppins">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Verification Pending</span>
              </span>
            )}
          </div>

          <p className="text-slate-500 text-xs font-medium">{email}</p>
          {(phone || profile?.phone) && (
            <p className="text-slate-400 text-xs font-medium font-mono">+91 {phone || profile?.phone}</p>
          )}
        </div>

        <Link
          to="/orders"
          className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-bold transition shadow-2xs whitespace-nowrap"
        >
          View My Orders
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => {
            setActiveTab('profile');
            setSearchParams({});
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Profile & Verification</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('addresses');
            setSearchParams({ tab: 'addresses' });
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'addresses'
              ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Delivery Addresses ({profile?.addresses?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('security');
            setSearchParams({ tab: 'security' });
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Password & Security</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('danger');
            setSearchParams({ tab: 'danger' });
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'danger'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50/80'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* Tab 1: Personal Profile Form with Instant Verification */}
      {activeTab === 'profile' && (
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-900/5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-poppins">Customer Profile & Contact Verification</h3>
              <p className="text-slate-500 text-xs mt-0.5 font-poppins">Manage your contact credentials and verify your account to unlock orders.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 font-poppins ${
                isVerifiedCustomer ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {isVerifiedCustomer ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                <span>{isVerifiedCustomer ? 'Verified Customer' : 'Verification Pending'}</span>
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-poppins">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full bg-white/60 border border-slate-200/90 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-[#0066FF] font-medium"
                  />
                </div>
              </div>

              {/* Email Address + Verification Badge & Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 font-poppins">Email Address</label>
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-poppins">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenEmailVerify}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer font-poppins"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Verify Email</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-slate-100/70 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isGoogle ? 'Automatically verified via Google OAuth' : 'Linked to your NexVolt login account'}
                </p>
              </div>

              {/* Mobile Phone + Verification Action Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 font-poppins">Mobile Phone Number</label>
                  {isPhoneVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-poppins">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenPhoneVerify}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer font-poppins"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Verify Mobile</span>
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-xs font-bold text-slate-600 border-r border-slate-300 pr-1.5">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full bg-white/60 border border-slate-200/90 rounded-xl py-2.5 pl-16 pr-3 text-xs text-slate-900 font-mono font-medium outline-none focus:border-[#0066FF]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">10-digit Indian phone number used for delivery SMS and order dispatch alerts</p>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-poppins">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-white/60 border border-slate-200/90 rounded-xl py-2.5 px-3 text-xs text-slate-900 outline-none focus:border-[#0066FF] font-medium cursor-pointer"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-poppins">Date of Birth</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/60 border border-slate-200/90 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-[#0066FF] font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end border-t border-slate-100">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer font-poppins"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save Profile Changes</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Saved Delivery Addresses */}
      {activeTab === 'addresses' && user && (
        <AddressManager
          userId={user.id}
          addresses={profile?.addresses || []}
          onAddressesUpdated={handleAddressesUpdated}
        />
      )}

      {/* Tab 3: Security and Password Manager */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <PasswordManager userDoc={profile} onRefresh={fetchProfile} />
        </div>
      )}

      {/* Tab 4: Customer Account Danger Zone */}
      {activeTab === 'danger' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-rose-950 font-poppins">Customer Account Danger Zone</h2>
              <p className="text-xs text-rose-600 font-medium font-poppins">Irreversible actions and personal data deletion</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-950 font-poppins">Permanently Deactivate Customer Account</h3>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed font-poppins">
                Deactivating your account will wipe your saved shipping addresses, order history links, wishlist items, and session tokens.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeactivateConfirmText('');
                setShowDeactivateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 shadow-md shadow-rose-600/20 transition-all cursor-pointer font-poppins"
            >
              Deactivate Account
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Phone SMS Feature Coming Soon Notice Modal */}
      {showPhoneVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 font-poppins">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl lg:rounded-[36px] max-w-md w-full p-6 sm:p-8 border border-white/80 shadow-2xl shadow-blue-500/10 space-y-5 animate-in zoom-in-95 duration-200 relative text-center">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200/80 shadow-2xs">
                <Smartphone className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowPhoneVerifyModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2 space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-[#0066FF] flex items-center justify-center mx-auto shadow-md shadow-blue-500/10">
                <Smartphone className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 font-heading">
                SMS Verification Coming Soon
              </h3>
              
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-sm mx-auto">
                We are currently integrating telecom carrier SMS gateways for direct mobile verification across India (+91). This feature will be live in our upcoming release.
              </p>

              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs font-medium">
                Your customer account is fully verified through your <strong>verified Email address</strong>. You can place orders without restrictions!
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPhoneVerifyModal(false)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-[0.99]"
            >
              Got It, Continue
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Email Verification Modal (for email/password users) */}
      {showEmailVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 font-poppins">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200">
                <Mail className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowEmailVerifyModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 font-heading">Verify Email Address</h3>
              <p className="text-xs text-slate-600 font-medium">
                A 6-digit verification code has been dispatched to <strong className="text-slate-900">{email}</strong>. Please check your inbox or spam folder.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={emailSending || emailOtpCountdown > 0}
                  onClick={handleSendEmailOtp}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {emailSending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Code...</span>
                    </span>
                  ) : emailOtpCountdown > 0 ? (
                    <span>Resend in {emailOtpCountdown}s</span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Send className="w-3 h-3" />
                      <span>Resend Code</span>
                    </span>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={emailVerifyOtp}
                  onChange={(e) => setEmailVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0066FF] text-center text-lg font-mono font-bold tracking-widest outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowEmailVerifyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={emailVerifying || emailVerifyOtp.length !== 6}
                onClick={handleVerifyEmailOtp}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {emailVerifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify & Confirm Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone Deactivation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 font-poppins">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-rose-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 font-heading">Deactivate Customer Account?</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                This action is permanent. All your order linkages, saved addresses, and profile data will be permanently wiped. To proceed, type <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">DELETE</span> below.
              </p>
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                value={deactivateConfirmText}
                onChange={(e) => setDeactivateConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 text-xs sm:text-sm font-mono font-bold outline-none uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deactivateConfirmText.trim().toUpperCase() !== 'DELETE' || isDeactivating}
                onClick={handleConfirmDeactivation}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deactivating...</span>
                  </>
                ) : (
                  <span>Confirm Deactivation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;
