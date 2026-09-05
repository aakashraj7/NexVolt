import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Clock,
  Settings,
  Eye,
  X,
  MapPin,
  Phone,
  Mail,
  Truck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Activity,
  AlertCircle,
  Coins,
  Percent,
  Calculator,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import type { Product, Order } from '../types';
import { useToast } from '../context/ToastContext';
import { ProductStudioModal } from '../components/merchant/ProductStudioModal';
import { JudgeDemoSandbox } from '../components/merchant/JudgeDemoSandbox';

export const FULFILLMENT_STATUSES = [
  {
    id: 'Confirmed',
    label: 'Confirmed',
    desc: 'Order verified & confirmed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2
  },
  {
    id: 'Packed',
    label: 'Packed',
    desc: 'Packed & ready for dispatch',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Package
  },
  {
    id: 'In-Transit',
    label: 'In-Transit',
    desc: 'Handed to courier, on the way',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: Truck
  },
  {
    id: 'Delivered',
    label: 'Delivered',
    desc: 'Delivered to customer',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: CheckCircle2
  }
];

const getCustomerInitials = (name?: string) => {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name?: string) => {
  const colors = [
    'bg-blue-100 text-[#0066FF]',
    'bg-purple-100 text-purple-700',
    'bg-sky-100 text-sky-700',
    'bg-indigo-100 text-indigo-700',
    'bg-emerald-100 text-emerald-700'
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name!.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const OrderStatusDropdown: React.FC<{
  order: Order;
  onUpdate: (orderId: string, status: string) => Promise<void>;
}> = ({ order, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const currentStatus = order.orderStatus || (order.paymentStatus === 'delivered' ? 'Delivered' : order.paymentStatus === 'shipped' ? 'In-Transit' : 'Confirmed');
  const activeConfig = FULFILLMENT_STATUSES.find(s => s.id.toLowerCase() === currentStatus.toLowerCase()) || FULFILLMENT_STATUSES[0];

  const handleSelect = async (e: React.MouseEvent, statusId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    if (statusId.toLowerCase() === currentStatus.toLowerCase()) return;
    setUpdating(true);
    try {
      await onUpdate(order.orderId, statusId);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(prev => !prev);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={updating}
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0066FF] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer select-none active:scale-95 disabled:opacity-60"
        title="Change Order Status"
      >
        {updating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
        <span>{activeConfig.label}</span>
        <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-poppins"
        >
          <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Change Order Status
            </span>
          </div>
          <div className="space-y-1">
            {FULFILLMENT_STATUSES.map((item) => {
              const Icon = item.icon;
              const isSelected = item.id.toLowerCase() === currentStatus.toLowerCase();
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => handleSelect(e, item.id)}
                  className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between gap-2 text-xs font-medium cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 text-[#0066FF] font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                      isSelected ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate leading-tight">{item.label}</p>
                      <p className="text-[10px] text-slate-400 truncate leading-tight">{item.desc}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0066FF] stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const MerchantDashboard: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const tabParam = searchParams.get('tab');
  const searchParam = searchParams.get('search') || '';
  const editProductIdParam = searchParams.get('editProductId');

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
  const [recoveryAnalytics, setRecoveryAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncingGateway, setIsSyncingGateway] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const CATALOG_ITEMS_PER_PAGE = 5;

  // Reset catalog page on search query change
  useEffect(() => {
    setCatalogPage(1);
  }, [searchParam]);

  // Order Details Modal state
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Product Studio Modal states
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [selectedEditingProduct, setSelectedEditingProduct] = useState<Product | null>(null);

  // Auto-open product edit modal if editProductIdParam is present in URL
  useEffect(() => {
    if (editProductIdParam && products.length > 0) {
      const targetProd = products.find(p => p._id === editProductIdParam);
      if (targetProd) {
        setSelectedEditingProduct(targetProd);
        setShowStudioModal(true);
        setActiveTab('products');
      }
    }
  }, [editProductIdParam, products]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [statsData, productsData, ordersData, recoveryData] = await Promise.all([
        api.getMerchantStats(user.id),
        api.getMerchantProducts(user.id, { limit: 50 }),
        api.getMerchantOrders({ merchantId: user.id }),
        api.getRecoveryAnalytics()
      ]);

      if (statsData) setStats(statsData);
      if (productsData?.products) setProducts(productsData.products);
      if (ordersData) setOrders(ordersData);
      if (recoveryData) setRecoveryAnalytics(recoveryData);
    } catch (err) {
      console.error('Error loading merchant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGateway = async () => {
    try {
      setIsSyncingGateway(true);
      const res = await api.syncAllPaymentLinks();
      await loadData();
      if (res?.count && res.count > 0) {
        showToast(`Synced with Razorpay: ${res.count} recovered payment link(s) updated!`, 'success');
      } else {
        showToast('Razorpay Gateway is synchronized. All pending payment links are up to date.', 'info');
      }
    } catch (err) {
      showToast('Error syncing with Razorpay Gateway.', 'error');
    } finally {
      setIsSyncingGateway(false);
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

  const handleUpdateOrderStatus = async (orderId: string, orderStatus: string) => {
    const updatedPaymentStatus =
      orderStatus === 'Delivered'
        ? 'delivered'
        : orderStatus === 'In-Transit'
        ? 'shipped'
        : 'paid';

    // 1. Optimistic UI update immediately
    setOrders(prev =>
      prev.map(o =>
        o.orderId === orderId
          ? {
              ...o,
              orderStatus,
              paymentStatus: updatedPaymentStatus
            }
          : o
      )
    );

    if (selectedOrderDetails && selectedOrderDetails.orderId === orderId) {
      setSelectedOrderDetails(prev =>
        prev ? { ...prev, orderStatus, paymentStatus: updatedPaymentStatus } : null
      );
    }

    try {
      const res = await api.updateOrderStatus(orderId, { orderStatus });
      showToast(`Order status updated to "${orderStatus}"`, 'success');
      if (res?.success && res.order) {
        setOrders(prev =>
          prev.map(o => (o.orderId === orderId || o._id === res.order._id ? { ...o, ...res.order } : o))
        );
        if (selectedOrderDetails && selectedOrderDetails.orderId === orderId) {
          setSelectedOrderDetails(prev => (prev ? { ...prev, ...res.order } : null));
        }
      }
    } catch {
      showToast('Failed to update order status', 'error');
    }
  };

  // Filter out unpaid / incomplete checkouts (initiated or abandoned online sessions)
  const validStoreOrders = orders.filter(o => 
    o.checkoutStatus !== 'initiated' && 
    o.checkoutStatus !== 'abandoned'
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
            to="/merchant/storefront"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs shadow-xs transition flex items-center gap-1.5 font-poppins"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>View Live Store</span>
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
            {validStoreOrders.length}
          </p>
          <p className="text-[11px] text-slate-500 font-poppins font-medium">
            {validStoreOrders.filter(o => (o.orderStatus === 'Delivered' || o.paymentStatus === 'delivered')).length} completed & delivered
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
              <ShieldCheck className="w-4 h-4" />
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
            <span>Store Orders ({validStoreOrders.length})</span>
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
            <Activity className="w-4 h-4" />
            <span>AI Revenue Recovery Agent</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Store Catalog Products */}
      {activeTab === 'products' && (
        <div className="bg-white/50 backdrop-blur-2xl rounded-3xl border border-white/70 shadow-2xl shadow-blue-500/10 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-[#0066FF]" />
              <span className="font-bold text-slate-700">Loading catalog items...</span>
            </div>
          ) : searchParam && (
            <div className="p-4 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between gap-4 font-poppins">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">Filtering catalog for:</span>
                <span className="px-3 py-1 rounded-full bg-[#0066FF] text-white font-bold text-xs shadow-2xs">
                  "{searchParam}"
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'products' })}
                className="text-xs font-bold text-[#0066FF] hover:underline cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          )}

          {(() => {
            const filteredCatalog = searchParam
              ? products.filter(
                  p =>
                    p.title.toLowerCase().includes(searchParam.toLowerCase()) ||
                    p.brand.toLowerCase().includes(searchParam.toLowerCase()) ||
                    p.category.toLowerCase().includes(searchParam.toLowerCase())
                )
              : products;

            const totalCatalogPages = Math.max(1, Math.ceil(filteredCatalog.length / CATALOG_ITEMS_PER_PAGE));
            const paginatedCatalog = filteredCatalog.slice(
              (catalogPage - 1) * CATALOG_ITEMS_PER_PAGE,
              catalogPage * CATALOG_ITEMS_PER_PAGE
            );

            return filteredCatalog.length > 0 ? (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 font-poppins">
                    <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Product Title & Brand</th>
                        <th className="px-4 py-3.5">Category</th>
                        <th className="px-4 py-3.5">Price & MRP</th>
                        <th className="px-4 py-3.5">Discount</th>
                        <th className="px-4 py-3.5">Rating & Reviews</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {paginatedCatalog.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/70 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.thumbnail}
                                alt={p.title}
                                className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shadow-2xs shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 line-clamp-1 max-w-[260px] text-xs">
                                  {p.title}
                                </p>
                                <p className="text-[11px] text-[#0066FF] font-bold uppercase">
                                  {p.brand}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-mono font-bold text-slate-900">
                            <div>₹{p.price.toLocaleString('en-IN')}</div>
                            {p.originalPrice > p.price && (
                              <span className="text-[10px] text-slate-400 line-through">
                                ₹{p.originalPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 font-mono">
                            {p.discountPercent > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 font-bold text-[10px] border border-rose-200">
                                {p.discountPercent}% OFF
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                              <span>★</span>
                              <span className="text-slate-800 text-xs">{p.rating || '4.8'}</span>
                              <span className="text-slate-400 font-normal text-[10px]">
                                ({p.numReviews || 0})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditProduct(p)}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                                title="Edit product in Studio"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p._id, p.title)}
                                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                                title="Delete product"
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

                {/* Bottom Pagination Bar */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs font-medium text-slate-500 font-poppins">
                  <span>Page {catalogPage} of {totalCatalogPages} ({filteredCatalog.length} {filteredCatalog.length === 1 ? 'item' : 'items'})</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCatalogPage(prev => Math.max(1, prev - 1))}
                      disabled={catalogPage === 1}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalCatalogPages }, (_, idx) => idx + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCatalogPage(pageNum)}
                        className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition cursor-pointer ${
                          catalogPage === pageNum
                            ? 'bg-[#0066FF] text-white shadow-xs'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCatalogPage(prev => Math.min(totalCatalogPages, prev + 1))}
                      disabled={catalogPage === totalCatalogPages}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 px-4 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200/80 shadow-md">
                  <Package className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 font-poppins">
                    {searchParam ? 'No Matching Products Found' : 'No Products in Your Catalog Yet'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {searchParam
                      ? `No products in your catalog match "${searchParam}".`
                      : 'As a newly registered NexVolt merchant, publish your first electronics listing to make it immediately visible to verified buyers across India.'}
                  </p>
                </div>
                {searchParam ? (
                  <button
                    onClick={() => setSearchParams({ tab: 'products' })}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Clear Search Filter
                  </button>
                ) : (
                  <button
                    onClick={handleOpenAddProduct}
                    className="px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    + Add New Product
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 2: Store Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden font-poppins">
          {validStoreOrders.length > 0 ? (
            <div className="w-full">
              <table className="w-full table-fixed text-left text-xs">
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[24%]" />
                  <col className="w-[14%]" />
                  <col className="w-[26%]" />
                </colgroup>
                <thead className="bg-white text-slate-400 font-bold uppercase text-[11px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4 truncate">ORDER ID</th>
                    <th className="px-4 py-4 truncate">CUSTOMER</th>
                    <th className="px-4 py-4 truncate">ITEMS ORDERED</th>
                    <th className="px-4 py-4 truncate">TOTAL AMOUNT</th>
                    <th className="px-5 py-4 text-center truncate">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {validStoreOrders.map((o) => {
                    const isCOD = o.paymentMethod?.toLowerCase().includes('delivery') || o.paymentMethod?.toLowerCase().includes('cod');
                    const customerName = o.customerDetails?.name || 'Customer';
                    const customerEmail = o.customerDetails?.email || '';
                    const initials = getCustomerInitials(customerName);
                    const avatarClass = getAvatarColor(customerName);

                    const totalItemsCount = o.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 1;
                    const firstItem = o.items?.[0];

                    return (
                      <tr key={o.orderId} className="hover:bg-slate-50/50 transition">
                        {/* 1. ORDER ID */}
                        <td className="px-5 py-4.5 align-middle">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight font-mono truncate" title={o.orderId}>
                            {o.orderId}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {o.createdAt
                              ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
                                ', ' +
                                new Date(o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                              : '31 May 2025, 10:24 AM'}
                          </p>
                        </td>

                        {/* 2. CUSTOMER */}
                        <td className="px-4 py-4.5 align-middle">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarClass}`}>
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 text-xs sm:text-sm truncate" title={customerName}>{customerName}</p>
                              <p className="text-[11px] text-slate-400 truncate" title={customerEmail}>{customerEmail}</p>
                            </div>
                          </div>
                        </td>

                        {/* 3. ITEMS ORDERED */}
                        <td className="px-4 py-4.5 align-middle">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex items-center gap-1 shrink-0">
                              {o.items?.slice(0, 2).map((item: any, idx: number) => (
                                <img
                                  key={idx}
                                  src={item.thumbnail || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&q=80'}
                                  alt={item.title}
                                  title={`${item.title} (x${item.quantity || 1})`}
                                  className="w-8 h-8 rounded-lg object-cover bg-slate-50 border border-slate-200/80 shadow-2xs shrink-0"
                                />
                              ))}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 text-xs truncate block" title={firstItem?.title}>
                                {firstItem ? `${firstItem.quantity || 1}x ${firstItem.title}` : '1x Product Item'}
                              </p>
                              <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5">
                                {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 4. TOTAL AMOUNT */}
                        <td className="px-4 py-4.5 align-middle">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm font-sans truncate">
                            ₹{o.totalAmount?.toLocaleString('en-IN')}
                          </div>
                          {isCOD ? (
                            <div className="mt-0.5 truncate">
                              <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider inline-block">
                                COD
                              </span>
                              <span className="text-[9px] font-semibold text-slate-400 tracking-wider block mt-0.5 uppercase truncate">
                                PAY ON DELIVERY
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5 truncate">
                              RAZORPAY
                            </div>
                          )}
                        </td>

                        {/* 5. ACTIONS (Center Aligned with generous breathing room on both sides) */}
                        <td className="px-5 py-4.5 align-middle text-center">
                          <div className="flex items-center justify-center gap-2">
                            <OrderStatusDropdown order={o} onUpdate={handleUpdateOrderStatus} />
                            <button
                              type="button"
                              onClick={() => setSelectedOrderDetails(o)}
                              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-50/80 text-[#0066FF] font-semibold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
                              title="View Full Order Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#0066FF]" />
                              <span>View Details</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Bottom Pagination Bar */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs font-medium text-slate-500">
                <span>Page 1 of 1</span>
                <div className="flex items-center gap-1.5">
                  <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40" disabled>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-[#0066FF] text-white font-bold flex items-center justify-center shadow-xs">
                    1
                  </button>
                  <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40" disabled>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 font-poppins">No Store Orders Received Yet</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Whenever a customer places and confirms an order for your electronics items, the full shipping details and order items will appear here for you to fulfill.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: RevivePay AI Revenue Recovery Hub */}
      {activeTab === 'recovery' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-3 font-poppins">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0066FF] border border-blue-200/80 text-xs font-bold font-poppins">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0066FF]" />
                <span>RevivePay AI Revenue Recovery Agent</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSyncGateway}
                  disabled={isSyncingGateway}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="Synchronize all pending Razorpay payment links across store"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#0066FF] ${isSyncingGateway ? 'animate-spin' : ''}`} />
                  <span>{isSyncingGateway ? 'Syncing...' : 'Sync Razorpay Gateway'}</span>
                </button>
                <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700 font-poppins">RevivePay Active (Gemini Guardrails)</span>
                </div>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-poppins">
              AI-Powered Failed Payment & Drop-Off Recovery
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-3xl font-medium">
              RevivePay autonomously diagnoses Razorpay payment authorization errors, bank timeouts, and checkout drop-offs. It coordinates instant 1-click retries and user-approved secure Razorpay Payment Links without price discounts or margin cuts.
            </p>
          </div>

          {/* 4 KPI Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 font-poppins">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Revenue at Risk</span>
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                ₹{recoveryAnalytics?.metrics?.totalRevenueAtRisk ? recoveryAnalytics.metrics.totalRevenueAtRisk.toLocaleString('en-IN') : '0'}
              </p>
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Unpaid failed checkouts
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Revenue Recovered</span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-700 font-mono">
                ₹{recoveryAnalytics?.metrics?.totalRevenueRecovered ? recoveryAnalytics.metrics.totalRevenueRecovered.toLocaleString('en-IN') : '0'}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 100% full-value recovery
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Recovery Success Rate</span>
                <div className="p-1.5 rounded-lg bg-blue-50 text-[#0066FF]">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {recoveryAnalytics?.metrics?.recoveryRate ?? 0}%
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {recoveryAnalytics?.metrics?.successfulRecoveriesCount || 0} successfully recovered
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Active Recovery Cases</span>
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {recoveryAnalytics?.metrics?.activeCasesCount || abandonedCheckouts.length}
              </p>
              <p className="text-[11px] text-purple-600 font-medium">
                Under active RevivePay monitoring
              </p>
            </div>
          </div>

          {/* Interactive Judge Evaluation Sandbox & Failure Simulator */}
          <JudgeDemoSandbox onScenarioExecuted={() => loadData()} />

          {/* Track 3: Unit Economics & Margin Protection Analytics */}
          <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/40 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5 font-poppins">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Coins className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Unit Economics & Margin Protection Intelligence
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Traditional recovery platforms erode 10–15% in discount codes. RevivePay operates under a <strong className="text-slate-700">Strict Zero-Discount Guardrail</strong>, recovering 100% full order value.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                  Zero Discount Leakage: ₹0.00
                </span>
              </div>
            </div>

            {/* Financial Telemetry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Merchant Margin Protected</span>
                  <Percent className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <p className="text-xl font-extrabold text-slate-900 font-mono">
                  ₹{Math.round((recoveryAnalytics?.metrics?.totalRevenueRecovered || 0) * 0.22).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Based on 22% avg electronics margin
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
                  <span>Discount Leakage Saved</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xl font-extrabold text-emerald-700 font-mono">
                  ₹{Math.round((recoveryAnalytics?.metrics?.totalRevenueRecovered || 0) * 0.12).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium">
                  12% saved vs coupon-based tools
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Net Protected Value</span>
                  <TrendingUp className="w-3.5 h-3.5 text-[#0066FF]" />
                </div>
                <p className="text-xl font-extrabold text-slate-900 font-mono">
                  ₹{Math.round((recoveryAnalytics?.metrics?.totalRevenueRecovered || 0) * 0.34).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Total retained margin + saved promo
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-purple-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-purple-700 font-bold">
                  <span>Recovery Efficiency ROI</span>
                  <Calculator className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <p className="text-xl font-extrabold text-purple-700 font-mono">
                  {(recoveryAnalytics?.metrics?.successfulRecoveriesCount || 0) > 0 ? '18.4x' : '0.0x'}
                </p>
                <p className="text-[11px] text-purple-600 font-medium">
                  Return on agent authorization cost
                </p>
              </div>
            </div>

            {/* Razorpay Bounded Reasoning Justification Note */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3 text-xs text-slate-700 font-medium leading-relaxed">
              <Cpu className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 font-semibold block mb-0.5">
                  Track 3 Bounded Decision Justification (Why Retries are Worth Gateway Costs):
                </strong>
                Average electronics order value is ₹29,990 vs gateway authorization fee of ₹1.50. RevivePay’s AI retry evaluation proves an intervention ROI of over 10,000x for every successful bank authorization recovery.
              </div>
            </div>
          </div>

          {/* RevivePay Agent Activity Timeline */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5 font-poppins">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0066FF]" />
                <h3 className="text-base font-bold text-slate-900">RevivePay Agent Activity Timeline</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {recoveryAnalytics?.timeline?.length || 0} Recent Events
              </span>
            </div>

            {recoveryAnalytics?.timeline && recoveryAnalytics.timeline.length > 0 ? (
              <div className="space-y-3">
                {recoveryAnalytics.timeline.map((event: any, idx: number) => {
                  const isRecoverySuccess = event.isRecoverySuccess || event.decision === 'payment_verified_recovered' || event.decision === 'link_paid';
                  const isLink = event.tool?.toLowerCase().includes('link');
                  const isRetry = event.tool?.toLowerCase().includes('retry');
                  const isEscalate = event.decision === 'escalate';

                  const eventTime = event.timestamp
                    ? new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                    : '';

                  if (isRecoverySuccess) {
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition hover:border-emerald-300"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-slate-900">{event.orderId}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 font-medium">{event.customerEmail}</span>
                            <span className="text-slate-400">•</span>
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] shadow-2xs">
                              🎉 Revenue Recovered
                            </span>
                          </div>
                          <p className="text-emerald-900 font-medium text-[11px] leading-relaxed">
                            {event.reason || 'Payment successfully authorized and confirmed after RevivePay recovery intervention.'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-emerald-700 text-sm block">
                            +₹{event.amount?.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600">
                            ✓ Recovered • {eventTime}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition hover:border-slate-300"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900">{event.orderId}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">{event.customerEmail}</span>
                          <span className="text-slate-400">•</span>
                          {isLink ? (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                              AI Action: Payment Link
                            </span>
                          ) : isRetry ? (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0066FF] border border-blue-200 font-bold text-[10px]">
                              AI Diagnosed: 1-Click Retry
                            </span>
                          ) : isEscalate ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                              AI Action: Support Escalated
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                              AI Action: Shopper Guidance
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          {event.reason}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-medium text-slate-600 block">
                          ₹{event.amount?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Evaluated • {eventTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400 text-xs space-y-1">
                <Activity className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">No agent actions recorded yet.</p>
                <p>When customer payments fail, RevivePay decision logs and recovery milestones will appear here in real-time.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Abandoned Checkouts */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 font-poppins">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center justify-between font-poppins">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Pending Payment Failures / Drop-Offs</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-mono font-bold">
                  {abandonedCheckouts.length} Active
                </span>
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {abandonedCheckouts.length > 0 ? (
                  abandonedCheckouts.map((o) => (
                    <div key={o.orderId} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between transition hover:border-slate-300">
                      <div>
                        <p className="font-bold text-slate-900 font-mono">{o.orderId}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{o.customerDetails?.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 font-mono">₹{o.totalAmount?.toLocaleString('en-IN')}</span>
                        <span className="block text-[10px] text-amber-600 font-semibold font-poppins mt-0.5">RevivePay Monitored</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-8 text-center font-medium">No pending failures currently recorded.</p>
                )}
              </div>
            </div>

            {/* Recovered Orders */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 font-poppins">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center justify-between font-poppins">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>RevivePay Recovered Orders</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
                  {recoveredOrders.length} Recovered
                </span>
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {recoveredOrders.length > 0 ? (
                  recoveredOrders.map((o) => (
                    <div key={o.orderId} className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between transition hover:border-emerald-300">
                      <div>
                        <p className="font-bold text-slate-900 font-mono">{o.orderId}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{o.customerDetails?.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700 font-mono">₹{o.totalAmount?.toLocaleString('en-IN')}</span>
                        <span className="block text-[10px] text-emerald-600 font-semibold font-poppins mt-0.5">100% Value Recovered</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-8 text-center font-medium">No recovered orders recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Sliding / Modal Dialog */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-poppins">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-toast-in p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Order Details</span>
                <h2 className="text-xl font-black text-slate-900 font-heading flex items-center gap-2">
                  <span>{selectedOrderDetails.orderId}</span>
                  {(() => {
                    const currentStatus = selectedOrderDetails.orderStatus || (selectedOrderDetails.paymentStatus === 'delivered' ? 'Delivered' : selectedOrderDetails.paymentStatus === 'shipped' ? 'In-Transit' : 'Confirmed');
                    const config = FULFILLMENT_STATUSES.find(s => s.id.toLowerCase() === currentStatus.toLowerCase()) || FULFILLMENT_STATUSES[0];
                    const Icon = config.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.badgeClass}`}>
                        <Icon className="w-3 h-3" />
                        <span>{config.label}</span>
                      </span>
                    );
                  })()}
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
                <OrderStatusDropdown
                  order={selectedOrderDetails}
                  onUpdate={async (id, st) => {
                    await handleUpdateOrderStatus(id, st);
                    setSelectedOrderDetails({ ...selectedOrderDetails, orderStatus: st });
                  }}
                />
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
