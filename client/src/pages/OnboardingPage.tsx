import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Home,
  Briefcase,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';

interface DraftAddress {
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

export const OnboardingPage: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingPhase, setSavingPhase] = useState<'saving' | 'success' | null>(null);

  // Step 1: Basic Info
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say' | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Step 2: Contact Details
  const [phone, setPhone] = useState('');

  // Step 3: Addresses List (Primary + Optional additional addresses)
  const [activeAddressIndex, setActiveAddressIndex] = useState(0);
  const [addresses, setAddresses] = useState<DraftAddress[]>([
    {
      id: 'primary-1',
      label: 'Home',
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

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      navigate('/sign-in');
      return;
    }

    const checkExistingProfile = async () => {
      try {
        setLoading(true);
        const email = user.primaryEmailAddress?.emailAddress || '';
        const roleData = await api.checkUserRole(user.id, email);

        if (roleData?.isMerchant || sessionStorage.getItem('nexvolt_auth_portal') === 'merchant') {
          navigate('/merchant/onboarding', { replace: true });
          return;
        }

        const name = user.fullName || '';
        const isGoogle = user.externalAccounts?.some(acc => acc.provider === 'google');

        const profile = await api.getUserProfile(user.id, {
          email,
          fullName: name,
          provider: isGoogle ? 'google' : 'email_password'
        });

        if (profile?.onboardingCompleted && profile.addresses?.length > 0) {
          // Already completed onboarding, proceed to home
          navigate('/');
          return;
        }

        // Prefill default recipient name and phone if available
        if (user.fullName) {
          setAddresses(prev => prev.map(a => ({ ...a, recipientName: user.fullName || '' })));
        }
        if (user.primaryPhoneNumber?.phoneNumber) {
          const rawDigits = user.primaryPhoneNumber.phoneNumber.replace(/\D/g, '').slice(-10);
          setPhone(rawDigits);
          setAddresses(prev => prev.map(a => ({ ...a, phone: rawDigits })));
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkExistingProfile();
  }, [isLoaded, isSignedIn, user]);

  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  // Step Validation & Navigation
  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!gender) {
        showToast('Please select your gender to continue.', 'error');
        return;
      }
      if (!dateOfBirth) {
        showToast('Please select your date of birth.', 'error');
        return;
      }

      // Age calculation & 18+ eligibility verification
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (isNaN(birthDate.getTime()) || age < 18) {
        showToast('You must be 18 years or older to register and shop on NexVolt.', 'error');
        return;
      }

      if (age > 120) {
        showToast('Please enter a valid date of birth.', 'error');
        return;
      }

      setCurrentStep(2);
    } else if (currentStep === 2) {
      const cleanDigits = phone.replace(/\D/g, '');
      if (cleanDigits.length !== 10) {
        showToast('Please enter exactly a 10-digit mobile number.', 'error');
        return;
      }
      if (!/^[7-9]/.test(cleanDigits)) {
        showToast('Indian mobile number must start with 7, 8, or 9.', 'error');
        return;
      }

      // Verify phone uniqueness across database
      setIsCheckingPhone(true);
      try {
        const res = await api.checkPhoneAvailability(cleanDigits, user?.id);
        if (!res.available) {
          showToast(res.message || 'This mobile number is already registered with another account.', 'error');
          setIsCheckingPhone(false);
          return;
        }
      } catch (err) {
        console.warn('Phone check error:', err);
      } finally {
        setIsCheckingPhone(false);
      }

      // Update phone in addresses if blank
      setAddresses(prev => prev.map(a => ({ ...a, phone: a.phone || cleanDigits })));
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  // Add another address in Step 3
  const handleAddAnotherAddress = () => {
    const newId = `addr-${Date.now()}`;
    const newAddress: DraftAddress = {
      id: newId,
      label: 'Office',
      customLabel: '',
      recipientName: user?.fullName || '',
      phone: phone || '',
      street: '',
      landmark: '',
      city: '',
      state: '',
      postalCode: '',
      isDefault: false
    };

    setAddresses(prev => [...prev, newAddress]);
    setActiveAddressIndex(addresses.length);
    showToast(`Added Address #${addresses.length + 1}. Please fill details.`, 'info');
  };

  const handleRemoveAddress = (id: string, indexToRemove: number) => {
    if (addresses.length <= 1) {
      showToast('You must have at least one primary delivery address.', 'error');
      return;
    }
    setAddresses(prev => prev.filter(a => a.id !== id));
    setActiveAddressIndex(prev => Math.max(0, indexToRemove <= prev ? prev - 1 : prev));
    showToast('Address removed.', 'info');
  };

  const handleAddressChange = (id: string, field: keyof DraftAddress, value: any) => {
    setAddresses(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, [field]: value };
      }
      return a;
    }));
  };

  // Complete Onboarding & Save everything to Database
  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate all addresses
    for (let i = 0; i < addresses.length; i++) {
      const a = addresses[i];
      const addressName = a.label === 'Custom' ? (a.customLabel || `Address #${i+1}`) : a.label;
      if (!a.street.trim() || !a.city.trim() || !a.state.trim() || !a.postalCode.trim()) {
        showToast(`Please fill in all required address fields for "${addressName}".`, 'error');
        return;
      }
      if (!a.recipientName.trim() || !a.phone.trim()) {
        showToast(`Please provide recipient name and phone for "${addressName}".`, 'error');
        return;
      }
    }

    setIsSubmitting(true);
    setSavingPhase('saving');

    try {
      const formattedAddresses = addresses.map((a, idx) => ({
        label: a.label === 'Custom' ? (a.customLabel?.trim() || `Address ${idx + 1}`) : a.label,
        recipientName: a.recipientName.trim(),
        phone: a.phone.trim(),
        street: a.street.trim(),
        landmark: a.landmark?.trim() || '',
        city: a.city.trim(),
        state: a.state.trim(),
        postalCode: a.postalCode.trim(),
        country: 'India',
        isDefault: idx === 0
      }));

      const isGoogle = user.externalAccounts?.some(acc => acc.provider === 'google');

      const payload = {
        email: user.primaryEmailAddress?.emailAddress,
        fullName: user.fullName || '',
        phone: phone.trim(),
        gender,
        dateOfBirth,
        authProvider: isGoogle ? 'google' : 'email_password',
        onboardingCompleted: true,
        addresses: formattedAddresses
      };

      await api.updateUserProfile(user.id, payload);

      // Brief animation pause for smooth UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSavingPhase('success');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast('Personalization complete!', 'success');

      // Auto redirect to /products after 3.5 seconds
      setTimeout(() => {
        navigate('/products');
      }, 3500);
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setSavingPhase(null);
      showToast('Failed to save profile. Please check connection and try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Preparing your account setup...</p>
      </div>
    );
  }

  // SAVING ANIMATION & SUCCESS VIEW
  if (savingPhase === 'saving') {
    return (
      <div className="min-h-[85vh] py-12 px-4 max-w-xl mx-auto flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center relative">
            <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
              Personalizing Your Experience...
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Saving your profile, configuring delivery locations, and curating your catalog.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (savingPhase === 'success') {
    return (
      <div className="min-h-[85vh] py-12 px-4 max-w-xl mx-auto flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Personalization Complete!
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Your profile and delivery addresses have been successfully configured.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/products')}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              Automatically redirecting to products...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col justify-center">
      {/* Onboarding Container Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200 shadow-xl space-y-8 relative overflow-hidden">
        {/* Top UX Numbered Stepper & Motivational Progress */}
        <div className="space-y-5">
          {/* Numbered Step Indicators */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep > 1
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : currentStep === 1
                  ? 'bg-[#0066FF] text-white shadow-md ring-4 ring-blue-500/15'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Step 1</p>
                <p className={`text-xs font-bold ${currentStep === 1 ? 'text-[#0066FF]' : 'text-slate-700'}`}>
                  Basic Profile
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
                  Contact Details
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
                  Delivery Location
                </p>
              </div>
            </div>
          </div>

          {/* Motivational Progress Bar */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                {currentStep === 1 && "Great start! 2 quick steps left to personalize your experience."}
                {currentStep === 2 && "Almost there! You're just 1 step away from express delivery access."}
                {currentStep === 3 && "Final step! Set your delivery address to start shopping."}
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
              {currentStep === 1 && 'Welcome! Tell Us About Yourself'}
              {currentStep === 2 && 'What is Your Contact Phone Number?'}
              {currentStep === 3 && 'Set Your Primary Delivery Address'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
              {currentStep === 1 && 'Select your gender and birthdate for personalized tech curation & birthday perks.'}
              {currentStep === 2 && 'Used for live order updates, OTPs, and express dispatch logistics.'}
              {currentStep === 3 && 'Enter your primary delivery location, with an option to add more custom addresses.'}
            </p>
          </div>
        </div>

        {/* STEP 1: Basic Demographics */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Gender *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setGender(item.value as any)}
                      className={`py-3.5 px-4 rounded-2xl border text-xs font-bold transition-all duration-200 active:scale-95 flex items-center justify-center ${
                        gender === item.value
                          ? 'border-[#0066FF] bg-blue-50 text-[#0066FF] ring-2 ring-[#0066FF]/20 shadow-md scale-[1.02]'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:scale-[1.01]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Date of Birth (18+ Only) *
                </label>
                <div className="relative group">
                  <Calendar className="w-4 h-4 text-slate-400 group-focus-within:text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="date"
                    required
                    max={(() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() - 18);
                      return d.toISOString().split('T')[0];
                    })()}
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-xs outline-none transition-all duration-200"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  Shoppers must be 18 years or older. We also send birthday gifts & VIP member perks.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleNextStep}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2"
              >
                <span>Continue to Mobile Number</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Mobile Number */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mobile Number (India) *
                </label>
                <div className="relative flex items-center group">
                  <span className="absolute left-3.5 font-bold text-slate-500 text-xs px-2 py-1 rounded-lg bg-slate-200/80 border border-slate-300 font-mono select-none group-focus-within:border-[#0066FF] transition-colors">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/15 rounded-xl py-3 pl-16 pr-4 text-slate-900 font-mono tracking-wider text-sm outline-none transition-all duration-200"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Enter your unique 10-digit mobile number starting with 7, 8, or 9.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-600 space-y-2.5 hover:border-slate-300 transition-all duration-200">
                <p className="font-bold text-slate-900">Why do we need your mobile number?</p>
                <ul className="space-y-1.5 text-slate-600 font-medium">
                  <li className="flex items-center gap-2 text-slate-700">✓ Account authenticity & verified tech buyer status</li>
                  <li className="flex items-center gap-2 text-slate-700">✓ Order fulfillment & secure courier delivery coordination</li>
                  <li className="flex items-center gap-2 text-slate-700">✓ Priority customer support & warranty coverage</li>
                </ul>
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
                    <span>Verifying Number...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Address</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Delivery Addresses (Organized in mini-pages / tabs) */}
        {currentStep === 3 && (
          <form onSubmit={handleCompleteOnboarding} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-xs">
            {/* Mini-Pages Header & Tab Switcher */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Delivery Addresses ({addresses.length})
                </span>
                <span className="text-[11px] font-bold text-[#0066FF] font-mono">
                  Location {activeAddressIndex + 1} of {addresses.length}
                </span>
              </div>

              {/* Horizontal Mini-Page Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {addresses.map((addr, index) => {
                  const labelTitle = addr.label === 'Custom' ? (addr.customLabel || `Address ${index + 1}`) : addr.label;
                  const isActive = activeAddressIndex === index;

                  return (
                    <div key={addr.id} className="flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveAddressIndex(index)}
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
                            handleRemoveAddress(addr.id, index);
                          }}
                          className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remove this address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* + Add New Address Tab */}
                <button
                  type="button"
                  onClick={handleAddAnotherAddress}
                  className="shrink-0 py-2 px-3.5 rounded-xl font-bold text-xs bg-blue-50 text-[#0066FF] border border-blue-200 hover:bg-blue-100/70 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              </div>
            </div>

            {/* Active Address Mini-Page Form Card */}
            {(() => {
              const currentAddr = addresses[activeAddressIndex] || addresses[0];
              if (!currentAddr) return null;

              return (
                <div
                  key={currentAddr.id}
                  className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-sm animate-fade-in-scale"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#0066FF] text-white text-xs font-extrabold flex items-center justify-center">
                        {activeAddressIndex + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {activeAddressIndex === 0 ? 'Primary Delivery Address' : `Additional Address #${activeAddressIndex + 1}`}
                      </span>
                    </div>

                    {activeAddressIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(currentAddr.id, activeAddressIndex)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Address</span>
                      </button>
                    )}
                  </div>

                  {/* Address Label Preset */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Address Label / Custom Name *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {['Home', 'Office', 'Studio', 'Custom'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAddressChange(currentAddr.id, 'label', item)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all duration-200 active:scale-95 flex items-center gap-1.5 ${
                            currentAddr.label === item
                              ? 'bg-[#0066FF] text-white shadow-xs scale-[1.02]'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item === 'Home' && <Home className="w-3.5 h-3.5" />}
                          {item === 'Office' && <Briefcase className="w-3.5 h-3.5" />}
                          {item === 'Studio' && <Building2 className="w-3.5 h-3.5" />}
                          <span>{item}</span>
                        </button>
                      ))}
                    </div>

                    {currentAddr.label === 'Custom' && (
                      <input
                        type="text"
                        required
                        value={currentAddr.customLabel || ''}
                        onChange={(e) => handleAddressChange(currentAddr.id, 'customLabel', e.target.value)}
                        placeholder="e.g. Parent's House, Farmhouse, Studio"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Recipient Name *</label>
                      <input
                        type="text"
                        required
                        value={currentAddr.recipientName}
                        onChange={(e) => handleAddressChange(currentAddr.id, 'recipientName', e.target.value)}
                        placeholder="Full recipient name"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={currentAddr.phone}
                        onChange={(e) => handleAddressChange(currentAddr.id, 'phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Street Address, Flat / Building *</label>
                    <input
                      type="text"
                      required
                      value={currentAddr.street}
                      onChange={(e) => handleAddressChange(currentAddr.id, 'street', e.target.value)}
                      placeholder="Flat 402, Quantum Towers, Sector 45"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={currentAddr.landmark || ''}
                      onChange={(e) => handleAddressChange(currentAddr.id, 'landmark', e.target.value)}
                      placeholder="Near Cyber City Metro Station"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={currentAddr.city}
                        onChange={(e) => handleAddressChange(currentAddr.id, 'city', e.target.value)}
                        placeholder="Bengaluru"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={currentAddr.state}
                        onChange={(e) => handleAddressChange(currentAddr.id, 'state', e.target.value)}
                        placeholder="Karnataka"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">PIN Code *</label>
                      <input
                        type="text"
                        required
                        value={currentAddr.postalCode}
                        onChange={(e) => handleAddressChange(currentAddr.id, 'postalCode', e.target.value)}
                        placeholder="560001"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                      />
                    </div>
                  </div>

                  {/* Sub-pagination navigation if multiple addresses exist */}
                  {addresses.length > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 text-xs">
                      <button
                        type="button"
                        disabled={activeAddressIndex === 0}
                        onClick={() => setActiveAddressIndex(prev => Math.max(0, prev - 1))}
                        className="font-bold text-[#0066FF] hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
                      >
                        ← Previous Address
                      </button>

                      <span className="text-slate-400 font-medium">
                        Tab {activeAddressIndex + 1} of {addresses.length}
                      </span>

                      <button
                        type="button"
                        disabled={activeAddressIndex === addresses.length - 1}
                        onClick={() => setActiveAddressIndex(prev => Math.min(addresses.length - 1, prev + 1))}
                        className="font-bold text-[#0066FF] hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
                      >
                        Next Address →
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
                    <span>Saving Profile & Addresses...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup & Start Shopping</span>
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
