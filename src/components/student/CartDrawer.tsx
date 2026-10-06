import React from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.tsx';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    cart,
    isOpen,
    setIsOpen,
    removeItem,
    updateQuantity,
    updateInstructions,
    clearCart,
    subtotal,
    estimatedPrepTime,
    totalItems,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-250"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Your Pre-Order Cart</h2>
              <p className="text-[11px] text-gray-500 font-medium">
                {totalItems} item{totalItems !== 1 ? 's' : ''} • Scheduled Pickup
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-gray-400 hover:text-rose-600 transition flex items-center gap-1 p-1"
                title="Clear all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cart items list or empty state */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Your cart is empty</h3>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                Browse our breakfast, lunch, and snack menus to pre-order and skip the canteen lines!
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
              >
                Explore Menu
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {cart.map(item => (
                <div
                  key={item.menuItem.id}
                  className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition space-y-2.5"
                >
                  <div className="flex gap-3">
                    <img
                      src={item.menuItem.imageUrl}
                      alt={item.menuItem.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-gray-900 text-xs truncate">
                          {item.menuItem.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.menuItem.id)}
                          className="text-gray-300 hover:text-rose-500 transition p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-mono font-bold text-emerald-700 block mt-0.5">
                        ₹{Number(item.menuItem.price).toFixed(2)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-white text-gray-700 flex items-center justify-center hover:bg-gray-100 font-bold transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-gray-900 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 font-bold transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-extrabold text-gray-900 font-mono">
                          ₹{(Number(item.menuItem.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Special instructions per item */}
                  <div className="pt-2 border-t border-gray-100">
                    <input
                      type="text"
                      placeholder="Add note: e.g. Extra sauce, no ice..."
                      value={item.specialInstructions}
                      onChange={e => updateInstructions(item.menuItem.id, e.target.value)}
                      className="w-full text-[11px] bg-gray-50 border border-gray-150 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-gray-700 placeholder-gray-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer with breakdown */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Est. Kitchen Prep:
              </span>
              <span className="font-semibold text-gray-700">~{estimatedPrepTime} minutes</span>
            </div>

            <div className="flex items-center justify-between pt-1 text-sm">
              <span className="font-bold text-gray-900">Subtotal</span>
              <span className="font-black text-gray-900 text-base font-mono">
                ₹{subtotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                onProceedToCheckout();
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-98 transition text-sm"
            >
              <span>Schedule Pickup & Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
