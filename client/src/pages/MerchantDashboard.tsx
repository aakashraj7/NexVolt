import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  CheckCircle2,
  Loader2,
  Zap,
  Settings,
  Eye,
  X,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { api } from '../lib/api';
import type { Product, Order } from '../types';
import { useToast } from '../context/ToastContext';
import { ProductStudioModal } from '../components/merchant/ProductStudioModal';

export const MerchantDashboard: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'recovery'>(
    tabParam === 'orders' || tabParam === 'recovery' ? tabParam : 'products'
  );

  useEffect(() => {
    if (tabParam === 'orders' || tabParam === 'recovery' || tabParam === 'products') {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Order Details Modal state
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Product Studio Modal states
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [selectedEditingProduct, setSelectedEditingProduct] = useState<Product | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [statsData, productsData, ordersData] = await Promise.all([
        api.getMerchantStats(user.id),
        api.getMerchantProducts(user.id, { limit: 50 }),
        api.getMerchantOrders({ merchantId: user.id })
      ]);

      if (statsData) setStats(statsData);
      if (productsData?.products) setProducts(productsData.products);
      if (ordersData) setOrders(ordersData);
    } catch (err) {
      console.error('Error loading merchant dashboard data:', err);
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
      const checkMerchantOnboarding = async () => {
        try {
          const isGoogle = user.externalAccounts && user.externalAccounts.some((acc: any) =>
            acc.provider === 'google' || acc.provider === 'oauth_google' || acc.verification?.strategy === 'oauth_google'
          );
          const authProvider = isGoogle ? 'google' : 'email_password';

          const roleData = await api.checkUserRole(user.id, user.primaryEmailAddress?.emailAddress, authProvider);
          if (!roleData || (!roleData.isMerchant && roleData.role !== 'merchant')) {
            showToast('This action is not possible. Customer accounts cannot access the Merchant Portal.', 'error');
            navigate('/', { replace: true });
            return;
          }

          const profileData = await api.getMerchantProfile(user.id, {
            email: user.primaryEmailAddress?.emailAddress || '',
            fullName: user.fullName || '',
            provider: authProvider,
            authProvider
          });
          if (profileData && profileData.merchantProfile) {
            if (!profileData.merchantProfile.onboardingCompleted) {
              navigate('/merchant/onboarding');
              return;
            }
          }
        } catch (err) {
          console.warn('Merchant profile check error:', err);
        }
        loadData();
      };

      checkMerchantOnboarding();
    }
  }, [isLoaded, isSignedIn, user]);

  const handleOpenAddProduct = () => {
    setSelectedEditingProduct(null);
    setShowStudioModal(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setSelectedEditingProduct(p);
    setShowStudioModal(true);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from store catalog?`)) {
      try {
        await api.deleteMerchantProduct(id);
        showToast('Product deleted from store', 'info');
        setProducts(prev => prev.filter(p => p._id !== id));
      } catch {
        showToast('Error deleting product', 'error');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, paymentStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, paymentStatus);
      showToast(`Order status updated to ${paymentStatus}`, 'success');
      loadData();
    } catch {
      showToast('Failed to update order status', 'error');
    }
  };

  const abandonedCheckouts = orders.filter(o => o.checkoutStatus === 'abandoned');
  const recoveredOrders = orders.filter(o => o.checkoutStatus === 'recovered');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0066FF] border border-blue-200">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-poppins tracking-tight">
                NexVolt Merchant Hub
              </h1>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                Logged in as <strong className="text-slate-800 font-semibold">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/merchant/profile"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-[#0066FF] border border-slate-300 hover:border-[#0066FF] font-bold text-xs shadow-xs transition flex items-center gap-2 font-poppins"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Personal & Store Settings</span>
          </Link>

          <button
            onClick={handleOpenAddProduct}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer font-poppins"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
          <Link
            to="/products"
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 font-bold text-xs shadow-xs transition font-poppins"
          >
            View Live Store
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white/50 backdrop-blur-2xl rounded-2xl p-5 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold font-poppins">
            <span>Total Gross Revenue</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹{stats?.totalRevenue ? stats.totalRevenue.toLocaleString('en-IN') : '0'}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 font-poppins">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Razorpay verified payouts
          </p>
        </div>

        <div className="bg-white/50 backdrop-blur-2xl rounded-2xl p-5 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold font-poppins">
            <span>Customer Orders</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0066FF]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {stats?.totalOrders || orders.length}
          </p>
          <p className="text-[11px] text-slate-500 font-poppins font-medium">
            {stats?.completedOrders || 0} completed & dispatched
          </p>
        </div>

        <div className="bg-white/50 backdrop-blur-2xl rounded-2xl p-5 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold font-poppins">
            <span>Active Products</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {products.length}
          </p>
          <p className="text-[11px] text-slate-500 font-poppins font-medium">
            In store catalog & search index
          </p>
        </div>

        <div className="bg-white/50 backdrop-blur-2xl rounded-2xl p-5 border border-purple-200/70 shadow-2xl shadow-purple-500/10 space-y-1">
          <div className="flex items-center justify-between text-purple-700 text-xs font-bold font-poppins">
            <span>AI Recovered Sales</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-purple-900 font-mono">
            ₹{stats?.recoveredRevenue ? stats.recoveredRevenue.toLocaleString('en-IN') : '0'}
          </p>
          <p className="text-[11px] text-purple-700 font-bold font-poppins">
            Track 3 AI Revenue Agent Active
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-8 text-sm font-bold font-poppins">
          <button
            onClick={() => {
              setActiveTab('products');
              setSearchParams({ tab: 'products' });
            }}
            className={`pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'products'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Store Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('orders');
              setSearchParams({ tab: 'orders' });
            }}
            className={`pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Store Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('recovery');
              setSearchParams({ tab: 'recovery' });
            }}
            className={`pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'recovery'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Revenue Recovery Agent</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Products Catalog */}
      {activeTab === 'products' && (
        <div className="bg-white/50 backdrop-blur-2xl rounded-3xl border border-white/70 shadow-2xl shadow-blue-500/10 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#0066FF]" />
              <span>Loading products...</span>
            </div>
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Product</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5">Rating</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={p.thumbnail}
                          alt={p.title}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <Link to={`/products/${p.slug}`} className="font-bold text-slate-900 hover:text-[#0066FF] block truncate max-w-xs font-poppins">
                            {p.title}
                          </Link>
                          <span className="text-[10px] uppercase font-bold text-[#0066FF] font-poppins">{p.brand}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">{p.category}</td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-900">
                        ₹{p.price.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 font-bold text-amber-600">
                        ★ {p.rating}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#0066FF] text-slate-600 transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id, p.title)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200/80 shadow-md">
                <Package className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 font-poppins">No Products in Your Catalog Yet</h3>
                <p className="text-xs text-slate-500 font-medium">
                  As a newly registered NexVolt merchant, publish your first electronics listing to make it immediately visible to verified buyers across India.
                </p>
              </div>
              <button
                onClick={handleOpenAddProduct}
                className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer font-poppins"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Product</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Store Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white/50 backdrop-blur-2xl rounded-3xl border border-white/70 shadow-2xl shadow-blue-500/10 overflow-hidden">
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Order ID</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Items Ordered</th>
                    <th className="px-4 py-3.5">Total Amount</th>
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.map((o) => (
                    <tr key={o.orderId} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {o.orderId}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{o.customerDetails?.name || 'Customer'}</p>
                        <p className="text-[11px] text-slate-500">{o.customerDetails?.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {o.items?.slice(0, 3).map((item: any, idx: number) => (
                              <img
                                key={idx}
                                src={item.thumbnail || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&q=80'}
                                alt={item.title}
                                title={`${item.title} (x${item.quantity})`}
                                className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200 shadow-2xs shrink-0"
                              />
                            ))}
                            {o.items && o.items.length > 3 && (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                +{o.items.length - 3} more
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-semibold text-slate-800 line-clamp-1 max-w-[220px]">
                            {o.items?.map(i => `${i.quantity}x ${i.title}`).join(', ')}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-900">
                        ₹{o.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          o.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(o)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                            title="View Full Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                          <select
                            value={o.paymentStatus}
                            onChange={(e) => handleUpdateOrderStatus(o.orderId, e.target.value)}
                            className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none font-medium cursor-pointer"
                          >
                            <option value="paid">Paid & Verified</option>
                            <option value="pending">Pending</option>
                            <option value="shipped">Dispatched (Express)</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 font-poppins">No Store Orders Received Yet</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Whenever a customer places an order for your electronics items, the full shipping details and order items will appear here for you to fulfill.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Track 3 AI Revenue Recovery Hub */}
      {activeTab === 'recovery' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white space-y-3 shadow-xl shadow-blue-950/20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-bold uppercase font-poppins">
              <Zap className="w-3.5 h-3.5" /> Razorpay Buildathon Track 3: AI Revenue Recovery Agent
            </div>
            <h2 className="text-2xl font-extrabold font-poppins">
              Autonomous AI Cart & Checkout Abandonment Recovery
            </h2>
            <p className="text-blue-200 text-xs leading-relaxed max-w-2xl">
              Our intelligent agent detects when shoppers drop off at the Razorpay checkout stage, calculates personalized time-sensitive incentive vouchers, and recovers otherwise lost electronics sales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Abandoned Checkouts */}
            <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-6 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center justify-between font-poppins">
                <span>Abandoned Checkout Sessions</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-mono">
                  {abandonedCheckouts.length} Active
                </span>
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {abandonedCheckouts.length > 0 ? (
                  abandonedCheckouts.map((o) => (
                    <div key={o.orderId} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 font-mono">{o.orderId}</p>
                        <p className="text-slate-500 text-[11px]">{o.customerDetails?.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 font-mono">₹{o.totalAmount?.toLocaleString('en-IN')}</span>
                        <span className="block text-[10px] text-amber-600 font-semibold font-poppins">Drop-off detected</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">No abandoned checkouts currently pending.</p>
                )}
              </div>
            </div>

            {/* Recovered Orders */}
            <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-6 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center justify-between font-poppins">
                <span>AI Recovered Orders</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono">
                  {recoveredOrders.length} Recovered
                </span>
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {recoveredOrders.length > 0 ? (
                  recoveredOrders.map((o) => (
                    <div key={o.orderId} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 font-mono">{o.orderId}</p>
                        <p className="text-slate-500 text-[11px]">{o.customerDetails?.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700 font-mono">₹{o.totalAmount?.toLocaleString('en-IN')}</span>
                        <span className="block text-[10px] text-emerald-600 font-bold font-poppins">Revenue Saved by AI</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">AI recovery agent actively monitoring customer sessions.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Full Breakdown & Customer Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 font-poppins">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Order Details</span>
                <h2 className="text-xl font-black text-slate-900 font-heading flex items-center gap-2">
                  <span>{selectedOrderDetails.orderId}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    selectedOrderDetails.paymentStatus === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {selectedOrderDetails.paymentStatus}
                  </span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Shipping & Contact Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0066FF]" />
                <span>Customer Shipping Information</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedOrderDetails.customerDetails?.name || 'Customer'}</p>
                  <p className="flex items-center gap-1 text-slate-500 pt-0.5"><Mail className="w-3 h-3 text-slate-400" /> {selectedOrderDetails.customerDetails?.email}</p>
                  {selectedOrderDetails.customerDetails?.phone && (
                    <p className="flex items-center gap-1 text-slate-500 font-mono"><Phone className="w-3 h-3 text-slate-400" /> +91 {selectedOrderDetails.customerDetails?.phone}</p>
                  )}
                </div>
                <div className="border-t sm:border-t-0 sm:border-l sm:border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                  <p className="font-bold text-slate-700">Delivery Address:</p>
                  <p>{selectedOrderDetails.customerDetails?.address?.street || 'N/A'}</p>
                  <p>{selectedOrderDetails.customerDetails?.address?.city}, {selectedOrderDetails.customerDetails?.address?.state} - {selectedOrderDetails.customerDetails?.address?.pincode}</p>
                </div>
              </div>
            </div>

            {/* Ordered Products Itemized List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Ordered Products ({selectedOrderDetails.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0} units)</span>
                <span className="font-mono text-[#0066FF]">Payment: {selectedOrderDetails.paymentMethod || 'Razorpay'}</span>
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {selectedOrderDetails.items?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.thumbnail || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&q=80'}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</p>
                        <p className="text-[11px] text-slate-500 font-medium">Unit Price: ₹{item.price?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-500">Qty: {item.quantity}</span>
                      <p className="text-xs font-black font-mono text-slate-900">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials & Status Controls */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5 text-xs text-slate-600">
                <div className="flex justify-between gap-6"><span>Subtotal:</span> <span className="font-mono font-bold text-slate-900">₹{selectedOrderDetails.subtotal?.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between gap-6"><span>GST (18%):</span> <span className="font-mono font-bold text-slate-900">₹{selectedOrderDetails.tax?.toLocaleString('en-IN') || 0}</span></div>
                <div className="flex justify-between gap-6"><span>Express Shipping:</span> <span className="font-bold text-emerald-600">FREE</span></div>
                <div className="flex justify-between gap-6 font-bold text-slate-900 pt-1 border-t border-blue-200 text-sm">
                  <span>Total Paid Amount:</span> <span className="font-mono text-[#0066FF] font-black">₹{selectedOrderDetails.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="w-full sm:w-auto space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">Update Fulfillment Status:</label>
                <select
                  value={selectedOrderDetails.paymentStatus}
                  onChange={(e) => {
                    handleUpdateOrderStatus(selectedOrderDetails.orderId, e.target.value);
                    setSelectedOrderDetails({ ...selectedOrderDetails, paymentStatus: e.target.value as any });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none cursor-pointer shadow-2xs"
                >
                  <option value="paid">Paid & Verified (Preparing)</option>
                  <option value="pending">Pending</option>
                  <option value="shipped">Dispatched (Express)</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>

            {/* Close Action */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Order Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Publishing Studio Modal (Multi-Image Cloudinary & URL, Reordering, Live Customer Store Preview) */}
      <ProductStudioModal
        isOpen={showStudioModal}
        onClose={() => {
          setShowStudioModal(false);
          setSelectedEditingProduct(null);
        }}
        onSuccess={loadData}
        editingProduct={selectedEditingProduct}
      />
    </div>
  );
};
