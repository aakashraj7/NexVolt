import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

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
import { MerchantDashboard } from './pages/MerchantDashboard';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { SSOCallbackPage } from './pages/SSOCallback';

import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { api } from './lib/api';

// Mandatory Onboarding Guard
const OnboardingChecker: React.FC = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const exemptPaths = ['/onboarding', '/sign-in', '/sign-up', '/merchant', '/sso-callback'];
    if (exemptPaths.some(p => location.pathname.startsWith(p))) return;

    const checkOnboarding = async () => {
      try {
        const isGoogle = user.externalAccounts?.some(acc => acc.provider === 'google');
        const profile = await api.getUserProfile(user.id, {
          email: user.primaryEmailAddress?.emailAddress || '',
          fullName: user.fullName || '',
          provider: isGoogle ? 'google' : 'email_password'
        });

        if (profile && !profile.onboardingCompleted && (!profile.addresses || profile.addresses.length === 0)) {
          navigate('/onboarding');
        }
      } catch (err) {
        console.warn('Onboarding check error:', err);
      }
    };

    checkOnboarding();
  }, [isLoaded, isSignedIn, user, location.pathname]);

  return null;
};

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-cyan-500 selection:text-white">
              {/* Mandatory Step-by-Step Onboarding Guard */}
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
                  <Route path="/orders" element={<OrdersPage />} />

                  {/* Dedicated Merchant & Seller Portal Routes */}
                  <Route path="/merchant/sign-in/*" element={<MerchantSignInPage />} />
                  <Route path="/merchant/sign-up/*" element={<MerchantSignUpPage />} />
                  <Route path="/merchant" element={<MerchantDashboard />} />
                  <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
                </Routes>
              </main>

              {/* Global Footer */}
              <Footer />
            </div>
          </WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
