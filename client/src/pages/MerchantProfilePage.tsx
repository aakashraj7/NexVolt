import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  User,
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
  ShieldCheck,
  Calendar,
  Home
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

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi NCR', 'Chandigarh', 'Puducherry'
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
  const [activeTab, setActiveTab] = useState<'personal' | 'store' | 'security' | 'danger'>(
    tabParam === 'store' || tabParam === 'security' || tabParam === 'danger' ? tabParam : 'personal'
  );

  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [userDoc, setUserDoc] = useState<any>(null);

  // 1. Personal Details State
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerGender, setOwnerGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say' | ''>('');
  const [ownerDateOfBirth, setOwnerDateOfBirth] = useState('');
  const [ownerPersonalPhone, setOwnerPersonalPhone] = useState('');
  
  // Personal Residential Address State
  const [residentialStreet, setResidentialStreet] = useState('');
  const [residentialLandmark, setResidentialLandmark] = useState('');
  const [residentialCity, setResidentialCity] = useState('');
  const [residentialState, setResidentialState] = useState(INDIAN_STATES[0]);
  const [residentialPostalCode, setResidentialPostalCode] = useState('');

  // 2. Store profile fields
  const [storeName, setStoreName] = useState('');
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
    if (tabParam === 'personal' || tabParam === 'security' || tabParam === 'danger' || tabParam === 'store') {
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
        const u = data.user;
        setUserDoc(u);
        setOwnerFullName(u.fullName || user.fullName || '');
        setOwnerGender(u.gender || '');
        setOwnerDateOfBirth(u.dateOfBirth || '');
        setOwnerPersonalPhone(u.phone || '');

        if (u.addresses && u.addresses.length > 0) {
          const primaryAddr = u.addresses[0];
          setResidentialStreet(primaryAddr.street || '');
          setResidentialLandmark(primaryAddr.landmark || '');
          setResidentialCity(primaryAddr.city || '');
          setResidentialState(primaryAddr.state || INDIAN_STATES[0]);
          setResidentialPostalCode(primaryAddr.postalCode || '');
        }
      }

      if (data?.merchantProfile) {
        const mp = data.merchantProfile;
        setStoreName(mp.storeName || '');
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
              recipientName: w.recipientName || ownerFullName || storeName,
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
      recipientName: ownerFullName || storeName || 'Dispatch Manager',
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

  // Save 1: Personal Details
  const handleSavePersonalDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!ownerFullName.trim()) {
      showToast('Please enter your full legal name.', 'error');
      return;
    }

    setSavingPersonal(true);
    try {
      const isGoogle = user.externalAccounts && user.externalAccounts.some((acc: any) =>
        acc.provider === 'google' || acc.provider === 'oauth_google' || acc.verification?.strategy === 'oauth_google'
      );
      const authProvider = isGoogle ? 'google' : 'email_password';

      const payload = {
        fullName: ownerFullName.trim(),
        ownerName: ownerFullName.trim(),
        gender: ownerGender,
        dateOfBirth: ownerDateOfBirth,
        phone: ownerPersonalPhone.trim(),
        personalPhone: ownerPersonalPhone.trim(),
        personalAddress: {
          label: 'Home / Residential',
          recipientName: ownerFullName.trim(),
          phone: ownerPersonalPhone.trim(),
          street: residentialStreet.trim(),
          landmark: residentialLandmark.trim(),
          city: residentialCity.trim(),
          state: residentialState,
          postalCode: residentialPostalCode.trim(),
          country: 'India',
          isDefault: true
        },
        authProvider,
        email: user.primaryEmailAddress?.emailAddress
      };

      await api.updateMerchantProfile(user.id, payload);
      showToast('Merchant personal details updated successfully!', 'success');
      await fetchMerchantProfile();
    } catch (err: any) {
      console.error('Error saving personal details:', err);
      showToast(err.message || 'Failed to update personal details.', 'error');
    } finally {
      setSavingPersonal(false);
    }
  };

  // Save 2: Store & Brand Profile
  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!storeName.trim()) {
      showToast('Please enter your Store / Brand name.', 'error');
      return;
    }

    setSavingStore(true);
    try {
      const isGoogle = user.externalAccounts && user.externalAccounts.some((acc: any) =>
        acc.provider === 'google' || acc.provider === 'oauth_google' || acc.verification?.strategy === 'oauth_google'
      );
      const authProvider = isGoogle ? 'google' : 'email_password';

      const payload = {
        storeName: storeName.trim(),
        ownerName: ownerFullName.trim() || user.fullName || '',
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
      setSavingStore(false);
    }
  };

  const handleDeactivateMerchant = async () => {
    if (deactivateConfirmText.trim().toUpperCase() !== 'DELETE' || !user) return;

    setIsDeactivating(true);
    try {
      await api.deactivateMerchantAccount(user.id);
      showToast('Your Merchant account and all listed products have been deleted.', 'info');
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
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5 font-poppins">
            <Link to="/merchant/dashboard" className="hover:text-[#0066FF] transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Merchant Dashboard</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-bold">Seller Profile & Account</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5 font-poppins">
            <Store className="w-7 h-7 text-[#0066FF]" />
            <span>Merchant Profile & Account Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 font-poppins">
            Manage your personal identity, residential address, brand catalog categories, GSTIN details, and security.
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
            setActiveTab('personal');
            setSearchParams({ tab: 'personal' });
          }}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'personal'
              ? 'border-[#0066FF] text-[#0066FF] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Details</span>
        </button>

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
          <p className="text-xs font-bold text-slate-600">Loading merchant details & verification status...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: Personal Details Section */}
          {activeTab === 'personal' && (
            <form onSubmit={handleSavePersonalDetails} className="space-y-6 animate-in fade-in duration-200">
              {/* Personal Identity Card */}
              <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200/80">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">Merchant Personal Identity</h2>
                      <p className="text-xs text-slate-500 font-medium font-poppins">Your personal details as the registered owner of this merchant account</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-poppins">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Seller</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Legal Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Full Legal Name *
                    </label>
                    <div className="relative group">
                      <User className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                      <input
                        type="text"
                        required
                        value={ownerFullName}
                        onChange={(e) => setOwnerFullName(e.target.value)}
                        placeholder="e.g. Rajesh Kumar"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Registered Business / Personal Email */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        disabled
                        value={user?.primaryEmailAddress?.emailAddress || ''}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-500 cursor-not-allowed outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">Linked to your NexVolt login credentials</p>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Date of Birth
                    </label>
                    <div className="relative group">
                      <Calendar className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                      <input
                        type="date"
                        value={ownerDateOfBirth}
                        onChange={(e) => setOwnerDateOfBirth(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Gender Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Gender
                    </label>
                    <select
                      value={ownerGender}
                      onChange={(e) => setOwnerGender(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-3 text-xs font-semibold text-slate-900 outline-none transition cursor-pointer"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>

                  {/* Personal Mobile Phone */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Personal Mobile Phone
                    </label>
                    <div className="relative group max-w-md">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 group-focus-within:text-[#0066FF]">
                        <Phone className="w-4 h-4" />
                        <span className="text-xs font-bold text-slate-600 border-r border-slate-300 pr-2">+91</span>
                      </div>
                      <input
                        type="tel"
                        value={ownerPersonalPhone}
                        onChange={(e) => setOwnerPersonalPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-20 pr-4 text-xs font-mono font-semibold text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Residential Address Card */}
              <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200/80">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">Personal Residential Address</h2>
                    <p className="text-xs text-slate-500 font-medium font-poppins">Residential / Registered address of the merchant</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Street Address */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Flat / House No. / Building / Street *
                    </label>
                    <input
                      type="text"
                      value={residentialStreet}
                      onChange={(e) => setResidentialStreet(e.target.value)}
                      placeholder="e.g. 42, Silicon Enclave, 3rd Cross"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-4 text-xs font-semibold text-slate-900 outline-none transition"
                    />
                  </div>

                  {/* Landmark */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={residentialLandmark}
                      onChange={(e) => setResidentialLandmark(e.target.value)}
                      placeholder="e.g. Near Metro Station"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-4 text-xs font-semibold text-slate-900 outline-none transition"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      City *
                    </label>
                    <input
                      type="text"
                      value={residentialCity}
                      onChange={(e) => setResidentialCity(e.target.value)}
                      placeholder="e.g. Chennai"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-4 text-xs font-semibold text-slate-900 outline-none transition"
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      State *
                    </label>
                    <select
                      value={residentialState}
                      onChange={(e) => setResidentialState(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-3 text-xs font-semibold text-slate-900 outline-none transition cursor-pointer"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PIN Code */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Postal PIN Code *
                    </label>
                    <input
                      type="text"
                      value={residentialPostalCode}
                      onChange={(e) => setResidentialPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 600001"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-4 text-xs font-mono font-semibold text-slate-900 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingPersonal}
                  className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer font-poppins"
                >
                  {savingPersonal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Personal Details...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Personal Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Store & Brand Profile Details */}
          {activeTab === 'store' && (
            <form onSubmit={handleSaveStoreProfile} className="space-y-6 animate-in fade-in duration-200">
              {/* Brand Identity & Basic Info Card */}
              <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200/80">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">Brand & Storefront Identity</h2>
                      <p className="text-xs text-slate-500 font-medium font-poppins">Public brand name and business classification visible to customers</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Store / Brand Display Name *
                    </label>
                    <div className="relative group">
                      <Store className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="e.g. Nova Audio Labs"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Business Classification
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-3 text-xs font-semibold text-slate-900 outline-none transition cursor-pointer"
                    >
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Goods & Services Tax Identification Number (GSTIN)
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
                      placeholder="e.g. 29ABCDE1234F1Z5 (15 Characters)"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-4 text-xs font-mono font-bold text-slate-900 outline-none transition"
                    />
                    {gstin && !isGstinValid && (
                      <p className="text-[11px] text-amber-600 font-medium">GSTIN must be exactly 15 alphanumeric characters.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Categories Covered */}
              <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200/80">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">Catalog Categories Covered</h2>
                    <p className="text-xs text-slate-500 font-medium font-poppins">Select all electronics categories your brand sells</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                      Primary Category *
                    </label>
                    <select
                      value={primaryCategory}
                      onChange={(e) => handlePrimaryCategoryChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-3 text-xs font-semibold text-slate-900 outline-none transition cursor-pointer"
                    >
                      {AVAILABLE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                      Additional Active Categories
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {AVAILABLE_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategories.includes(cat);
                        const isPrimary = cat === primaryCategory;

                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoryToggle(cat)}
                            className={`p-3 rounded-xl text-left border transition-all text-xs font-semibold flex items-center justify-between gap-1.5 cursor-pointer ${
                              isPrimary
                                ? 'bg-blue-50/90 border-[#0066FF] text-[#0066FF] shadow-xs'
                                : isSelected
                                ? 'bg-slate-100 border-slate-300 text-slate-900'
                                : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <span className="truncate">{cat}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#0066FF]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Public Contact & Support */}
              <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200/80">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">Business Contact & Inquiries</h2>
                    <p className="text-xs text-slate-500 font-medium font-poppins">Used for order communication and customer support</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Business Phone
                    </label>
                    <div className="relative group">
                      <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                      <input
                        type="tel"
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Support Email
                    </label>
                    <div className="relative group">
                      <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                      <input
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="support@yourbrand.com"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-poppins">
                      Website URL
                    </label>
                    <div className="relative group">
                      <Globe className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourbrand.com"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Warehouses & Pickup Hubs */}
              <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200/80">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">Dispatch Warehouses & Pickup Hubs</h2>
                      <p className="text-xs text-slate-500 font-medium font-poppins">Logistics origins for carrier dispatch and order fulfillment</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddWarehouse}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] font-bold text-xs transition border border-blue-200 cursor-pointer font-poppins"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Dispatch Hub</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {warehouses.length > 0 ? (
                    warehouses.map((wh, idx) => (
                      <div key={wh.id} className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#0066FF] text-white font-bold text-xs flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={wh.label}
                              onChange={(e) => handleWarehouseChange(wh.id, 'label', e.target.value)}
                              placeholder="Hub Label (e.g. Bengaluru Main Hub)"
                              className="font-bold text-xs text-slate-900 bg-transparent border-b border-transparent focus:border-[#0066FF] outline-none"
                            />
                            {wh.isDefault && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Primary Origin
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveWarehouse(wh.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Remove Warehouse"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={wh.recipientName}
                            onChange={(e) => handleWarehouseChange(wh.id, 'recipientName', e.target.value)}
                            placeholder="Manager Name"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0066FF]"
                          />
                          <input
                            type="tel"
                            value={wh.phone}
                            onChange={(e) => handleWarehouseChange(wh.id, 'phone', e.target.value)}
                            placeholder="Dispatch Phone"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0066FF]"
                          />
                          <input
                            type="text"
                            value={wh.street}
                            onChange={(e) => handleWarehouseChange(wh.id, 'street', e.target.value)}
                            placeholder="Street / Industrial Estate"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0066FF]"
                          />
                          <input
                            type="text"
                            value={wh.city}
                            onChange={(e) => handleWarehouseChange(wh.id, 'city', e.target.value)}
                            placeholder="City"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0066FF]"
                          />
                          <input
                            type="text"
                            value={wh.state}
                            onChange={(e) => handleWarehouseChange(wh.id, 'state', e.target.value)}
                            placeholder="State"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0066FF]"
                          />
                          <input
                            type="text"
                            value={wh.postalCode}
                            onChange={(e) => handleWarehouseChange(wh.id, 'postalCode', e.target.value)}
                            placeholder="PIN Code"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0066FF]"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      No warehouses added yet. Click "Add Dispatch Hub" to configure order pickup origin.
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingStore}
                  className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer font-poppins"
                >
                  {savingStore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Store Profile...</span>
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

          {/* TAB 3: Password & Security */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <PasswordManager userDoc={userDoc} onRefresh={fetchMerchantProfile} />
            </div>
          )}

          {/* TAB 4: Danger Zone */}
          {activeTab === 'danger' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-rose-950 font-poppins">Merchant Account Danger Zone</h2>
                  <p className="text-xs text-rose-600 font-medium font-poppins">Irreversible actions and store suspension options</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-rose-950 font-poppins">Deactivate Merchant Store & Purge Products</h3>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed font-poppins">
                    Deactivating your merchant account is permanent and irreversible:
                  </p>
                  <ul className="text-xs text-rose-900 space-y-1 list-disc list-inside font-medium font-poppins">
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
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 shadow-md shadow-rose-600/20 transition-all cursor-pointer font-poppins"
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
