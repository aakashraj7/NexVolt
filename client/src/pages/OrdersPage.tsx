import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Package, Truck, ArrowLeft, ShoppingBag } from 'lucide-react';
import { api } from '../lib/api';
import type { Order } from '../types';

export const OrdersPage: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (user?.id) {
        try {
          const data = await api.getUserOrders(user.id);
          setOrders(data);
        } catch (err) {
          console.error('Error fetching orders:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchOrders();
    }
  }, [user, isLoaded]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 font-heading">My Tech Orders</h1>
        <p className="text-slate-500 text-xs mt-1 font-medium">
          Track shipments, download invoices, and view order receipts.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-slate-500">Loading your orders...</div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.orderId} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 font-mono">{order.orderId}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Placed on: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-base font-extrabold text-cyan-700 font-mono">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[11px] text-slate-500">Paid via {order.paymentMethod}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-xs">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.title}</p>
                      <p className="text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order Tracking Status Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Status: Preparing for Express Dispatch</span>
                </div>
                <span className="text-[11px] text-slate-400">Carrier: Bluedart Express</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <Package className="w-12 h-12 text-cyan-600 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900">No orders placed yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Once you order electronics on NexVolt, your tracking information and invoices will appear here.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Start Shopping</span>
          </Link>
        </div>
      )}

      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-cyan-600 hover:text-cyan-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};
