import React from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

export const SSOCallbackPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-cyan-600 animate-spin" />
      <p className="text-sm font-semibold text-slate-600">Completing secure authentication with Google...</p>
      <div className="hidden">
        <AuthenticateWithRedirectCallback />
      </div>
    </div>
  );
};
