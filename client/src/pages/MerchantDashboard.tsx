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
  Settings
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

  // Product Studio Modal states
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [selectedEditingProduct, setSelectedEditingProduct] = useState<Product | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, productsData, ordersData] = await Promise.all([
        api.getMerchantStats(),
        api.getProducts({ limit: 50 }),
        api.getMerchantOrders()
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
          const roleData = await api.checkUserRole(user.id, user.primaryEmailAddress?.emailAddress);
          if (!roleData || (!roleData.isMerchant && roleData.role !== 'merchant')) {
            showToast('This action is not possible. Customer accounts cannot access the Merchant Portal.', 'error');
            navigate('/', { replace: true });
            return;
          }

          const profileData = await api.getMerchantProfile(user.id, {
            email: user.primaryEmailAddress?.emailAddress || '',
            fullName: user.fullName || ''
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
            <span>Store Profile & Settings</span>
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
            <span>Products & Inventory ({products.length})</span>
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

      {/* Tab 1: Products Inventory */}
      {activeTab === 'products' && (
        <div className="bg-white/50 backdrop-blur-2xl rounded-3xl border border-white/70 shadow-2xl shadow-blue-500/10 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#0066FF]" />
              <span>Loading inventory...</span>
            </div>
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Product</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5">Stock</th>
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
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (p.stockCount || 10) > 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {p.inStock ? `${p.stockCount || 10} units` : 'Out of Stock'}
                        </span>
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
            <div className="py-16 text-center text-slate-500 text-xs">
              No products found in store catalog.
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
                    <th className="px-4 py-3.5">Items</th>
                    <th className="px-4 py-3.5">Total Amount</th>
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-6 py-3.5 text-right">Status Action</th>
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
                        <span className="font-semibold text-slate-800">{o.items?.length || 0} electronics items</span>
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
                        <select
                          value={o.paymentStatus}
                          onChange={(e) => handleUpdateOrderStatus(o.orderId, e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 outline-none"
                        >
                          <option value="paid">Paid & Verified</option>
                          <option value="pending">Pending</option>
                          <option value="shipped">Dispatched (Express)</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">
              No merchant orders yet.
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
