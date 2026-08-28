import React, { useEffect, useRef } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export const SSOCallbackPage: React.FC = () => {
  const clerk = useClerk();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const executedRef = useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const processOAuthCallback = async () => {
      try {
        const portal = (searchParams.get('portal') || 'customer') as 'customer' | 'merchant';

        // 1. Process the redirect callback with Clerk explicitly
        await clerk.handleRedirectCallback({});

        // 2. Retrieve authenticated user details
        const currentUser = clerk.user;
        if (!currentUser) {
          navigate(portal === 'merchant' ? '/merchant/sign-in' : '/sign-in', { replace: true });
          return;
        }

        const userEmail = currentUser.primaryEmailAddress?.emailAddress || '';
        const roleData = await api.checkUserRole(currentUser.id, userEmail);
        const isMerchantUser = roleData?.isMerchant === true || roleData?.role === 'merchant';

        // 3. ENFORCE MERCHANT PORTAL ACCESS - Block Customer Accounts Immediately
        if (portal === 'merchant') {
          if (!isMerchantUser) {
            // Sign out immediately so login NEVER takes place
            await clerk.signOut();
            showToast('This action is not possible. This account is registered as a Customer. Merchant sign-in is not permitted.', 'error');
            navigate('/merchant/sign-in', { replace: true });
            return;
          }

          showToast('Welcome to NexVolt Merchant Hub!', 'success');
          if (roleData?.merchantOnboardingCompleted) {
            navigate('/merchant/dashboard', { replace: true });
          } else {
            navigate('/merchant/onboarding', { replace: true });
          }
          return;
        }

        // 4. ENFORCE CUSTOMER PORTAL ACCESS - Block Merchant Accounts
        if (portal === 'customer') {
          if (isMerchantUser) {
            // Sign out immediately so login NEVER takes place
            await clerk.signOut();
            showToast('This action is not possible. This account is registered as a Merchant. Customer sign-in is not permitted.', 'error');
            navigate('/sign-in', { replace: true });
            return;
          }

          showToast('Signed in successfully!', 'success');
          if (roleData?.onboardingCompleted) {
            navigate('/', { replace: true });
          } else {
            navigate('/onboarding', { replace: true });
          }
          return;
        }
      } catch (err: any) {
        console.error('SSO callback processing error:', err);
        showToast(err?.message || 'Authentication error. Please try again.', 'error');
        navigate('/merchant/sign-in', { replace: true });
      }
    };

    processOAuthCallback();
  }, [clerk, searchParams, navigate, showToast]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin" />
      <p className="text-sm font-bold text-slate-700">Completing secure authentication...</p>
    </div>
  );
};
