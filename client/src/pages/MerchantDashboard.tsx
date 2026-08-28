import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import {
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  Loader2,
  Zap,
  Settings,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { api } from '../lib/api';
import type { Product, Order } from '../types';
import { useToast } from '../context/ToastContext';

export const MerchantDashboard: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'recovery' | 'settings'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Danger Zone Deactivation states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateConfirmText, setDeactivateConfirmText] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Product Add / Edit Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Smartphones');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stockCount, setStockCount] = useState('15');
  const [thumbnail, setThumbnail] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Filter state for orders & products
  const [searchTerm, setSearchTerm] = useState('');

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
            setMerchantProfile(profileData.merchantProfile);
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

  const handleConfirmStoreDeactivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || deactivateConfirmText.trim().toUpperCase() !== 'DELETE') {
      showToast('Please type DELETE to confirm deactivation.', 'error');
      return;
    }

    try {
      setIsDeactivating(true);
      await api.deactivateMerchantAccount(user.id);
      showToast('Your Merchant Storefront has been completely deactivated.', 'success');
      setShowDeactivateModal(false);
      await signOut();
      navigate('/');
    } catch (err: any) {
      console.error('Merchant deactivation error:', err);
      showToast('Failed to deactivate merchant storefront.', 'error');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setTitle('');
    setBrand('');
    setCategory('Smartphones');
    setPrice('');
    setOriginalPrice('');
    setStockCount('15');
    setThumbnail('');
    setShortDescription('');
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProductId(p._id);
    setTitle(p.title);
    setBrand(p.brand);
    setCategory(p.category);
    setPrice(p.price.toString());
    setOriginalPrice(p.originalPrice.toString());
    setStockCount((p.stockCount || 10).toString());
    setThumbnail(p.thumbnail);
    setShortDescription(p.shortDescription || '');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !brand || !price || !thumbnail) {
      showToast('Please fill in required product fields.', 'error');
      return;
    }

    try {
      setIsSubmittingProduct(true);
      const productPayload = {
        title,
        brand,
        category,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : Number(price),
        stockCount: Number(stockCount),
        thumbnail,
        images: [thumbnail],
        shortDescription,
        highlights: ['Certified Brand Warranty', 'Express Dispatch Eligible']
      };

      if (editingProductId) {
        await api.updateMerchantProduct(editingProductId, productPayload);
        showToast('Product updated successfully!', 'success');
      } else {
        await api.createMerchantProduct(productPayload);
        showToast('New product published to store!', 'success');
      }

      setShowProductModal(false);
      loadData();
    } catch (err) {
      showToast('Failed to save product.', 'error');
    } finally {
      setIsSubmittingProduct(false);
    }
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

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                NexVolt Merchant Hub
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Logged in as <strong className="text-slate-800">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddProduct}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
          <Link
            to="/products"
            className="px-4 py-2.5 rounded-xl bg-white text-slate-700 hover:text-slate-900 border border-slate-300 font-bold text-xs shadow-xs transition"
          >
            View Live Store
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Gross Revenue</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹{stats?.totalRevenue ? stats.totalRevenue.toLocaleString('en-IN') : '0'}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Razorpay verified payouts
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Customer Orders</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0066FF]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {stats?.totalOrders || orders.length}
          </p>
          <p className="text-[11px] text-slate-500">
            {stats?.completedOrders || 0} completed & dispatched
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Products</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {products.length}
          </p>
          <p className="text-[11px] text-slate-500">
            In store catalog & search index
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-purple-700 text-xs font-bold">
            <span>AI Recovered Sales</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-purple-900 font-mono">
            ₹{stats?.recoveredRevenue ? stats.recoveredRevenue.toLocaleString('en-IN') : '0'}
          </p>
          <p className="text-[11px] text-purple-700 font-bold">
            Track 3 AI Revenue Agent Active
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-8 text-sm font-bold">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products & Inventory ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Store Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'recovery'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Revenue Recovery Agent</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-rose-600'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Store Settings & Danger Zone</span>
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search in ${activeTab}...`}
            className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-[#0066FF] shadow-xs"
          />
        </div>
      </div>

      {/* Tab 1: Products Inventory */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#0066FF]" />
              <span>Loading inventory...</span>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
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
                  {filteredProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={p.thumbnail}
                          alt={p.title}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <Link to={`/products/${p.slug}`} className="font-bold text-slate-900 hover:text-[#0066FF] block truncate max-w-xs">
                            {p.title}
                          </Link>
                          <span className="text-[10px] uppercase font-bold text-[#0066FF]">{p.brand}</span>
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
                            className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#0066FF] text-slate-600 transition"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id, p.title)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
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
              No products found matching your search.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Store Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
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
                  {filteredOrders.map((o) => (
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
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white space-y-3 shadow-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-bold uppercase">
              <Zap className="w-3.5 h-3.5" /> Razorpay Buildathon Track 3: AI Revenue Recovery Agent
            </div>
            <h2 className="text-2xl font-extrabold font-heading">
              Autonomous AI Cart & Checkout Abandonment Recovery
            </h2>
            <p className="text-blue-200 text-xs leading-relaxed max-w-2xl">
              Our intelligent agent detects when shoppers drop off at the Razorpay checkout stage, calculates personalized time-sensitive incentive vouchers, and recovers otherwise lost electronics sales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Abandoned Checkouts */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Abandoned Checkout Sessions</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-mono">
                  {abandonedCheckouts.length} Active
                </span>
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {abandonedCheckouts.length > 0 ? (
                  abandonedCheckouts.map((o) => (
                    <div key={o.orderId} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 font-mono">{o.orderId}</p>
                        <p className="text-slate-500 text-[11px]">{o.customerDetails?.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 font-mono">₹{o.totalAmount?.toLocaleString('en-IN')}</span>
                        <span className="block text-[10px] text-amber-600 font-semibold">Drop-off detected</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">No abandoned checkouts currently pending.</p>
                )}
              </div>
            </div>

            {/* Recovered Orders */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
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
                        <span className="block text-[10px] text-emerald-600 font-bold">Revenue Saved by AI</span>
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

      {/* Tab 4: Store Settings & Danger Zone */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Store Overview Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Seller Storefront Information</h3>
              <p className="text-slate-500 text-xs mt-0.5">Your official business profile, certified categories, and dispatch hubs.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Store Brand Name</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{merchantProfile?.storeName || user?.fullName || 'NexVolt Seller'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Primary Category</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{merchantProfile?.category || 'Consumer Electronics'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">GSTIN / Tax ID</span>
                <p className="text-sm font-mono font-bold text-slate-900 mt-1">{merchantProfile?.gstin || '29ABCDE1234F1Z5'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Support Business Email</span>
                <p className="text-xs font-semibold text-slate-900 mt-1 truncate">{merchantProfile?.supportEmail || user?.primaryEmailAddress?.emailAddress}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Business Phone</span>
                <p className="text-xs font-semibold text-slate-900 mt-1">{merchantProfile?.businessPhone || '+91 98765 43210'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Dispatch Warehouses</span>
                <p className="text-xs font-bold text-slate-900 mt-1">{merchantProfile?.warehouses?.length || 1} Active Location(s)</p>
              </div>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="bg-rose-50/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xl shadow-rose-500/5 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-rose-900">Danger Zone</h3>
                <p className="text-rose-700 text-xs mt-1 leading-relaxed">
                  Permanently deactivate your merchant storefront and delete your seller business privileges from NexVolt.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 border border-rose-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Deactivate Seller Storefront</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    This will permanently remove your seller store, delist your products from the NexVolt catalog, and cancel active inventory integrations.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDeactivateConfirmText('');
                    setShowDeactivateModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Deactivate Storefront</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-toast-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Confirm Store Deactivation</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              This action is <strong className="text-rose-600">permanent and irreversible</strong>. Your electronics listings, seller analytics, and merchant badge will be wiped from the platform.
            </p>

            <form onSubmit={handleConfirmStoreDeactivation} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Type <span className="font-mono text-rose-600 font-extrabold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deactivateConfirmText}
                  onChange={(e) => setDeactivateConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono tracking-wider outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeactivateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeactivating || deactivateConfirmText.trim().toUpperCase() !== 'DELETE'}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeactivating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deactivating...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Deactivate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowProductModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 font-heading mb-4">
              {editingProductId ? 'Edit Product Details' : 'Publish New Electronics Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sony WH-1000XM5 Noise Canceling Headphones"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Sony, Apple, Samsung"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  >
                    <option value="Smartphones">Smartphones</option>
                    <option value="Laptops & Computers">Laptops & Computers</option>
                    <option value="Audio & Headphones">Audio & Headphones</option>
                    <option value="Smartwatches & Wearables">Smartwatches & Wearables</option>
                    <option value="Gaming & VR">Gaming & VR</option>
                    <option value="Cameras & Drones">Cameras & Drones</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sale Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="29990"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="34990"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={stockCount}
                    onChange={(e) => setStockCount(e.target.value)}
                    placeholder="15"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Image URL *</label>
                <input
                  type="url"
                  required
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Key specs, processor, battery life and flagship advantages..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow transition"
                >
                  {isSubmittingProduct ? 'Saving...' : editingProductId ? 'Update Product' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
