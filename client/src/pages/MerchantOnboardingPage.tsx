import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  Briefcase,
  Plus,
  Trash2,
  Globe,
  Mail,
  Warehouse,
  User,
  Calendar,
  Home
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

interface DraftWarehouse {
  id: string;
  label: string;
  customLabel?: string;
  recipientName: string;
  phone: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export const MerchantOnboardingPage: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingPhase, setSavingPhase] = useState<'saving' | 'success' | null>(null);

  // Merchant Personal Details
  const [ownerName, setOwnerName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say' | ''>('');
  const [residentialStreet, setResidentialStreet] = useState('');
  const [residentialCity, setResidentialCity] = useState('');
  const [residentialState, setResidentialState] = useState('Tamil Nadu');
  const [residentialPostalCode, setResidentialPostalCode] = useState('');

  // Step 1: Store & Brand Profile
  const [storeName, setStoreName] = useState('');
  const [businessType, setBusinessType] = useState('Authorized Distributor');
  const [category, setCategory] = useState('Smartphones & Audio');
  const [gstin, setGstin] = useState('');

  // Step 2: Contact & Authenticity
  const [businessPhone, setBusinessPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  // Step 3: Warehouse & Pickup Hubs (Tabbed mini-pages)
  const [activeWarehouseIndex, setActiveWarehouseIndex] = useState(0);
  const [warehouses, setWarehouses] = useState<DraftWarehouse[]>([
    {
      id: 'primary-wh-1',
      label: 'Main Warehouse',
      customLabel: '',
      recipientName: '',
      phone: '',
      street: '',
      landmark: '',
      city: '',
      state: '',
      postalCode: '',
      isDefault: true
    }
  ]);

  // Load existing profile if any
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      navigate('/merchant/sign-in');
      return;
    }

    const loadMerchantData = async () => {
      try {
        setLoading(true);
        const isGoogle = user.externalAccounts && user.externalAccounts.some((acc: any) =>
          acc.provider === 'google' || acc.provider === 'oauth_google' || acc.verification?.strategy === 'oauth_google'
        );
        const authProvider = isGoogle ? 'google' : 'email_password';

        const data = await api.getMerchantProfile(user.id, {
          email: user.primaryEmailAddress?.emailAddress || '',
          fullName: user.fullName || '',
          provider: authProvider,
          authProvider
        });

        if (data?.merchantProfile) {
          const mp = data.merchantProfile;
          if (mp.onboardingCompleted) {
            navigate('/merchant/dashboard');
            return;
          }
          if (mp.storeName) setStoreName(mp.storeName);
          if (mp.businessType) setBusinessType(mp.businessType);
          if (mp.category) setCategory(mp.category);
          if (mp.gstin) setGstin(mp.gstin);
          if (mp.businessPhone) setBusinessPhone(mp.businessPhone.replace(/\D/g, '').slice(-10));
          if (mp.supportEmail) setSupportEmail(mp.supportEmail);
          if (mp.website) setWebsite(mp.website);
          if (mp.warehouses && mp.warehouses.length > 0) {
            setWarehouses(mp.warehouses.map((w: any, idx: number) => ({
              id: w._id || `wh-${idx}`,
              label: w.label || 'Main Warehouse',
              customLabel: w.customLabel || '',
              recipientName: w.recipientName || '',
              phone: w.phone || '',
              street: w.street || '',
              landmark: w.landmark || '',
              city: w.city || '',
              state: w.state || '',
              postalCode: w.postalCode || '',
              isDefault: w.isDefault || idx === 0
            })));
          }
        }

        if (data?.user) {
          if (data.user.fullName) setOwnerName(data.user.fullName);
          if (data.user.dateOfBirth) setDateOfBirth(data.user.dateOfBirth);
          if (data.user.gender) setGender(data.user.gender);
          if (data.user.addresses && data.user.addresses.length > 0) {
            const a = data.user.addresses[0];
            if (a.street) setResidentialStreet(a.street);
            if (a.city) setResidentialCity(a.city);
            if (a.state) setResidentialState(a.state);
            if (a.postalCode) setResidentialPostalCode(a.postalCode);
          }
        }

        if (!ownerName && user.fullName) {
          setOwnerName(user.fullName);
        }

        if (!supportEmail) {
          setSupportEmail(user.primaryEmailAddress?.emailAddress || '');
        }
        if (!storeName && user.fullName) {
          setStoreName(`${user.fullName}'s Tech Store`);
        }
      } catch (err) {
        console.warn('Error loading merchant profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMerchantData();
  }, [isLoaded, isSignedIn, user]);

  // Step Navigation Validation
  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!storeName.trim()) {
        showToast('Please enter your store or brand name.', 'error');
        return;
      }
      if (!businessType) {
        showToast('Please select your business type.', 'error');
        return;
      }
      if (!category) {
        showToast('Please select your primary product category.', 'error');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const cleanDigits = businessPhone.replace(/\D/g, '');
      if (cleanDigits.length !== 10) {
        showToast('Please enter a valid 10-digit business phone number.', 'error');
        return;
      }
      if (!/^[7-9]/.test(cleanDigits)) {
        showToast('Indian business phone numbers must start with 7, 8, or 9.', 'error');
        return;
      }
      if (!supportEmail.trim() || !supportEmail.includes('@')) {
        showToast('Please provide a valid business support email.', 'error');
        return;
      }

      // Check phone uniqueness
      setIsCheckingPhone(true);
      try {
        const res = await api.checkPhoneAvailability(cleanDigits, user?.id);
        if (!res.available) {
          showToast(res.message || 'This contact number is already associated with another account.', 'error');
          setIsCheckingPhone(false);
          return;
        }
      } catch (err) {
        console.warn('Phone check error:', err);
      } finally {
        setIsCheckingPhone(false);
      }

      // Pre-fill primary warehouse manager details
      if (warehouses.length > 0 && !warehouses[0].recipientName) {
        setWarehouses(prev => [
          {
            ...prev[0],
            recipientName: user?.fullName || storeName,
            phone: cleanDigits
          },
          ...prev.slice(1)
        ]);
      }

      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  // Add another warehouse hub in Step 3
  const handleAddAnotherWarehouse = () => {
    const newId = `wh-${Date.now()}`;
    const newWarehouse: DraftWarehouse = {
      id: newId,
      label: 'Secondary Hub',
      customLabel: '',
      recipientName: user?.fullName || storeName,
      phone: businessPhone || '',
      street: '',
      landmark: '',
      city: '',
      state: '',
      postalCode: '',
      isDefault: false
    };

    setWarehouses(prev => [...prev, newWarehouse]);
    setActiveWarehouseIndex(warehouses.length);
    showToast(`Added Warehouse #${warehouses.length + 1}. Please fill details.`, 'info');
  };

  const handleRemoveWarehouse = (id: string, indexToRemove: number) => {
    if (warehouses.length <= 1) {
      showToast('You must register at least one primary dispatch warehouse.', 'error');
      return;
    }
    setWarehouses(prev => prev.filter(w => w.id !== id));
    setActiveWarehouseIndex(prev => Math.max(0, indexToRemove <= prev ? prev - 1 : prev));
    showToast('Warehouse location removed.', 'info');
  };

  const handleWarehouseChange = (id: string, field: keyof DraftWarehouse, value: any) => {
    setWarehouses(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, [field]: value };
      }
      return w;
    }));
  };

  // Submit complete merchant onboarding
  const handleCompleteMerchantOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    for (let i = 0; i < warehouses.length; i++) {
      const w = warehouses[i];
      if (!w.recipientName.trim() || !w.phone.trim() || !w.street.trim() || !w.city.trim() || !w.state.trim() || !w.postalCode.trim()) {
        setActiveWarehouseIndex(i);
        showToast(`Please complete all required fields for Warehouse #${i + 1}.`, 'error');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setSavingPhase('saving');

      const formattedWarehouses = warehouses.map((w, idx) => ({
        label: w.label === 'Custom' ? (w.customLabel || 'Dispatch Hub') : w.label,
        recipientName: w.recipientName.trim(),
        phone: w.phone.replace(/\D/g, '').slice(-10),
        street: w.street.trim(),
        landmark: w.landmark?.trim() || '',
        city: w.city.trim(),
        state: w.state.trim(),
        postalCode: w.postalCode.trim(),
        country: 'India',
        isDefault: idx === 0
      }));

      const isGoogle = user.externalAccounts && user.externalAccounts.some((acc: any) =>
        acc.provider === 'google' || acc.provider === 'oauth_google' || acc.verification?.strategy === 'oauth_google'
      );
      const authProvider = isGoogle ? 'google' : 'email_password';

      const payload = {
        storeName: storeName.trim(),
        ownerName: ownerName.trim() || user.fullName || storeName.trim(),
        fullName: ownerName.trim() || user.fullName || storeName.trim(),
        gender,
        dateOfBirth,
        personalAddress: residentialStreet.trim() ? {
          street: residentialStreet.trim(),
          city: residentialCity.trim(),
          state: residentialState,
          postalCode: residentialPostalCode.trim(),
          country: 'India'
        } : undefined,
        businessType,
        category,
        gstin: gstin.trim().toUpperCase(),
        businessPhone: businessPhone.replace(/\D/g, '').slice(-10),
        supportEmail: supportEmail.trim(),
        email: user.primaryEmailAddress?.emailAddress || supportEmail.trim(),
        website: website.trim(),
        warehouses: formattedWarehouses,
        onboardingCompleted: true,
        authProvider
      };

      await api.updateMerchantProfile(user.id, payload);

      // Brief delay for smooth saving animation
      setTimeout(() => {
        setSavingPhase('success');
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }, 1500);
    } catch (err: any) {
      console.error('Merchant onboarding error:', err);
      setSavingPhase(null);
      showToast(err.response?.data?.message || 'Error configuring merchant portal. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading merchant workspace...</p>
      </div>
    );
  }

  // Phase 1: Saving Animation
  if (savingPhase === 'saving') {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-2xl max-w-md w-full text-center space-y-6 animate-fade-in-scale">
          <div className="relative flex items-center justify-center mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-30" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Store className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
              Setting Up Your Storefront...
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Synchronizing warehouse dispatch locations, generating seller ID, and launching catalog access.
            </p>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#0066FF] to-cyan-500 h-full w-4/5 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Phase 2: Personalization Complete View
  if (savingPhase === 'success') {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-2xl max-w-md w-full text-center space-y-6 animate-fade-in-scale">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Storefront Ready!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Your merchant workspace has been configured. You can now list products, receive order notifications, and fulfill customer orders.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/merchant/dashboard')}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Launch Merchant Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8 animate-fade-in-up">
        {/* Top Stepper Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep > 1
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-[#0066FF] text-white shadow-md ring-4 ring-blue-500/15'
              }`}>
                {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Step 1</p>
                <p className={`text-xs font-bold ${currentStep === 1 ? 'text-[#0066FF]' : 'text-slate-700'}`}>
                  Store & Brand Profile
                </p>
              </div>
            </div>

            <div className={`flex-1 h-0.5 mx-2 transition-colors ${currentStep > 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep > 2
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : currentStep === 2
                  ? 'bg-[#0066FF] text-white shadow-md ring-4 ring-blue-500/15'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {currentStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Step 2</p>
                <p className={`text-xs font-bold ${currentStep === 2 ? 'text-[#0066FF]' : 'text-slate-700'}`}>
                  Business Verification
                </p>
              </div>
            </div>

            <div className={`flex-1 h-0.5 mx-2 transition-colors ${currentStep > 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep === 3
                  ? 'bg-[#0066FF] text-white shadow-md ring-4 ring-blue-500/15'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                3
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Step 3</p>
                <p className={`text-xs font-bold ${currentStep === 3 ? 'text-[#0066FF]' : 'text-slate-700'}`}>
                  Dispatch Hubs
                </p>
              </div>
            </div>
          </div>

          {/* Motivational Progress Bar */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                {currentStep === 1 && "Great start! Configure your brand identity to begin selling."}
                {currentStep === 2 && "Almost done! Verify your business communications for buyer trust."}
                {currentStep === 3 && "Final step! Register dispatch warehouses for instant courier pickups."}
              </span>
              <span className="font-mono font-extrabold text-[#0066FF]">
                {currentStep === 1 && '33% Completed'}
                {currentStep === 2 && '66% Completed'}
                {currentStep === 3 && '95% Completed'}
              </span>
            </div>

            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#0066FF] to-cyan-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: currentStep === 1 ? '33%' : currentStep === 2 ? '66%' : '95%'
                }}
              />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              {currentStep === 1 && 'Welcome to NexVolt Merchant Onboarding'}
              {currentStep === 2 && 'Business Contact & Verification Details'}
              {currentStep === 3 && 'Set Dispatch Warehouse & Fulfillment Hubs'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
              {currentStep === 1 && 'Define your storefront name, business category, and seller classification.'}
              {currentStep === 2 && 'Used for automated dispatch notifications, buyer inquiries, and merchant support.'}
              {currentStep === 3 && 'Enter your primary warehouse address with option to add secondary pickup hubs.'}
            </p>
          </div>
        </div>

        {/* STEP 1: Store & Owner Personal Profile */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Brand & Owner Name */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                    Store / Brand Name *
                  </label>
                  <div className="relative group">
                    <Store className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Apex Tech Innovations"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-xs outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                    Owner Legal Full Name *
                  </label>
                  <div className="relative group">
                    <User className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-xs outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                      Date of Birth
                    </label>
                    <div className="relative group">
                      <Calendar className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3 top-1/2 -translate-y-1/2 transition-colors" />
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-2.5 pl-9 pr-2 text-slate-900 text-xs outline-none transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-2.5 px-3 text-slate-900 text-xs font-semibold outline-none transition-all duration-200 cursor-pointer"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Classification & Category */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                    Primary Product Category *
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-3.5 text-slate-900 text-xs font-semibold outline-none transition-all duration-200 cursor-pointer"
                    >
                      <option value="Smartphones & Audio">Smartphones, Headphones & Earbuds</option>
                      <option value="Laptops & Computers">Laptops, Workstations & Accessories</option>
                      <option value="Gaming & VR">Gaming Consoles, Rigs & VR Gear</option>
                      <option value="Smartwatches & Wearables">Smartwatches & Fitness Trackers</option>
                      <option value="Cameras & Drones">4K Drones, Mirrorless & Action Cams</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                    Business Classification *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      'Authorized Distributor',
                      'Direct Brand',
                      'Certified Retailer',
                      'Tech Startup'
                    ].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBusinessType(type)}
                        className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all duration-200 active:scale-95 flex items-center justify-center text-center ${
                          businessType === type
                            ? 'border-[#0066FF] bg-blue-50 text-[#0066FF] ring-2 ring-[#0066FF]/20 shadow-md scale-[1.02]'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                    GSTIN / Tax Identification (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-3.5 text-slate-900 font-mono text-xs tracking-wider outline-none transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleNextStep}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer font-poppins"
              >
                <span>Continue to Business Contact & Address</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Business Contact & Residential Address */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Business Communications */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-poppins">Business Communications</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                    Business Phone Number *
                  </label>
                  <div className="relative flex items-center group">
                    <span className="absolute left-3.5 font-bold text-slate-500 text-xs px-2 py-1 rounded-lg bg-slate-200/80 border border-slate-300 font-mono select-none group-focus-within:border-[#0066FF] transition-colors">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-16 pr-4 text-slate-900 font-mono tracking-wider text-sm outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                    Customer Support Email *
                  </label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type="email"
                      required
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="support@yourbrand.com"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-xs outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                    Official Website / Catalog Link (Optional)
                  </label>
                  <div className="relative group">
                    <Globe className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.yourbrand.com"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-xs outline-none transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Personal Residential Address */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-poppins">Merchant Residential Address</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                    Flat / House No. / Street Address
                  </label>
                  <div className="relative group">
                    <Home className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                    <input
                      type="text"
                      value={residentialStreet}
                      onChange={(e) => setResidentialStreet(e.target.value)}
                      placeholder="e.g. 42, Tech Park Enclave"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-xs outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                      City
                    </label>
                    <input
                      type="text"
                      value={residentialCity}
                      onChange={(e) => setResidentialCity(e.target.value)}
                      placeholder="e.g. Chennai"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-3.5 text-slate-900 text-xs outline-none transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-poppins">
                      Postal PIN Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={residentialPostalCode}
                      onChange={(e) => setResidentialPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 600001"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 px-3.5 text-slate-900 font-mono text-xs outline-none transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={isCheckingPhone}
                onClick={handleNextStep}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2 disabled:opacity-60"
              >
                {isCheckingPhone ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Contact...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Dispatch Hubs</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Warehouse & Dispatch Pickup Hubs (Mini-pages / tabs) */}
        {currentStep === 3 && (
          <form onSubmit={handleCompleteMerchantOnboarding} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-xs">
            {/* Mini-Pages Header & Tab Switcher */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Dispatch Warehouses ({warehouses.length})
                </span>
                <span className="text-[11px] font-bold text-[#0066FF] font-mono">
                  Hub {activeWarehouseIndex + 1} of {warehouses.length}
                </span>
              </div>

              {/* Horizontal Mini-Page Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {warehouses.map((wh, index) => {
                  const labelTitle = wh.label === 'Custom' ? (wh.customLabel || `Hub ${index + 1}`) : wh.label;
                  const isActive = activeWarehouseIndex === index;

                  return (
                    <div key={wh.id} className="flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveWarehouseIndex(index)}
                        className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-2 border ${
                          isActive
                            ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-md shadow-blue-500/20 scale-[1.02]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                          isActive ? 'bg-white text-[#0066FF]' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {index + 1}
                        </span>
                        <span>{index === 0 ? `Primary (${labelTitle})` : labelTitle}</span>
                      </button>

                      {index > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveWarehouse(wh.id, index);
                          }}
                          className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remove this warehouse"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* + Add New Warehouse Tab */}
                <button
                  type="button"
                  onClick={handleAddAnotherWarehouse}
                  className="shrink-0 py-2 px-3.5 rounded-xl font-bold text-xs bg-blue-50 text-[#0066FF] border border-blue-200 hover:bg-blue-100/70 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Warehouse</span>
                </button>
              </div>
            </div>

            {/* Active Warehouse Mini-Page Form Card */}
            {(() => {
              const currentWh = warehouses[activeWarehouseIndex] || warehouses[0];
              if (!currentWh) return null;

              return (
                <div
                  key={currentWh.id}
                  className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-sm animate-fade-in-scale"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#0066FF] text-white text-xs font-extrabold flex items-center justify-center">
                        {activeWarehouseIndex + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {activeWarehouseIndex === 0 ? 'Primary Dispatch Warehouse' : `Secondary Warehouse Hub #${activeWarehouseIndex + 1}`}
                      </span>
                    </div>

                    {activeWarehouseIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveWarehouse(currentWh.id, activeWarehouseIndex)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Warehouse</span>
                      </button>
                    )}
                  </div>

                  {/* Warehouse Label Preset */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Hub Label / Warehouse Name *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {['Main Warehouse', 'Regional Hub', 'Factory Outlet', 'Custom'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleWarehouseChange(currentWh.id, 'label', item)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all duration-200 active:scale-95 flex items-center gap-1.5 ${
                            currentWh.label === item
                              ? 'bg-[#0066FF] text-white shadow-xs scale-[1.02]'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item === 'Main Warehouse' && <Warehouse className="w-3.5 h-3.5" />}
                          {item === 'Regional Hub' && <Building2 className="w-3.5 h-3.5" />}
                          {item === 'Factory Outlet' && <Briefcase className="w-3.5 h-3.5" />}
                          <span>{item}</span>
                        </button>
                      ))}
                    </div>

                    {currentWh.label === 'Custom' && (
                      <input
                        type="text"
                        required
                        value={currentWh.customLabel || ''}
                        onChange={(e) => handleWarehouseChange(currentWh.id, 'customLabel', e.target.value)}
                        placeholder="e.g. North Zone Depot, Electronics Park Unit 4"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Dispatch Manager / Contact Person *</label>
                      <input
                        type="text"
                        required
                        value={currentWh.recipientName}
                        onChange={(e) => handleWarehouseChange(currentWh.id, 'recipientName', e.target.value)}
                        placeholder="Manager Name"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Warehouse Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={currentWh.phone}
                        onChange={(e) => handleWarehouseChange(currentWh.id, 'phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Street Address / Industrial Complex *</label>
                    <input
                      type="text"
                      required
                      value={currentWh.street}
                      onChange={(e) => handleWarehouseChange(currentWh.id, 'street', e.target.value)}
                      placeholder="Plot 45, Electronics City Phase 1, Hosur Road"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={currentWh.landmark || ''}
                      onChange={(e) => handleWarehouseChange(currentWh.id, 'landmark', e.target.value)}
                      placeholder="Near Toll Gate / Express Logistics Hub"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={currentWh.city}
                        onChange={(e) => handleWarehouseChange(currentWh.id, 'city', e.target.value)}
                        placeholder="Bengaluru"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={currentWh.state}
                        onChange={(e) => handleWarehouseChange(currentWh.id, 'state', e.target.value)}
                        placeholder="Karnataka"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">PIN Code *</label>
                      <input
                        type="text"
                        required
                        value={currentWh.postalCode}
                        onChange={(e) => handleWarehouseChange(currentWh.id, 'postalCode', e.target.value)}
                        placeholder="560100"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                      />
                    </div>
                  </div>

                  {/* Sub-pagination navigation if multiple warehouses exist */}
                  {warehouses.length > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 text-xs">
                      <button
                        type="button"
                        disabled={activeWarehouseIndex === 0}
                        onClick={() => setActiveWarehouseIndex(prev => Math.max(0, prev - 1))}
                        className="font-bold text-[#0066FF] hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
                      >
                        ← Previous Warehouse
                      </button>

                      <span className="text-slate-400 font-medium">
                        Tab {activeWarehouseIndex + 1} of {warehouses.length}
                      </span>

                      <button
                        type="button"
                        disabled={activeWarehouseIndex === warehouses.length - 1}
                        onClick={() => setActiveWarehouseIndex(prev => Math.min(warehouses.length - 1, prev + 1))}
                        className="font-bold text-[#0066FF] hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
                      >
                        Next Warehouse →
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Configuring Storefront...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Merchant Setup & Start Selling</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
