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
  Trash2,
  X,
  ShieldAlert
} from 'lucide-react';
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

  // Sync activeTab with URL tab param and ensure top visibility
  useEffect(() => {
    if (tabParam === 'addresses' || tabParam === 'security' || tabParam === 'profile' || tabParam === 'danger') {
      setActiveTab(tabParam as any);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tabParam]);

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
      const isGoogle = user.externalAccounts?.some(acc => acc.provider === 'google');

      const data = await api.getUserProfile(user.id, {
        email,
        fullName: name,
        provider: isGoogle ? 'google' : 'email_password'
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
      const updateData = {
        fullName,
        phone,
        gender,
        dateOfBirth
      };

      const res = await api.updateUserProfile(user.id, updateData);
      if (res.profile) {
        setProfile(res.profile);
        showToast('Profile information updated successfully!', 'success');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      const msg = err.response?.data?.message || 'Failed to update profile.';
      showToast(msg, 'error');
    } finally {
      setSavingProfile(false);
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
  const hasPassword = profile?.hasPassword || false;

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
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Active Account">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 font-heading">
              {profile?.fullName || user?.fullName || 'NexVolt Member'}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#0066FF] border border-blue-200/80 w-fit mx-auto sm:mx-0">
              Verified Customer
            </span>
          </div>
          <p className="text-slate-500 text-xs font-medium">{email}</p>
          {phone && <p className="text-slate-400 text-xs font-medium">{phone}</p>}
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
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Profile</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('addresses');
            setSearchParams({ tab: 'addresses' });
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
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
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
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
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'danger'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50/80'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* Tab 1: Personal Profile Form */}
      {activeTab === 'profile' && (
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-900/5 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Personal Details</h3>
            <p className="text-slate-500 text-xs mt-0.5">Manage your contact information and identity credentials.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-slate-100/70 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white/60 border border-slate-200/90 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-[#0066FF] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-white/60 border border-slate-200/90 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-[#0066FF] font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
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

      {/* Tab 3: Password Management */}
      {activeTab === 'security' && user && (
        <PasswordManager
          userId={user.id}
          email={email}
          hasPassword={hasPassword}
          onPasswordUpdated={fetchProfile}
        />
      )}

      {/* Tab 4: Danger Zone */}
      {activeTab === 'danger' && user && (
        <div className="bg-rose-50/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xl shadow-rose-500/5 space-y-6 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-rose-900">Danger Zone</h3>
              <p className="text-rose-700 text-xs mt-1 leading-relaxed">
                Permanently deactivate your customer account and erase your profile data from NexVolt.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-rose-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Deactivate Customer Account</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  This will permanently delete your personal profile, delivery addresses, shopping bag, and session data.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeactivateConfirmText('');
                  setShowDeactivateModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Deactivate Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-toast-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Confirm Account Deactivation</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              This action is <strong className="text-rose-600">permanent and irreversible</strong>. All your saved delivery addresses, wishlist items, and personal preferences will be permanently wiped.
            </p>

            <form onSubmit={handleConfirmDeactivation} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Type <span className="font-mono text-rose-600 font-extrabold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deactivateConfirmText}
                  onChange={(e) => setDeactivateConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono tracking-wider outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeactivateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeactivating || deactivateConfirmText.trim().toUpperCase() !== 'DELETE'}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeactivating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deactivating...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Deactivate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
