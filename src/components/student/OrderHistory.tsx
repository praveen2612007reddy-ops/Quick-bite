import React, { useState } from 'react';
import {
  Clock,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Order, MenuItem } from '../../types/index.ts';
import { useCart } from '../../context/CartContext.tsx';

interface OrderHistoryProps {
  orders: Order[];
  allMenuItems: MenuItem[];
  onTrackOrder: (orderNumber: string) => void;
  onExploreMenu: () => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  allMenuItems,
  onTrackOrder,
  onExploreMenu,
}) => {
  const { reorder } = useCart();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const activeOrders = orders.filter(o =>
    ['placed', 'confirmed', 'preparing', 'ready'].includes(o.status)
  );

  const completedOrders = orders.filter(o =>
    ['collected', 'cancelled'].includes(o.status)
  );

  const displayedOrders =
    filter === 'active'
      ? activeOrders
      : filter === 'completed'
      ? completedOrders
      : orders;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'placed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Placed
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Confirmed
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            🍳 Preparing
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-bounce">
            🔔 Ready for Pickup
          </span>
        );
      case 'collected':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
            ✓ Collected
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            ✕ Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header and Filter pills */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Your Orders & History</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Track active meal preparations or quickly reorder past favorites
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'all' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-gray-600'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'active' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-gray-600'
            }`}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'completed'
                ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                : 'text-gray-600'
            }`}
          >
            Completed ({completedOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-gray-800 text-base">No orders in this view</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You don’t have any {filter !== 'all' ? filter : ''} orders yet. Check out the daily
            canteen specials!
          </p>
          <button
            onClick={onExploreMenu}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Browse Canteen Menu
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayedOrders.map(order => {
            const isActive = ['placed', 'confirmed', 'preparing', 'ready'].includes(order.status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:shadow-md transition space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-black font-mono text-sm sm:text-base text-gray-900">
                      {order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      Pickup:{' '}
                      <strong className="text-gray-700">
                        {new Date(order.pickupTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>{' '}
                      ({new Date(order.pickupTime).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-700 font-medium">
                      {order.items?.map(it => `${it.quantity}x ${it.menuItemName}`).join(', ') ||
                        '1x Canteen meal'}
                    </p>
                    {order.notes && (
                      <p className="text-[11px] text-gray-400 italic">Notes: "{order.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-gray-900 text-base font-mono">
                      ₹{Number(order.totalPrice).toFixed(2)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {order.items && order.items.length > 0 && (
                        <button
                          onClick={() => reorder(order.items!, allMenuItems)}
                          className="px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition flex items-center gap-1"
                          title="Quick reorder items to cart"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Reorder</span>
                        </button>
                      )}

                      <button
                        onClick={() => onTrackOrder(order.orderNumber)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                          isActive
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isActive ? 'Track Live' : 'View Pass'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
