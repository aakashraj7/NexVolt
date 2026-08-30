import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Store,
  KeyRound,
  ShieldAlert,
  Save,
  Loader2,
  Building2,
  Phone,
  Mail,
  Globe,
  Plus,
  Trash2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  ArrowLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { PasswordManager } from '../components/profile/PasswordManager';

const AVAILABLE_CATEGORIES = [
  'Smartphones',
  'Laptops & Computers',
  'Audio & Headphones',
  'Smartwatches & Wearables',
  'Gaming & VR',
  'Cameras & Drones',
  'Smart Home & IoT',
  'Accessories & Power'
];

const BUSINESS_TYPES = [
  'Direct Brand / OEM',
  'Authorized Brand Distributor',
  'Specialist Electronics Retailer',
  'Custom System Builder'
];

interface Warehouse {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export const MerchantProfilePage: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'store' | 'security' | 'danger'>(
    tabParam === 'security' || tabParam === 'danger' ? tabParam : 'store'
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userDoc, setUserDoc] = useState<any>(null);

  // Store profile fields
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [primaryCategory, setPrimaryCategory] = useState(AVAILABLE_CATEGORIES[0]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([AVAILABLE_CATEGORIES[0]]);
  const [gstin, setGstin] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Danger Zone states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Sync activeTab with URL
  useEffect(() => {
    if (tabParam === 'security' || tabParam === 'danger' || tabParam === 'store') {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const fetchMerchantProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const email = user.primaryEmailAddress?.emailAddress || '';
      const fullName = user.fullName || '';
      const isGoogle = user.externalAccounts && user.externalAccounts.some((acc: any) =>
        acc.provider === 'google' || acc.provider === 'oauth_google' || acc.verification?.strategy === 'oauth_google'
      );
      const authProvider = isGoogle ? 'google' : 'email_password';

      const data = await api.getMerchantProfile(user.id, { email, fullName, provider: authProvider, authProvider });

      if (data?.user) {
        setUserDoc(data.user);
      }

      if (data?.merchantProfile) {
        const mp = data.merchantProfile;
        setStoreName(mp.storeName || '');
        setOwnerName(data.user?.fullName || user.fullName || '');
        setBusinessType(mp.businessType || BUSINESS_TYPES[0]);
        setPrimaryCategory(mp.category || AVAILABLE_CATEGORIES[0]);

        if (mp.categories && Array.isArray(mp.categories) && mp.categories.length > 0) {
          setSelectedCategories(mp.categories);
        } else if (mp.category) {
          setSelectedCategories([mp.category]);
        }

        setGstin(mp.gstin || '');
        setBusinessPhone(mp.businessPhone || '');
        setSupportEmail(mp.supportEmail || email);
        setWebsite(mp.website || '');
        if (mp.warehouses && mp.warehouses.length > 0) {
          setWarehouses(
            mp.warehouses.map((w: any, idx: number) => ({
              id: w._id || `wh-${idx}`,
              label: w.label || 'Primary Dispatch Hub',
              recipientName: w.recipientName || ownerName || storeName,
              phone: w.phone || businessPhone,
              street: w.street || '',
              city: w.city || '',
              state: w.state || '',
              postalCode: w.postalCode || '',
              country: w.country || 'India',
              isDefault: !!w.isDefault
            }))
          );
        }
      }
    } catch (err) {
      console.error('Error fetching merchant profile:', err);
      showToast('Error loading store profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/merchant/sign-in');
      return;
    }
    if (isLoaded && isSignedIn && user) {
      const verifyRole = async () => {
        try {
          const roleData = await api.checkUserRole(user.id, user.primaryEmailAddress?.emailAddress);
          if (!roleData || (!roleData.isMerchant && roleData.role !== 'merchant')) {
            showToast('This action is not possible. Customer accounts cannot access the Merchant Portal.', 'error');
            navigate('/', { replace: true });
            return;
          }
        } catch (e) {
          console.warn('Merchant profile role check warning:', e);
        }
        fetchMerchantProfile();
      };
      verifyRole();
    }
  }, [isLoaded, isSignedIn, user]);

  const handleCategoryToggle = (cat: string) => {
    if (cat === primaryCategory) {
      // Primary category cannot be deselected
      return;
    }
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handlePrimaryCategoryChange = (cat: string) => {
    setPrimaryCategory(cat);
    if (!selectedCategories.includes(cat)) {
      setSelectedCategories(prev => [...prev, cat]);
    }
  };

  const handleAddWarehouse = () => {
    const newWh: Warehouse = {
      id: `wh-${Date.now()}`,
      label: `Warehouse ${warehouses.length + 1}`,
      recipientName: ownerName || storeName || 'Dispatch Manager',
      phone: businessPhone || '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: warehouses.length === 0
    };
    setWarehouses(prev => [...prev, newWh]);
  };

  const handleRemoveWarehouse = (id: string) => {
    setWarehouses(prev => prev.filter(w => w.id !== id));
  };

  const handleWarehouseChange = (id: string, field: keyof Warehouse, value: any) => {
    setWarehouses(prev =>
      prev.map(w => (w.id === id ? { ...w, [field]: value } : w))
    );
  };

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!storeName.trim()) {
      showToast('Please enter your Store / Brand name.', 'error');
      return;
    }

    setSaving(true);
    try {
      const isGoogle = user.externalAccounts && user.externalAccounts.some((acc: any) =>
        acc.provider === 'google' || acc.provider === 'oauth_google' || acc.verification?.strategy === 'oauth_google'
      );
      const authProvider = isGoogle ? 'google' : 'email_password';

      const payload = {
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
        businessType,
        category: primaryCategory,
        categories: selectedCategories.length > 0 ? selectedCategories : [primaryCategory],
        gstin: gstin.trim().toUpperCase(),
        businessPhone: businessPhone.trim(),
        supportEmail: supportEmail.trim().toLowerCase(),
        email: user.primaryEmailAddress?.emailAddress || supportEmail.trim().toLowerCase(),
        website: website.trim(),
        authProvider,
        warehouses: warehouses.map(w => ({
          label: w.label,
          recipientName: w.recipientName,
          phone: w.phone,
          street: w.street,
          city: w.city,
          state: w.state,
          postalCode: w.postalCode,
          country: w.country,
          isDefault: w.isDefault
        }))
      };

      await api.updateMerchantProfile(user.id, payload);
      showToast('Store profile & business details updated successfully!', 'success');
      await fetchMerchantProfile();
    } catch (err: any) {
      console.error('Error saving merchant profile:', err);
      showToast(err.message || 'Failed to update store profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateMerchant = async () => {
    if (deactivateConfirmText.trim().toUpperCase() !== 'DELETE' || !user) return;

    setIsDeactivating(true);
    try {
      await api.deactivateMerchantAccount(user.id);
      showToast('Your Merchant account has been deactivated.', 'info');
      await signOut({ redirectUrl: '/merchant/sign-in' });
    } catch (err: any) {
      console.error('Deactivate merchant error:', err);
      showToast(err.message || 'Failed to deactivate merchant account.', 'error');
      setIsDeactivating(false);
    }
  };

  const isGstinValid = gstin.trim().length === 15;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
            <Link to="/merchant/dashboard" className="hover:text-[#0066FF] transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Merchant Dashboard</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-bold">Store Profile & Settings</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5 font-poppins">
            <Store className="w-7 h-7 text-[#0066FF]" />
            <span>Store Profile & Brand Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage your electronics brand identity, GSTIN details, product catalog categories, and security.
          </p>
        </div>

        <Link
          to="/merchant/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#0066FF] hover:border-[#0066FF] text-xs font-bold shadow-xs transition font-poppins"
        >
          <span>Return to Dashboard</span>
        </Link>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-px overflow-x-auto no-scrollbar font-poppins">
        <button
          onClick={() => {
            setActiveTab('store');
            setSearchParams({ tab: 'store' });
          }}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'store'
              ? 'border-[#0066FF] text-[#0066FF] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Store & Brand Details</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('security');
            setSearchParams({ tab: 'security' });
          }}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'border-[#0066FF] text-[#0066FF] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Password & Security</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('danger');
            setSearchParams({ tab: 'danger' });
          }}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'danger'
              ? 'border-rose-600 text-rose-600 bg-rose-50/50 rounded-t-xl'
              : 'border-transparent text-rose-600/80 hover:text-rose-700 hover:bg-rose-50/40 rounded-t-xl'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Danger Zone</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white/70 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-xs">
          <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin" />
          <p className="text-xs font-bold text-slate-600">Loading store profile & verification status...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: Store & Brand Profile Details */}
          {activeTab === 'store' && (
            <form onSubmit={handleSaveStoreProfile} className="space-y-6">
              {/* Brand Identity & Basic Info Card */}
              <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200/80">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">Brand Identity & Seller Information</h2>
                      <p className="text-xs text-slate-500 font-medium">Your public business credentials displayed on product listings</p>
                    </div>
                  </div>

                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-extrabold font-poppins">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Verified Merchant</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Brand / Store Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                      Store / Brand Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      required
                      placeholder="e.g. Apex Tech Official Store"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/50 focus:bg-white transition"
                    />
                  </div>

                  {/* Owner / Authorized Contact */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                      Authorized Contact / Owner Name
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/50 focus:bg-white transition"
                    />
                  </div>

                  {/* Business Type */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                      Business Entity Type
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/50 focus:bg-white transition cursor-pointer"
                    >
                      {BUSINESS_TYPES.map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>

                  {/* GSTIN Number (Editable & Addable) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                        GSTIN Number
                      </label>
                      {isGstinValid ? (
                        <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1 font-poppins">
                          <CheckCircle2 className="w-3 h-3" /> Valid 15-Digit Format
                        </span>
                      ) : gstin.trim() ? (
                        <span className="text-[10px] font-bold text-amber-600 font-poppins">
                          Should be 15 alphanumeric characters
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 font-poppins">
                          Optional for non-GST sellers
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        maxLength={15}
                        placeholder="e.g. 29AAAAA0000A1Z5"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition uppercase"
                      />
                      {isGstinValid && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>

                  {/* Business Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                      Business Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile or support contact"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/50 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Support Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                      Customer Support Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="support@yourbrand.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/50 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Brand Website */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                      Official Website or Portfolio
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://www.yourbrand.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/50 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories & Product Lines Card */}
              <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/80">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">Product Categories & Niches</h2>
                    <p className="text-xs text-slate-500 font-medium">Define your primary specialty and select all relevant categories you sell</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Primary Category Select */}
                  <div className="space-y-1.5 max-w-md">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                      Primary Category Specialty <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={primaryCategory}
                      onChange={(e) => handlePrimaryCategoryChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition cursor-pointer"
                    >
                      {AVAILABLE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Multiple Categories Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                      Additional Active Categories (Multi-Select)
                    </label>
                    <p className="text-xs text-slate-500 font-medium">
                      Select all secondary electronics categories your brand currently distributes or sells:
                    </p>

                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {AVAILABLE_CATEGORIES.map(cat => {
                        const isPrimary = cat === primaryCategory;
                        const isSelected = selectedCategories.includes(cat);

                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoryToggle(cat)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer select-none font-poppins ${
                              isPrimary
                                ? 'bg-[#0066FF] text-white ring-2 ring-[#0066FF]/30 shadow-blue-500/20'
                                : isSelected
                                ? 'bg-indigo-50 border border-indigo-300 text-indigo-700'
                                : 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span>{cat}</span>
                            {isPrimary ? (
                              <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded font-black uppercase">Primary</span>
                            ) : isSelected ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Warehouse & Dispatch Hubs Card */}
              <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/80">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">Dispatch Warehouses & Pickup Hubs</h2>
                      <p className="text-xs text-slate-500 font-medium">Logistics origins for carrier dispatch and order fulfillment</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddWarehouse}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Hub</span>
                  </button>
                </div>

                {warehouses.length === 0 ? (
                  <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-2xl">
                    <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No warehouse locations configured yet</p>
                    <p className="text-xs text-slate-400 mt-1">Add a primary warehouse location for shipping orders.</p>
                    <button
                      type="button"
                      onClick={handleAddWarehouse}
                      className="mt-3 px-4 py-1.5 rounded-xl bg-[#0066FF] text-white text-xs font-bold"
                    >
                      Add Primary Hub
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {warehouses.map((wh) => (
                      <div key={wh.id} className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={wh.label}
                              onChange={(e) => handleWarehouseChange(wh.id, 'label', e.target.value)}
                              placeholder="Hub Label (e.g. Mumbai Central Hub)"
                              className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 focus:border-[#0066FF] outline-none"
                            />
                            {wh.isDefault && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                                Primary Hub
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveWarehouse(wh.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                            title="Remove Warehouse"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              value={wh.street}
                              onChange={(e) => handleWarehouseChange(wh.id, 'street', e.target.value)}
                              placeholder="Street Address, Plot No, Industrial Area"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-[#0066FF]"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={wh.city}
                              onChange={(e) => handleWarehouseChange(wh.id, 'city', e.target.value)}
                              placeholder="City"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-[#0066FF]"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={wh.state}
                              onChange={(e) => handleWarehouseChange(wh.id, 'state', e.target.value)}
                              placeholder="State"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-[#0066FF]"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={wh.postalCode}
                              onChange={(e) => handleWarehouseChange(wh.id, 'postalCode', e.target.value)}
                              placeholder="Postal Code"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-[#0066FF]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Save Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0066FF] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-75 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Store Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Password & Security (Set / Reset) */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <PasswordManager
                userId={user?.id || ''}
                email={user?.primaryEmailAddress?.emailAddress || ''}
                hasPassword={!!userDoc?.hasPassword}
                onPasswordUpdated={fetchMerchantProfile}
              />
            </div>
          )}

          {/* TAB 3: Danger Zone */}
          {activeTab === 'danger' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-rose-950">Merchant Account Danger Zone</h2>
                  <p className="text-xs text-rose-600 font-medium">Irreversible actions and store suspension options</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-rose-950">Deactivate Merchant Store & Purge Products</h3>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                    Deactivating your merchant account is permanent and irreversible:
                  </p>
                  <ul className="text-xs text-rose-900 space-y-1 list-disc list-inside font-medium">
                    <li><strong>All products in your store catalog will be permanently deleted</strong> and removed from the customer marketplace.</li>
                    <li>Storefront profile, dispatch warehouse configurations, and order management will be terminated.</li>
                    <li>Merchant portal access and AI Revenue Recovery agent will be revoked.</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDeactivateConfirmText('');
                    setShowDeactivateModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  Deactivate Store
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Danger Zone Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
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

            <div className="space-y-2.5">
              <h3 className="text-lg font-black text-slate-900">Deactivate Merchant Store?</h3>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium space-y-1">
                <p className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Important Notice: All Products Will Be Deleted</span>
                </p>
                <p className="leading-relaxed">
                  Every product listed by your merchant account will be <strong>permanently removed and deleted</strong> from the NexVolt storefront immediately. This action cannot be reversed.
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                To confirm permanent deactivation and product removal, type <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">DELETE</span> below.
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deactivateConfirmText.trim().toUpperCase() !== 'DELETE' || isDeactivating}
                onClick={handleDeactivateMerchant}
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
export default MerchantProfilePage;
