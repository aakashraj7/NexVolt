import React from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const SSOCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const portal = (searchParams.get('portal') || sessionStorage.getItem('nexvolt_auth_portal') || 'customer') as 'customer' | 'merchant';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin" />
      <p className="text-sm font-bold text-slate-700">Completing secure authentication...</p>
      <AuthenticateWithRedirectCallback
        signInUrl={portal === 'merchant' ? '/merchant/sign-in' : '/sign-in'}
        signUpUrl={portal === 'merchant' ? '/merchant/sign-up' : '/sign-up'}
        continueSignUpUrl={portal === 'merchant' ? '/merchant/sign-up' : '/sign-up'}
        firstFactorUrl={portal === 'merchant' ? '/merchant/sign-in' : '/sign-in'}
        secondFactorUrl={portal === 'merchant' ? '/merchant/sign-in' : '/sign-in'}
        signInFallbackRedirectUrl={portal === 'merchant' ? '/merchant/dashboard' : '/'}
        signUpFallbackRedirectUrl={portal === 'merchant' ? '/merchant/onboarding' : '/onboarding'}
      />
    </div>
  );
};
