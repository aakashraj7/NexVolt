import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Truck,
  MapPin,
  Package,
  ShieldCheck,
  Zap,
  CreditCard,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Copy,
  ExternalLink,
  QrCode,
  Check
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import type { Order, RevivePayCase } from '../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const OrderProcessingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();
  const { showToast } = useToast();
  const { clearCart } = useCart();

  const [order, setOrder] = useState<Order | null>(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [stage, setStage] = useState<'initiating' | 'awaiting' | 'processing' | 'success' | 'failed'>(
    location.state?.order?.paymentStatus === 'paid'
      ? 'success'
      : location.state?.immediateStatus || (location.state?.order ? 'initiating' : 'processing')
  );
  const [failureReason, setFailureReason] = useState<string>(location.state?.failureReason || '');
  const [paymentId, setPaymentId] = useState<string>('');
  const [showRetryConfirm, setShowRetryConfirm] = useState(false);
  const [prepProgress, setPrepProgress] = useState(25);
  const [prepStepText, setPrepStepText] = useState('Initializing 1-Click Express Checkout...');
  const razorpayLaunchedRef = useRef(false);
  const paymentSucceededRef = useRef(false);

  // RevivePay AI Recovery State
  const [revivePayCase, setRevivePayCase] = useState<RevivePayCase | null>(null);
  const [isAnalyzingRevivePay, setIsAnalyzingRevivePay] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Scroll To Top on mount and whenever stage updates
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [stage]);

  // 2. Authentication & Route Security Guard
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      showToast('Please sign in to view your order details.', 'info');
      navigate('/sign-in', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate, showToast]);

  // 3. Fetch Order from DB & Validate Ownership
  useEffect(() => {
    if (!orderId || !isLoaded || !user) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await api.getOrderById(orderId);
        if (data) {
          if (data.userId && data.userId !== user.id) {
            showToast('Unauthorized access to this order.', 'error');
            navigate('/orders', { replace: true });
            return;
          }

          setOrder(data);
          if (data.paymentStatus === 'paid') {
            setStage('success');
          } else if (
            data.paymentStatus === 'failed' ||
            data.failureReason ||
            (data.revivePayCase?.recoveryAttempts || 0) > 0 ||
            data.checkoutStatus === 'abandoned'
          ) {
            // Unpaid, failed, or already attempted orders stay on the resolution screen on reload
            setStage('failed');
            setFailureReason(data.failureReason || 'Payment was not completed.');
            if (data.revivePayCase) {
              setRevivePayCase(data.revivePayCase);
            }
          }
        } else {
          showToast('Order not found.', 'error');
          navigate('/cart', { replace: true });
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        navigate('/orders', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isLoaded, user]);

  // 4. Dynamic Multi-Stage Countdown & Launch Payment Flow
  useEffect(() => {
    // Critical Guard: Never launch Razorpay if already paid or not in initiating stage
    if (stage !== 'initiating' || !order || order.paymentStatus === 'paid' || razorpayLaunchedRef.current) return;

    if (order.paymentMethod?.toLowerCase().includes('delivery') || order.paymentMethod?.toLowerCase().includes('cod')) {
      handleCompleteCOD();
      return;
    }

    const step1 = setTimeout(() => {
      setPrepProgress(55);
      setPrepStepText('Allocating items & applying express discounts...');
    }, 700);

    const step2 = setTimeout(() => {
      setPrepProgress(85);
      setPrepStepText('Connecting with Razorpay secure pipeline...');
    }, 1500);

    const step3 = setTimeout(() => {
      setPrepProgress(100);
      setPrepStepText('Opening Razorpay Gateway...');
    }, 2300);

    const step4 = setTimeout(() => {
      launchRazorpay();
    }, 2800);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(step4);
    };
  }, [stage, order]);

  const handleCompleteCOD = async () => {
    if (!order) return;
    try {
      setStage('processing');
      await api.completeOrder(order.orderId, 'COD-' + Date.now(), 'Pay on Delivery (COD)');
      clearCart();
      sessionStorage.setItem(`nexvolt_confirmed_${order.orderId}`, 'true');
      setStage('success');
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch {}
    } catch (err) {
      console.error('COD order error:', err);
      setStage('failed');
      setFailureReason('Could not confirm order. Please try again.');
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window.Razorpay !== 'undefined') {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const launchRazorpay = async () => {
    if (!order) return;
    razorpayLaunchedRef.current = true;
    paymentSucceededRef.current = false;
    setStage('awaiting');

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || typeof window.Razorpay === 'undefined') {
      razorpayLaunchedRef.current = false;
      setStage('failed');
      setFailureReason('Unable to load Razorpay payment gateway SDK. Please check your internet connection.');
      showToast('Payment gateway unavailable. Please retry.', 'error');
      return;
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

    // 1. Ensure server-side Razorpay Order ID is available
    let currentRzpOrderId = order.razorpayOrderId;
    if (!currentRzpOrderId) {
      try {
        const rzpOrderData = await api.createRazorpayOrder(order.orderId);
        if (rzpOrderData?.razorpayOrderId) {
          currentRzpOrderId = rzpOrderData.razorpayOrderId;
          setOrder(prev => (prev ? { ...prev, razorpayOrderId: rzpOrderData.razorpayOrderId } : null));
        }
      } catch (err) {
        console.warn('Could not pre-create Razorpay Order ID on server, falling back to direct amount mode:', err);
      }
    }

    const options: any = {
      key: keyId,
      amount: Math.round(order.totalAmount * 100),
      currency: order.currency || 'INR',
      name: 'NexVolt Store',
      description: `Order #${order.orderId}`,
      image: '/src/assets/nexVolt-logo-without-text.png',
      timeout: 60, // 60 seconds timeout for experimentation & testing RevivePay
      ...(currentRzpOrderId ? { order_id: currentRzpOrderId } : {}),
      handler: async (response: any) => {
        try {
          paymentSucceededRef.current = true;
          setStage('processing');
          const pId = response.razorpay_payment_id || 'rzp_paid';
          setPaymentId(pId);

          // 2. Cryptographic Server-Side Signature Verification
          const verifyResult = await api.verifyPayment(order.orderId, {
            razorpay_order_id: response.razorpay_order_id || currentRzpOrderId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            paymentMethod: 'Razorpay'
          });

          if (verifyResult?.success) {
            paymentSucceededRef.current = true;
            if (verifyResult.order) {
              setOrder(verifyResult.order);
            } else {
              setOrder(prev => prev ? { ...prev, paymentStatus: 'paid', checkoutStatus: 'completed' } : null);
            }
            clearCart();
            setStage('success');
            try {
              confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
            } catch {}
            showToast('Payment confirmed! Your order is placed.', 'success');
          } else {
            paymentSucceededRef.current = false;
            throw new Error(verifyResult?.message || 'Payment signature verification failed');
          }
        } catch (err: any) {
          paymentSucceededRef.current = false;
          console.error('Payment verification error:', err);
          razorpayLaunchedRef.current = false;
          setStage('failed');
          const errMsg = err?.response?.data?.message || err?.message || 'Payment verification was interrupted. Please retry.';
          setFailureReason(errMsg);
          showToast(errMsg, 'error');
        }
      },
      prefill: {
        name: order.customerDetails?.name || user?.fullName || '',
        email: order.customerDetails?.email || user?.primaryEmailAddress?.emailAddress || '',
        contact: order.customerDetails?.phone || ''
      },
      theme: {
        color: '#0066FF'
      },
      modal: {
        ondismiss: async () => {
          razorpayLaunchedRef.current = false;
          // CRITICAL: If the payment already succeeded in handler(), ignore ondismiss
          if (paymentSucceededRef.current) {
            return;
          }
          setStage('failed');
          const reason = 'Payment window was closed before completion.';
          setFailureReason(reason);
          await api.failOrder(order.orderId, {
            reason,
            description: 'Customer exited the Razorpay payment modal window without completing authorization.'
          });
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response: any) => {
        if (paymentSucceededRef.current) return;
        const errObj = response.error || {};
        const reason = errObj.description || errObj.reason || 'Payment could not be completed';
        setFailureReason(reason);
        // Persist telemetry without immediately locking UI if the modal is still open
        await api.failOrder(order.orderId, {
          reason,
          code: errObj.code || '',
          description: errObj.description || reason,
          source: errObj.source || '',
          step: errObj.step || '',
          paymentId: errObj.metadata?.payment_id || ''
        });
      });
      rzp.open();
    } catch (err: any) {
      console.error('Error launching gateway:', err);
      razorpayLaunchedRef.current = false;
      setStage('failed');
      setFailureReason(err?.message || 'Could not launch payment gateway.');
    }
  };

  // 5. RevivePay AI Recovery Analysis & Live Link Status Polling
  useEffect(() => {
    if (stage !== 'failed' || !order?.orderId) return;

    let isMounted = true;
    const fetchRevivePayAnalysis = async () => {
      try {
        setIsAnalyzingRevivePay(true);
        const data = await api.analyzeRecovery(order.orderId);
        if (isMounted && data?.recoveryCase) {
          setRevivePayCase(data.recoveryCase);
        }
      } catch (err) {
        console.warn('RevivePay analysis load note:', err);
      } finally {
        if (isMounted) setIsAnalyzingRevivePay(false);
      }
    };

    fetchRevivePayAnalysis();

    // If a payment link is active, poll order status every 3.5s for instant webhook/external payment confirmation
    let pollTimer: any = null;
    pollTimer = setInterval(async () => {
      try {
        const latest = await api.getOrderById(order.orderId);
        if (latest && latest.paymentStatus === 'paid') {
          if (isMounted) {
            setOrder(latest);
            setStage('success');
            clearCart();
            showToast('Payment confirmed! Your order is placed.', 'success');
            try {
              confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
            } catch {}
          }
        }
      } catch {}
    }, 3500);

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [stage, order?.orderId]);

  const handleGeneratePaymentLink = async () => {
    if (!order) return;
    try {
      setIsGeneratingLink(true);
      const res = await api.generateRecoveryPaymentLink(order.orderId);
      if (res?.success && res.shortUrl) {
        setRevivePayCase(prev =>
          prev
            ? {
                ...prev,
                status: 'link_generated',
                razorpayPaymentLinkId: res.paymentLinkId,
                razorpayPaymentLinkUrl: res.shortUrl
              }
            : {
                status: 'link_generated',
                recoveryAttempts: 1,
                razorpayPaymentLinkId: res.paymentLinkId,
                razorpayPaymentLinkUrl: res.shortUrl
              }
        );
        showToast('Secure Razorpay Payment Link generated!', 'success');
      } else {
        showToast('Could not generate payment link. Please retry or choose Cash on Delivery.', 'error');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Error creating payment link', 'error');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (revivePayCase?.razorpayPaymentLinkUrl) {
      navigator.clipboard.writeText(revivePayCase.razorpayPaymentLinkUrl);
      setCopiedLink(true);
      showToast('Payment link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSmartBack = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (location.state?.from === 'cart') {
      navigate('/cart');
    } else if (location.state?.from === 'checkout') {
      navigate('/checkout');
    } else if (location.state?.from === 'orders') {
      navigate('/orders');
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/orders');
      }
    }
  };

  const getCustomerFriendlyAction = (action?: string) => {
    if (!action) return 'Retry Payment';
    const act = action.toLowerCase();
    if (act.includes('link')) return 'Direct Payment Link';
    if (act.includes('escalat')) return 'Support Assistance / Pay on Delivery';
    return 'Retry Payment';
  };

  if (loading || !order) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4 font-poppins animate-in fade-in duration-300">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200 shadow-md">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </div>
        <p className="text-xs font-bold text-slate-700">Connecting to secure checkout session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 font-poppins animate-in fade-in duration-200">
      
      {/* Sleek Breadcrumb / Navigation Bar */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSmartBack}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={location.state?.from === 'cart' ? 'Back to Cart' : 'Back to Orders'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                Checkout Session
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                #{order.orderId}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              {stage === 'success' ? 'Order Confirmation' : stage === 'failed' ? 'Payment Incomplete' : 'Processing Order'}
            </h1>
          </div>
        </div>

        {/* Dynamic Status Tag */}
        <div>
          {stage === 'success' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Confirmed</span>
            </span>
          )}
          {stage === 'failed' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Payment Failed</span>
            </span>
          )}
          {(stage === 'initiating' || stage === 'processing' || stage === 'awaiting') && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-[#0066FF] border border-blue-200 shadow-2xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting Gateway</span>
            </span>
          )}
        </div>
      </div>

      {/* ======================= VIEW A: INITIATING / AWAITING ======================= */}
      {(stage === 'initiating' || stage === 'awaiting' || stage === 'processing') && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl text-center space-y-7 max-w-2xl mx-auto">
          {/* Circular Progress Indicator */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-4 border-[#0066FF] border-t-transparent animate-spin" />
            <div className="text-center">
              <Zap className="w-5 h-5 text-[#0066FF] mx-auto fill-current animate-pulse" />
              <span className="text-xs font-black font-mono text-slate-900 mt-0.5 block">{prepProgress}%</span>
            </div>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-[#0066FF] text-xs font-bold font-mono">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{prepStepText}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-heading">
              {stage === 'processing' ? 'Confirming Payment Capture...' : 'Launching Secure Payment Gateway...'}
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              The Razorpay payment dialog is opening. Please complete your transaction to finalize the order.
            </p>
          </div>

          {/* Quick Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-left max-w-md mx-auto">
            <div className="flex justify-between items-center text-slate-700 font-medium">
              <span>Electronics Items Reserved:</span>
              <span className="font-bold text-slate-900">{order.items?.length || 1} Products</span>
            </div>
            <div className="flex justify-between items-center text-slate-700 font-medium">
              <span>Total Payable:</span>
              <span className="font-mono font-black text-[#0066FF]">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {stage === 'awaiting' && (
            <button
              type="button"
              onClick={launchRazorpay}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] text-xs font-bold border border-blue-200 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-open Payment Gateway</span>
            </button>
          )}
        </div>
      )}

      {/* ======================= VIEW B: SUCCESS CONFIRMATION ======================= */}
      {stage === 'success' && (
        <div className="space-y-6">
          {/* Celebratory Banner with Smooth Emerald Glow */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/90 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
              <span className="absolute -inset-1 rounded-2xl border border-emerald-400/40 animate-pulse [animation-duration:3s] pointer-events-none" />
              <CheckCircle2 className="w-8 h-8 relative z-10 transition-transform duration-700 ease-in-out hover:scale-105" />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                Thank you for your order!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Your order is confirmed and is being prepared for express delivery.
              </p>
              {paymentId && (
                <p className="text-[11px] font-mono text-emerald-700 font-bold pt-0.5">
                  Payment Reference: {paymentId}
                </p>
              )}
            </div>
          </div>

          {/* Balanced 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Ordered Items & Financial Breakdown (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Package className="w-4 h-4 text-[#0066FF]" />
                    <span>Ordered Items</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0)} items
                  </span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.thumbnail || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&q=80'}
                          alt={item.title}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</p>
                          <p className="text-[11px] text-slate-500">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-900 shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs mt-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">₹{order.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18% Included):</span>
                  <span className="font-mono font-bold text-slate-900">₹{order.tax?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Express Delivery:</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Amount Paid:</span>
                  <span className="font-mono text-base text-[#0066FF] font-black">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Delivery Info & Actions (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-6">
              {/* Delivery Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-[#0066FF]" />
                    <span>Delivery Destination</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Express Dispatch
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-900 text-sm">{order.customerDetails?.name}</p>
                  <p className="text-slate-600 leading-relaxed">{order.customerDetails?.address?.street}</p>
                  <p className="text-slate-600">{order.customerDetails?.address?.city}, {order.customerDetails?.address?.state} - {order.customerDetails?.address?.pincode}</p>
                  <p className="text-slate-500 font-mono pt-1 text-[11px]">+91 {order.customerDetails?.phone}</p>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100/80 flex items-center gap-2.5 text-xs text-[#0066FF] font-semibold">
                  <Truck className="w-4 h-4 text-[#0066FF] shrink-0" />
                  <span>Bluedart Air Express • Delivery in 24–48 Hours</span>
                </div>
              </div>

              {/* Action Hub */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    navigate('/orders', { replace: true });
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#0066FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-md shadow-blue-500/20"
                >
                  <span>Track Order in My Orders</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/products"
                  className="w-full py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition text-center block shadow-2xs"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= VIEW C: PAYMENT FAILED / INCOMPLETE ======================= */}
      {stage === 'failed' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Payment Resolution Panel (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            
            {/* Clean Status Alert Banner */}
            <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-950">
                  Payment Was Not Completed
                </h3>
                <p className="text-xs text-rose-800 leading-relaxed font-medium">
                  {failureReason || 'The transaction window was closed or interrupted before authorization. No money was deducted from your account.'}
                </p>
              </div>
            </div>

            {/* REVIVEPAY AI RECOVERY AGENT CARD */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/80 shadow-xs space-y-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0066FF] text-white text-[11px] font-bold shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>RevivePay AI Recovery</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Autonomous Protection
                </span>
              </div>

              {isAnalyzingRevivePay ? (
                <div className="py-3 flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0066FF]" />
                  <span>RevivePay AI is analyzing payment telemetry & evaluating recovery route...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                    {revivePayCase?.customerMessage ||
                      'The bank gateway experienced a temporary timeout. You can instantly resume and complete your order with 1-click retry or generate a direct payment link.'}
                  </p>

                  {revivePayCase?.lastRecommendedAction && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/70 text-[#0066FF] text-[11px] font-bold">
                      <span>✓ Recommended Step:</span>
                      <span>{getCustomerFriendlyAction(revivePayCase.lastRecommendedAction)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* USER-APPROVED PAYMENT LINK SECTION - ONLY SHOWN WHEN RECOMMENDED OR ALREADY GENERATED */}
              {revivePayCase?.razorpayPaymentLinkUrl ? (
                <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#0066FF]" />
                      <span>Razorpay Direct Payment Link Active</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Ready
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={revivePayCase.razorpayPaymentLinkUrl}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 shrink-0 transition cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <a
                      href={revivePayCase.razorpayPaymentLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <span>Open Secure Razorpay Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    ⚡ You can pay via UPI, Cards, or NetBanking on any device. Once paid, this page will automatically confirm your order.
                  </p>
                </div>
              ) : (revivePayCase?.promptUserForLink || revivePayCase?.lastRecommendedAction === 'suggest_payment_link') ? (
                <div className="p-3.5 rounded-2xl bg-white/80 border border-blue-100 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Having trouble with popup checkout?</p>
                      <p className="text-[11px] text-slate-500">Generate a direct Razorpay payment link / UPI QR code to complete this purchase.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGeneratePaymentLink}
                      disabled={isGeneratingLink}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isGeneratingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                      <span>{isGeneratingLink ? 'Generating...' : 'Create Payment Link'}</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => setShowRetryConfirm(true)}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Payment with Razorpay</span>
              </button>

              <button
                type="button"
                onClick={handleCompleteCOD}
                className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Switch to Pay on Delivery (COD)</span>
              </button>
            </div>

            {/* Trust Assurance Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800 pb-1 border-b border-slate-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Buyer Protection Guarantee</span>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                <li>Your selected items are temporarily reserved.</li>
                <li>Encrypted 256-bit bank grade transaction security.</li>
                <li>Full support & immediate receipt upon completion.</li>
              </ul>
            </div>

            {/* Smart Back Navigation Option */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={handleSmartBack}
                className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{location.state?.from === 'orders' ? 'Return to Orders' : 'Modify Items in Cart'}</span>
              </button>

              <Link
                to="/products"
                className="text-[#0066FF] hover:underline font-semibold"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary & Financials (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#0066FF]" />
                <span>Order Summary</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-500">
                {order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0)} items
              </span>
            </div>

            {/* Item Thumbnails Preview */}
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.thumbnail || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&q=80'}
                      alt={item.title}
                      className="w-11 h-11 rounded-xl object-cover bg-slate-50 border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900 shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">₹{order.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated GST (18%):</span>
                <span className="font-mono font-bold text-slate-900">₹{order.tax?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Express Delivery:</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="font-mono text-base text-[#0066FF] font-black">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Shipping Destination Pill */}
            {order.customerDetails?.address && (
              <div className="text-[11px] text-slate-500 flex items-start gap-2 pt-1">
                <MapPin className="w-3.5 h-3.5 text-[#0066FF] shrink-0 mt-0.5" />
                <span>
                  Shipping to: <strong className="text-slate-800">{order.customerDetails.name}</strong>, {order.customerDetails.address.city}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal Before Retrying Payment */}
      {showRetryConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 font-poppins">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200 shadow-sm">
              <RefreshCw className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                Retry Order Payment?
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                You are about to launch a secure checkout session for order <strong className="text-slate-900 font-mono">#{order.orderId}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
              <span className="text-slate-600 font-medium">Total Payable:</span>
              <span className="font-black text-[#0066FF] font-mono text-sm">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowRetryConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRetryConfirm(false);
                  razorpayLaunchedRef.current = false;
                  setStage('initiating');
                  setPrepProgress(25);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OrderProcessingPage;
