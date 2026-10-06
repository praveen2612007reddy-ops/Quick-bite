import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Check,
  Flame,
  QrCode,
  DollarSign,
  TrendingUp,
  Volume2,
  Bell,
  RefreshCw,
  Users,
  Utensils,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/index.ts';
import { sound } from '../../utils/sound.ts';

interface StaffDashboardProps {
  orders: Order[];
  onRefreshOrders: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  orders,
  onRefreshOrders,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickOrderNumber, setQuickOrderNumber] = useState('');
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Count active stats
  const todayOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const placedCount = orders.filter(o => o.status === 'placed').length;

  const handleUpdateStatus = async (orderId: number, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        if (nextStatus === 'ready') {
          sound.playOrderReady();
        } else {
          sound.playClick();
        }
        onRefreshOrders();
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickOrderNumber.trim()) return;
    setScanMessage(null);

    try {
      const res = await fetch('/api/orders/collect-by-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: quickOrderNumber.trim() }),
      });

      if (res.ok) {
        sound.playOrderReady();
        setScanMessage({
          type: 'success',
          text: `Order ${quickOrderNumber.trim()} verified & marked Collected!`,
        });
        setQuickOrderNumber('');
        onRefreshOrders();
      } else {
        const err = await res.json();
        setScanMessage({ type: 'error', text: err.error || 'Order number not found' });
      }
    } catch (e: any) {
      setScanMessage({ type: 'error', text: 'Network error verifying order' });
    }
  };

  const handleBatchMarkReady = async () => {
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    if (preparingOrders.length === 0) return;

    sound.playOrderReady();
    for (const o of preparingOrders) {
      await fetch(`/api/orders/${o.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready' }),
      });
    }
    onRefreshOrders();
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    try {
      await fetch(`/api/orders/${cancelModalOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellationReason: cancelReason || 'Cancelled by Kitchen Staff',
        }),
      });
      setCancelModalOrder(null);
      setCancelReason('');
      onRefreshOrders();
    } catch (e) {
      console.error('Cancel order failed:', e);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchName = o.student?.fullName?.toLowerCase().includes(q) || false;
      if (!matchNum && !matchName) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Bar */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30 mb-2">
            <ChefHat className="w-3.5 h-3.5" />
            Kitchen Order Management System (KDS)
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Canteen Kitchen Live Orders</h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time ticket updates • Streamline cooking queues & customer pickups
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {preparingCount > 0 && (
            <button
              onClick={handleBatchMarkReady}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark All Preparing as Ready ({preparingCount})
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onRefreshOrders();
            }}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition"
            title="Refresh order queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            New Placed
          </span>
          <div className="text-2xl font-black text-blue-600 mt-1 flex items-baseline justify-between">
            <span>{placedCount}</span>
            <span className="text-xs text-gray-400 font-medium">pending</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Cooking / Preparing
          </span>
          <div className="text-2xl font-black text-amber-500 mt-1 flex items-baseline justify-between">
            <span>{preparingCount}</span>
            <span className="text-xs text-amber-600 font-medium animate-pulse">in kitchen</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Ready at Counter
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1 flex items-baseline justify-between">
            <span>{readyCount}</span>
            <span className="text-xs text-emerald-600 font-medium">awaiting pickup</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Tickets
          </span>
          <div className="text-2xl font-black text-gray-900 mt-1 flex items-baseline justify-between">
            <span>{orders.length}</span>
            <span className="text-xs text-gray-400 font-medium">recorded</span>
          </div>
        </div>
      </div>

      {/* Quick Pickup Scanner / Manual Entry Bar */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5">
        <form
          onSubmit={handleQuickCollect}
          className="flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-emerald-950">
                Counter Collection / Quick Verification
              </h3>
              <p className="text-[11px] text-emerald-700">
                Scan barcode or enter Order # (e.g. ORD-061026-1001) to instantly mark as Collected
              </p>
            </div>
          </div>

          <div className="flex w-full sm:w-auto gap-2">
            <input
              type="text"
              placeholder="e.g. ORD-061026-1001"
              value={quickOrderNumber}
              onChange={e => setQuickOrderNumber(e.target.value)}
              className="flex-1 sm:w-60 px-3.5 py-2 text-xs rounded-xl border border-emerald-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0"
            >
              Verify Pickup
            </button>
          </div>
        </form>

        {scanMessage && (
          <div
            className={`mt-2.5 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              scanMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-900'
                : 'bg-rose-100 text-rose-900'
            }`}
          >
            {scanMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-700" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700" />
            )}
            <span>{scanMessage.text}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order #, student name, or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none text-xs font-bold">
            {['all', 'placed', 'confirmed', 'preparing', 'ready', 'collected', 'cancelled'].map(
              st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl capitalize transition ${
                    statusFilter === st
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Orders Table & Cards */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-400 text-xs">
            No orders found matching the filter.
          </div>
        ) : (
          filteredOrders.map(order => {
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-150 p-4 sm:p-5 shadow-xs hover:shadow-md transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-base text-gray-900">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                        order.status === 'placed'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'confirmed'
                          ? 'bg-indigo-100 text-indigo-800'
                          : order.status === 'preparing'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : order.status === 'ready'
                          ? 'bg-emerald-100 text-emerald-800 animate-bounce'
                          : order.status === 'collected'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-semibold text-gray-700">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      Pickup:{' '}
                      {new Date(order.pickupTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="font-mono font-black text-gray-900 text-sm">
                      ₹{Number(order.totalPrice).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Customer and Order items details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      Student
                    </span>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {order.student?.fullName || 'Alex Student'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {order.student?.email || 'student@school.edu'}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      Order Items & Special Notes
                    </span>
                    <div className="mt-1 space-y-1">
                      {order.items?.map((it, idx) => (
                        <div key={idx} className="flex items-baseline justify-between">
                          <span className="font-bold text-gray-800">
                            {it.quantity}x {it.menuItemName}
                          </span>
                          {it.specialInstructions && (
                            <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[11px] font-semibold italic">
                              ⚠️ "{it.specialInstructions}"
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="mt-1.5 text-[11px] text-emerald-800 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                        <strong>Order Note:</strong> {order.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-gray-400">
                    Created: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.status === 'placed' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        Confirm Order
                      </button>
                    )}

                    {(order.status === 'placed' || order.status === 'confirmed') && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                      >
                        🍳 Start Preparing
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        disabled={isUpdating}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                      >
                        🔔 Mark Ready for Pickup
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'collected')}
                        disabled={isUpdating}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Collected
                      </button>
                    )}

                    {order.status !== 'collected' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => setCancelModalOrder(order)}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Staff Cancel Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">
              Cancel Order #{cancelModalOrder.orderNumber}?
            </h3>
            <p className="text-xs text-gray-500">
              Provide a reason so the student knows why the order could not be prepared (e.g. ingredient out of stock).
            </p>
            <input
              type="text"
              placeholder="e.g. Ingredient out of stock"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
              >
                Confirm Cancel
              </button>
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
