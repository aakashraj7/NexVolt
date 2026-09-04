import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ClerkProvider, useUser, useClerk } from '@clerk/clerk-react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder_key_for_build';

function ClerkProviderWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/onboarding"
    >
      {children}
    </ClerkProvider>
  );
}

import { Home } from './pages/Home';
import { ProductsPage } from './pages/Products';
import { ProductDetailPage } from './pages/ProductDetail';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { MerchantSignInPage } from './pages/MerchantSignInPage';
import { MerchantSignUpPage } from './pages/MerchantSignUpPage';
import { MerchantOnboardingPage } from './pages/MerchantOnboardingPage';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { MerchantProfilePage } from './pages/MerchantProfilePage';
import { MerchantStorefrontPage } from './pages/MerchantStorefrontPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderProcessingPage } from './pages/OrderProcessingPage';
import { SSOCallbackPage } from './pages/SSOCallback';

import { ToastProvider, useToast, setFlashToast } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { api } from './lib/api';

// Strict Role Guard - Prevents Customers from accessing Merchant routes & vice-versa
const RoleRouteGuard: React.FC = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const isEnforcingRef = React.useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (isEnforcingRef.current) return;

    const enforceRoleRouting = async () => {
      try {
        const userEmail = user.primaryEmailAddress?.emailAddress || '';
        const roleData = await api.checkUserRole(user.id, userEmail);
        const isExistingUser = roleData?.exists === true;
        const isMerchantUser = isExistingUser && (roleData?.isMerchant === true || roleData?.role === 'merchant');
        const isCustomerUser = isExistingUser && !isMerchantUser;
        const isNewUser = !isExistingUser;

        // 1. Check if user just attempted a specific portal sign-in (persisted across Google OAuth)
        const pendingPortal = sessionStorage.getItem('nexvolt_auth_portal');
        if (pendingPortal === 'merchant') {
          sessionStorage.removeItem('nexvolt_auth_portal');
          // If the account ALREADY exists as a Customer -> BLOCK!
          if (isCustomerUser) {
            isEnforcingRef.current = true;
            setFlashToast('This action is not possible. This account is registered as a Customer. Merchant sign-in is not permitted.', 'error');
            await signOut({ redirectUrl: '/merchant/sign-in' });
            return;
          }
          // If brand new user or merchant -> Allow into merchant onboarding / dashboard!
          if (isNewUser || !roleData?.merchantOnboardingCompleted) {
            navigate('/merchant/onboarding', { replace: true });
            return;
          }
        } else if (pendingPortal === 'customer') {
          sessionStorage.removeItem('nexvolt_auth_portal');
          // If the account ALREADY exists as a Merchant -> BLOCK!
          if (isMerchantUser) {
            isEnforcingRef.current = true;
            setFlashToast('This action is not possible. This account is registered as a Merchant. Customer sign-in is not permitted.', 'error');
            await signOut({ redirectUrl: '/sign-in' });
            return;
          }
          // If brand new user -> Allow into customer onboarding!
          if (isNewUser || !roleData?.onboardingCompleted) {
            navigate('/onboarding', { replace: true });
            return;
          }
        }

        // 2. Block ALREADY REGISTERED Customer from accessing ANY merchant page
        if (isCustomerUser && location.pathname.startsWith('/merchant')) {
          showToast('This action is not possible. Customer accounts cannot access the Merchant Portal.', 'error');
          navigate('/', { replace: true });
          return;
        }

        // 3. Block ALREADY REGISTERED Merchant from accessing customer auth, cart, wishlist, orders, or consumer profile
        if (isMerchantUser) {
          if (location.pathname.startsWith('/sign-in') || location.pathname.startsWith('/sign-up')) {
            showToast('Merchant accounts cannot access the Customer Sign In page.', 'info');
            navigate('/merchant/dashboard', { replace: true });
            return;
          }
          if (location.pathname.startsWith('/cart') || location.pathname.startsWith('/wishlist') || location.pathname.startsWith('/orders') || location.pathname.startsWith('/checkout')) {
            showToast('Cart, Wishlist, and Orders are exclusive to Customer accounts.', 'info');
            navigate('/merchant/dashboard', { replace: true });
            return;
          }
          if (location.pathname === '/profile') {
            navigate('/merchant/profile', { replace: true });
            return;
          }
        }
      } catch (err) {
        console.warn('Role route guard check error:', err);
      }
    };

    enforceRoleRouting();
  }, [isLoaded, isSignedIn, user, location.pathname, navigate, signOut, showToast]);

  return null;
};

// Mandatory Customer Onboarding Guard
const OnboardingChecker: React.FC = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    // Do NOT run on exempt paths or any merchant pages
    const exemptPaths = ['/onboarding', '/sign-in', '/sign-up', '/merchant', '/sso-callback'];
    if (exemptPaths.some(p => location.pathname.startsWith(p))) return;

    // Do NOT run if user is currently performing a merchant auth flow
    if (sessionStorage.getItem('nexvolt_auth_portal') === 'merchant') return;

    const checkOnboarding = async () => {
      try {
        const userEmail = user.primaryEmailAddress?.emailAddress || '';
        const roleData = await api.checkUserRole(user.id, userEmail);

        // Never redirect merchants to customer onboarding
        if (roleData?.isMerchant === true || roleData?.role === 'merchant') {
          return;
        }

        const isGoogle = user.externalAccounts?.some(acc => acc.provider === 'google');
        const profile = await api.getUserProfile(user.id, {
          email: userEmail,
          fullName: user.fullName || '',
          provider: isGoogle ? 'google' : 'email_password'
        });

        if (profile && !profile.isMerchant && !profile.onboardingCompleted && (!profile.addresses || profile.addresses.length === 0)) {
          navigate('/onboarding');
        }
      } catch (err) {
        console.warn('Onboarding check error:', err);
      }
    };

    checkOnboarding();
  }, [isLoaded, isSignedIn, user, location.pathname, navigate]);

  return null;
};

export function App() {
  return (
    <BrowserRouter>
      <ClerkProviderWithRouter>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-[#0066FF] selection:text-white overflow-x-hidden">
                {/* Strict Role Guard & Onboarding Guard */}
                <RoleRouteGuard />
                <OnboardingChecker />

                {/* Main Navigation Bar */}
                <Navbar />

                {/* Dynamic Pages */}
                <main className="flex-1">
                  <Routes>
                    {/* Customer Store Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:idOrSlug" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/sign-in/*" element={<SignInPage />} />
                    <Route path="/sign-up/*" element={<SignUpPage />} />
                    <Route path="/sso-callback" element={<SSOCallbackPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/order/processing/:orderId" element={<OrderProcessingPage />} />
                    <Route path="/order-status/:orderId" element={<OrderProcessingPage />} />
                    <Route path="/orders" element={<OrdersPage />} />

                    {/* Dedicated Merchant & Seller Portal Routes */}
                    <Route path="/merchant/sign-in/*" element={<MerchantSignInPage />} />
                    <Route path="/merchant/sign-up/*" element={<MerchantSignUpPage />} />
                    <Route path="/merchant/onboarding" element={<MerchantOnboardingPage />} />
                    <Route path="/merchant" element={<MerchantDashboard />} />
                    <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
                    <Route path="/merchant/storefront" element={<MerchantStorefrontPage />} />
                    <Route path="/merchant/profile" element={<MerchantProfilePage />} />
                  </Routes>
                </main>

                {/* Global Footer */}
                <Footer />
              </div>
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </ClerkProviderWithRouter>
    </BrowserRouter>
  );
}

export default App;
