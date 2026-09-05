import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Package,
  Truck,
  ArrowLeft,
  ShoppingBag,
  Clock,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Search,
  Receipt,
  X,
  RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import type { Order } from '../types';

export const OrdersPage: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');
  const [ordersPage, setOrdersPage] = useState(1);
  const ORDERS_PER_PAGE = 4;

  // Reset page when filters change
  useEffect(() => {
    setOrdersPage(1);
  }, [searchQuery, statusFilter]);
  
  // Tracking Modal State & Sequential Live Animation
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackAnimState, setTrackAnimState] = useState<{
    [key: number]: 'pending' | 'clock' | 'done' | 'active';
  }>({ 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' });
  const [trackLineWidth, setTrackLineWidth] = useState(0);

  // Invoice / Receipt Modal State
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Confirm Retry Modal State
  const [confirmRetryOrder, setConfirmRetryOrder] = useState<Order | null>(null);

  // Sequential Live Stepper Animation (Runs every time Track button is clicked)
  useEffect(() => {
    if (!trackingOrder) {
      setTrackAnimState({ 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' });
      setTrackLineWidth(0);
      return;
    }

    const statusNormalized = (trackingOrder.orderStatus || trackingOrder.paymentStatus || 'Confirmed').toLowerCase();
    const isDelivered = statusNormalized === 'delivered';
    const isShipped = statusNormalized === 'in-transit' || statusNormalized === 'shipped';
    const isPacked = statusNormalized === 'packed';

    let targetLevel = 1;
    if (isDelivered) targetLevel = 4;
    else if (isShipped) targetLevel = 3;
    else if (isPacked) targetLevel = 2;
    else targetLevel = 1;

    // Reset initial
    setTrackAnimState({ 1: 'clock', 2: 'pending', 3: 'pending', 4: 'pending' });
    setTrackLineWidth(0);

    // Stage 1: Confirmed (0 - 300ms)
    const t1 = setTimeout(() => {
      setTrackAnimState(prev => ({
        ...prev,
        1: 'done',
        2: targetLevel >= 2 ? 'clock' : 'pending'
      }));
      setTrackLineWidth(targetLevel >= 2 ? 33 : 10);
    }, 300);

    // Stage 2: Packed (300ms - 650ms)
    const t2 = setTimeout(() => {
      if (targetLevel >= 2) {
        setTrackAnimState(prev => ({
          ...prev,
          2: 'done',
          3: targetLevel >= 3 ? (targetLevel === 3 ? 'active' : 'clock') : 'pending'
        }));
        setTrackLineWidth(targetLevel >= 3 ? 66 : 33);
      }
    }, 650);

    // Stage 3: In-Transit (650ms - 1000ms)
    const t3 = setTimeout(() => {
      if (targetLevel >= 3) {
        if (targetLevel === 3) {
          setTrackAnimState(prev => ({ ...prev, 3: 'active' }));
          setTrackLineWidth(66);
        } else {
          setTrackAnimState(prev => ({ ...prev, 3: 'done', 4: 'clock' }));
          setTrackLineWidth(100);
        }
      }
    }, 1000);

    // Stage 4: Delivered (1000ms - 1350ms)
    const t4 = setTimeout(() => {
      if (targetLevel >= 4) {
        setTrackAnimState(prev => ({ ...prev, 4: 'done' }));
        setTrackLineWidth(100);
      }
    }, 1350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [trackingOrder]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/sign-in');
      return;
    }

    const fetchOrders = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          const data = await api.getUserOrders(user.id);
          setOrders(data || []);
        } catch (err) {
          console.error('Error fetching orders:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    if (isLoaded && user) {
      fetchOrders();
    }
  }, [user, isLoaded, isSignedIn, navigate]);

  // Filter orders based on status & search
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'shipped';
    const isDelivered = order.paymentStatus === 'delivered';
    const isFailed = order.paymentStatus === 'failed' || order.paymentStatus === 'pending' || order.paymentStatus === 'cancelled';

    if (statusFilter === 'active') {
      return isPaid;
    }
    if (statusFilter === 'completed') {
      return isDelivered;
    }
    if (statusFilter === 'failed') {
      return isFailed;
    }
    return true; // 'all' displays everything by default
  });

  const activeCount = orders.filter(o => o.paymentStatus === 'paid' || o.paymentStatus === 'shipped').length;
  const deliveredCount = orders.filter(o => o.paymentStatus === 'delivered').length;
  const failedCount = orders.filter(o => o.paymentStatus === 'failed' || o.paymentStatus === 'pending' || o.paymentStatus === 'cancelled').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 font-poppins relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0066FF] mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Order History & Logistics Tracking</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-heading tracking-tight">
            My Orders
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Monitor real-time live package shipments and manage past purchases.
          </p>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-[0.99] self-start md:self-auto"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Browse More Electronics</span>
        </Link>
      </div>

      {/* Summary Stats Row */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
          <div className="bg-white/50 backdrop-blur-2xl rounded-2xl p-5 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Total Orders</span>
            <p className="text-2xl font-black text-slate-900 font-heading">{orders.length}</p>
          </div>
          <div className="bg-white/50 backdrop-blur-2xl rounded-2xl p-5 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Active Shipments</span>
            <p className="text-2xl font-black text-[#0066FF] font-heading">
              {activeCount}
            </p>
          </div>
          <div className="bg-white/50 backdrop-blur-2xl rounded-2xl p-5 border border-white/70 shadow-2xl shadow-blue-500/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Total Spent</span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              ₹{orders.filter(o => o.paymentStatus !== 'failed' && o.paymentStatus !== 'pending').reduce((acc, o) => acc + (o.totalAmount || 0), 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      {orders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/50 backdrop-blur-xl p-3 rounded-2xl border border-white/70 shadow-2xl shadow-blue-500/10 relative z-10">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID (e.g. NV-17...) or Product Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-[#0066FF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white text-[#0066FF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In-Transit ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-white text-[#0066FF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Delivered ({deliveredCount})
            </button>
            {failedCount > 0 && (
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'failed'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                Failed ({failedCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Orders List Container */}
      {loading ? (
        <div className="py-20 text-center space-y-3 font-poppins">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto border border-blue-200 animate-pulse">
            <Clock className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs font-bold text-slate-600">Retrieving your order records...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-6 relative z-10 font-poppins">
          {(() => {
            const totalOrdersPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
            const paginatedOrders = filteredOrders.slice(
              (ordersPage - 1) * ORDERS_PER_PAGE,
              ordersPage * ORDERS_PER_PAGE
            );

            return (
              <>
                {paginatedOrders.map((order) => {
                  const statusNormalized = (order.orderStatus || order.paymentStatus || 'Confirmed').toLowerCase();
                  const isDelivered = statusNormalized === 'delivered';
                  const isShipped = statusNormalized === 'in-transit' || statusNormalized === 'shipped';
                  const isPacked = statusNormalized === 'packed';
                  const isConfirmed = statusNormalized === 'confirmed' || statusNormalized === 'paid';
                  const isFailed = statusNormalized === 'failed' || (order.paymentStatus === 'pending' && !order.paymentMethod?.toLowerCase().includes('delivery') && !order.paymentMethod?.toLowerCase().includes('cod'));

                  return (
                    <div
                      key={order.orderId}
                      className="bg-white/60 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 shadow-2xl shadow-blue-500/10 space-y-6 hover:shadow-blue-500/15 transition-all duration-300 relative overflow-hidden"
                    >
                      {/* 1. Order Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight">
                              {order.orderId}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                isDelivered
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isShipped
                                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                  : isPacked
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : isConfirmed
                                  ? 'bg-blue-50 text-[#0066FF] border border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isDelivered
                                ? 'Delivered'
                                : isShipped
                                ? 'In-Transit'
                                : isPacked
                                ? 'Packed'
                                : isConfirmed
                                ? 'Confirmed'
                                : 'Payment Failed'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            Placed on:{' '}
                            <strong className="text-slate-800">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })
                                : 'Recently'}
                            </strong>{' '}
                            • {isFailed ? (
                              <span className="text-rose-600 font-bold">Payment Incomplete</span>
                            ) : (
                              <span>Paid via <span className="font-bold text-slate-700">{order.paymentMethod || 'Razorpay'}</span></span>
                            )}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className={`text-xl sm:text-2xl font-black font-mono ${isFailed ? 'text-slate-500' : 'text-[#0066FF]'}`}>
                            ₹{order.totalAmount?.toLocaleString('en-IN')}
                          </span>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0)} items • {isFailed ? 'Not Dispatched' : 'Free Express Delivery'}
                          </p>
                        </div>
                      </div>

                      {/* 2. Order Items Grid */}
                      <div className="divide-y divide-slate-100">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <img
                                src={item.thumbnail || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=120&q=80'}
                                alt={item.title}
                                className="w-14 h-14 rounded-2xl object-cover bg-slate-50 border border-slate-200/80 shrink-0 shadow-2xs"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                                  {item.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                  <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                                    Qty: {item.quantity || 1}
                                  </span>
                                  <span>•</span>
                                  <span className="font-mono font-bold text-slate-800">
                                    ₹{item.price.toLocaleString('en-IN')} each
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-bold text-slate-900 font-mono text-sm sm:text-base">
                                ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 3. Delivery Info & Action Footer Bar */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Shipping Address Brief */}
                        <div className="flex items-start gap-2.5 text-xs text-slate-600">
                          <MapPin className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
                          <div className="font-medium">
                            <span className="font-bold text-slate-900">Ship to: </span>
                            <span>
                              {order.customerDetails?.name}, {order.customerDetails?.address?.city || 'Standard Address'} ({order.customerDetails?.address?.pincode || 'India'})
                            </span>
                          </div>
                        </div>

                        {/* Interactive Action Buttons */}
                        <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
                          {/* Invoice Button */}
                          <button
                            type="button"
                            onClick={() => setReceiptOrder(order)}
                            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-[0.99]"
                          >
                            <Receipt className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Details</span>
                          </button>

                          {/* Action: Track Order vs Retry Payment */}
                          {isFailed ? (
                            <button
                              type="button"
                              onClick={() => setConfirmRetryOrder(order)}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition flex items-center gap-2 cursor-pointer active:scale-[0.99]"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Retry Payment</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setTrackingOrder(order)}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer active:scale-[0.99]"
                            >
                              <Truck className="w-4 h-4" />
                              <span>Track Order</span>
                              <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Bottom Pagination Bar */}
                {totalOrdersPages > 1 && (
                  <div className="bg-white/60 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 border border-white/80 shadow-xl shadow-blue-500/5 flex items-center justify-between text-xs font-medium text-slate-500 font-poppins">
                    <span>
                      Page {ordersPage} of {totalOrdersPages} ({filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setOrdersPage(prev => Math.max(1, prev - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={ordersPage === 1}
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: totalOrdersPages }, (_, idx) => idx + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => {
                            setOrdersPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition cursor-pointer ${
                            ordersPage === pageNum
                              ? 'bg-[#0066FF] text-white shadow-xs'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setOrdersPage(prev => Math.min(totalOrdersPages, prev + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={ordersPage === totalOrdersPages}
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        /* Empty Orders State */
        <div className="bg-white/50 backdrop-blur-2xl rounded-3xl p-12 text-center border border-white/70 shadow-2xl shadow-blue-500/10 space-y-5 relative z-10 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto border border-blue-200 shadow-md shadow-blue-500/10">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 font-heading">
              {searchQuery ? 'No matching orders found' : statusFilter === 'failed' ? 'No failed orders' : 'No orders found'}
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              {searchQuery
                ? 'Try searching with a different Order Reference or product title.'
                : statusFilter === 'failed'
                ? 'All your past transactions were successfully completed.'
                : 'Explore our catalog of popular verified electronics and experience 1-click checkout.'}
            </p>
          </div>
          {searchQuery || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Reset Filters
            </button>
          ) : (
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Products</span>
            </Link>
          )}
        </div>
      )}

      {/* Back to Home Link */}
      <div className="pt-4 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0066FF] hover:text-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home Store</span>
        </Link>
      </div>

      {/* 4. Interactive Live Shipment Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150 font-poppins">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-slate-200/90 shadow-xl space-y-5 animate-in zoom-in-95 duration-150 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                    Shipment Tracking
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                    AWB: BD-{trackingOrder.orderId.replace(/[^0-9]/g, '').slice(-8)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Order #{trackingOrder.orderId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clean Minimal Progress Stepper with Live Sequential Animation */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-0.5">
                <span className="text-slate-900 font-bold">Package Status</span>
                <span className="text-emerald-700 font-medium">Estimated Delivery: Within 24–48 Hours</span>
              </div>

              {/* Minimal Horizontal Stepper */}
              <div className="grid grid-cols-4 gap-2 relative pt-1">
                {/* Connecting Track */}
                <div className="absolute top-[14px] left-[12%] right-[12%] h-[2px] bg-slate-200 -z-0">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-500 ease-out"
                    style={{ width: `${trackLineWidth}%` }}
                  />
                </div>

                {/* Step 1: Confirmed */}
                <div className="text-center space-y-1 relative z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-[11px] font-bold transition-all duration-300 ${
                    trackAnimState[1] === 'done'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : trackAnimState[1] === 'clock'
                      ? 'bg-blue-50 text-[#0066FF] border border-blue-300 ring-4 ring-blue-50 shadow-xs'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    {trackAnimState[1] === 'done' ? (
                      <span className="animate-in zoom-in-75 duration-200">✓</span>
                    ) : trackAnimState[1] === 'clock' ? (
                      <Clock className="w-3.5 h-3.5 animate-spin [animation-duration:1.2s]" />
                    ) : (
                      '1'
                    )}
                  </div>
                  <p className={`text-[11px] font-bold transition-colors ${trackAnimState[1] === 'done' ? 'text-slate-900' : trackAnimState[1] === 'clock' ? 'text-[#0066FF]' : 'text-slate-400'}`}>
                    Confirmed
                  </p>
                </div>

                {/* Step 2: Quality Checked */}
                <div className="text-center space-y-1 relative z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-[11px] font-bold transition-all duration-300 ${
                    trackAnimState[2] === 'done'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : trackAnimState[2] === 'clock'
                      ? 'bg-blue-50 text-[#0066FF] border border-blue-300 ring-4 ring-blue-50 shadow-xs'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    {trackAnimState[2] === 'done' ? (
                      <span className="animate-in zoom-in-75 duration-200">✓</span>
                    ) : trackAnimState[2] === 'clock' ? (
                      <Clock className="w-3.5 h-3.5 animate-spin [animation-duration:1.2s]" />
                    ) : (
                      '2'
                    )}
                  </div>
                  <p className={`text-[11px] font-bold transition-colors ${trackAnimState[2] === 'done' ? 'text-slate-900' : trackAnimState[2] === 'clock' ? 'text-[#0066FF]' : 'text-slate-400'}`}>
                    Packed
                  </p>
                </div>

                {/* Step 3: In-Transit */}
                <div className="text-center space-y-1 relative z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-[11px] font-bold transition-all duration-300 ${
                    trackAnimState[3] === 'done'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : trackAnimState[3] === 'active'
                      ? 'bg-[#0066FF] text-white ring-4 ring-blue-50 shadow-md shadow-blue-500/25'
                      : trackAnimState[3] === 'clock'
                      ? 'bg-blue-50 text-[#0066FF] border border-blue-300 ring-4 ring-blue-50 shadow-xs'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    {trackAnimState[3] === 'done' ? (
                      <span className="animate-in zoom-in-75 duration-200">✓</span>
                    ) : trackAnimState[3] === 'active' ? (
                      <Truck className="w-3.5 h-3.5 animate-in zoom-in-75 duration-200" />
                    ) : trackAnimState[3] === 'clock' ? (
                      <Clock className="w-3.5 h-3.5 animate-spin [animation-duration:1.2s]" />
                    ) : (
                      '3'
                    )}
                  </div>
                  <p className={`text-[11px] font-bold transition-colors ${trackAnimState[3] === 'active' || trackAnimState[3] === 'clock' ? 'text-[#0066FF]' : trackAnimState[3] === 'done' ? 'text-slate-900' : 'text-slate-400'}`}>
                    In-Transit
                  </p>
                </div>

                {/* Step 4: Delivered */}
                <div className="text-center space-y-1 relative z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-[11px] font-medium transition-all duration-300 ${
                    trackAnimState[4] === 'done'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : trackAnimState[4] === 'clock'
                      ? 'bg-blue-50 text-[#0066FF] border border-blue-300 ring-4 ring-blue-50 shadow-xs'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    {trackAnimState[4] === 'done' ? (
                      <span className="animate-in zoom-in-75 duration-200">✓</span>
                    ) : trackAnimState[4] === 'clock' ? (
                      <Clock className="w-3.5 h-3.5 animate-spin [animation-duration:1.2s]" />
                    ) : (
                      '4'
                    )}
                  </div>
                  <p className={`text-[11px] font-medium transition-colors ${trackAnimState[4] === 'done' ? 'font-bold text-emerald-700' : trackAnimState[4] === 'clock' ? 'text-[#0066FF] font-bold' : 'text-slate-400'}`}>
                    Delivered
                  </p>
                </div>
              </div>
            </div>

            {/* Minimal Side-by-Side 2-Column Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Destination Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/60 pb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Delivery Address</span>
                </div>
                <p className="font-bold text-slate-900">{trackingOrder.customerDetails?.name}</p>
                <p className="text-slate-600 text-[11px] truncate">{trackingOrder.customerDetails?.address?.street}</p>
                <p className="text-slate-600 text-[11px]">
                  {trackingOrder.customerDetails?.address?.city}, {trackingOrder.customerDetails?.address?.state} - {trackingOrder.customerDetails?.address?.pincode}
                </p>
              </div>

              {/* Carrier Partner Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/60 pb-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Carrier Partner</span>
                </div>
                <p className="font-bold text-slate-900">Bluedart Express Priority Air</p>
                <p className="text-slate-600 text-[11px]">Service: Express 24–48h Air Freight</p>
                <p className="text-emerald-700 text-[11px] font-semibold">Status: On Schedule</p>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Order Invoice / Details Modal */}
      {receiptOrder && (() => {
        const isOrderFailed = receiptOrder.paymentStatus === 'failed' || receiptOrder.paymentStatus === 'pending' || receiptOrder.paymentStatus === 'cancelled';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 font-poppins">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                      {isOrderFailed ? 'Order Details & Breakdown' : 'Order Details & Summary'}
                    </span>
                    {isOrderFailed ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                        Payment Incomplete
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                        Paid & Confirmed
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 font-heading">
                    #{receiptOrder.orderId}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptOrder(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Receipt Summary Breakdown */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                {receiptOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-500 font-medium">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
                <div className="p-3 bg-slate-50 space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900">₹{receiptOrder.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% Included):</span>
                    <span className="font-mono font-bold text-slate-900">₹{receiptOrder.tax?.toLocaleString('en-IN') || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Express Shipping:</span>
                    <span className="font-bold text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>{isOrderFailed ? 'Total Amount Due (Unpaid):' : 'Total Amount Paid:'}</span>
                    <span className={`font-mono font-black ${isOrderFailed ? 'text-rose-600' : 'text-[#0066FF]'}`}>
                      ₹{receiptOrder.totalAmount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                {isOrderFailed ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setReceiptOrder(null)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = receiptOrder;
                        setReceiptOrder(null);
                        setConfirmRetryOrder(target);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Payment</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReceiptOrder(null)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6. Confirm Retry Payment Modal */}
      {confirmRetryOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 font-poppins">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-md">
              <RefreshCw className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 font-heading">
                Retry Order Payment?
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                You are about to launch a secure checkout session for order <strong className="text-slate-900 font-mono">#{confirmRetryOrder.orderId}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Items in Order:</span>
                <span className="font-bold text-slate-900">{confirmRetryOrder.items?.reduce((acc, i) => acc + (i.quantity || 1), 0)} items</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Total Amount Due:</span>
                <span className="font-black text-[#0066FF] font-mono text-sm">₹{confirmRetryOrder.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRetryOrder(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetOrder = confirmRetryOrder;
                  setConfirmRetryOrder(null);
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  navigate(`/order/processing/${targetOrder.orderId}`, {
                    state: { order: targetOrder, immediateStatus: 'initiating', from: 'orders' }
                  });
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OrdersPage;
