import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  MapPin,
  KeyRound,
  Calendar,
  Phone,
  Mail,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';
import type { UserProfile, UserAddress } from '../types';
import { useToast } from '../context/ToastContext';
import { AddressManager } from '../components/profile/AddressManager';
import { PasswordManager } from '../components/profile/PasswordManager';

export const ProfilePage: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (isLoaded && isSignedIn) {
      fetchProfile();
    }
  }, [isLoaded, isSignedIn]);

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
      }
      showToast('Personal profile saved successfully!', 'success');
    } catch {
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddressesUpdated = (updatedAddresses: UserAddress[]) => {
    setProfile(prev => prev ? { ...prev, addresses: updatedAddresses } : null);
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading your profile & addresses...</p>
      </div>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress || '';
  const isGoogle = user?.externalAccounts?.some(acc => acc.provider === 'google');
  const hasPassword = profile?.hasPassword ?? (!isGoogle);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="Avatar"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#0066FF] shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#0052CC] text-white text-2xl font-bold flex items-center justify-center shadow-sm">
              {(fullName || email).charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              {fullName || 'NexVolt Member'}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{email}</span>
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-200">
                Verified Shopper
              </span>
              {profile?.addresses?.length ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  {profile.addresses.length} Saved {profile.addresses.length === 1 ? 'Address' : 'Addresses'}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-xs"
          >
            My Orders
          </Link>
          <Link
            to="/products"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold transition shadow-md"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-8 text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'profile'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Info & DOB</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'addresses'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Delivery Addresses ({profile?.addresses?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'security'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{hasPassword ? 'Reset Password' : 'Create Password'}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Personal Details & Demographics */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-900 font-heading">Personal Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your personal demographics and contact information.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Marcus Vance"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl py-2.5 pl-9 pr-3 text-xs cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
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
    </div>
  );
};
