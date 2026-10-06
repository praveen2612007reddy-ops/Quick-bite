import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Mail,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { sound } from '../../utils/sound.ts';
import { Order } from '../../types/index.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderPlaced,
}) => {
  const { cart, subtotal, estimatedPrepTime, clearCart } = useCart();
  const { user, dbUser } = useAuth();

  // Date selection (default today, max 7 days)
  const todayStr = new Date().toISOString().split('T')[0];
  const [pickupDate, setPickupDate] = useState<string>(todayStr);

  // Time slot intervals for Canteen hours
  const standardTimeSlots = [
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
  ];

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('12:30');
  const [customTime, setCustomTime] = useState<string>('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [notes, setNotes] = useState('');
  const [studentName, setStudentName] = useState(
    dbUser?.fullName || user?.displayName || 'Alex Johnson'
  );
  const [studentEmail, setStudentEmail] = useState(
    dbUser?.email || user?.email || 'student@school.edu'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate max date (7 days ahead)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    const timeToUse = useCustomTime ? customTime : selectedTimeSlot;
    if (!timeToUse) {
      setError('Please select a pickup time slot.');
      return;
    }

    // Combine date and time
    const pickupDateTime = new Date(`${pickupDate}T${timeToUse}:00`);
    if (isNaN(pickupDateTime.getTime())) {
      setError('Invalid pickup date or time format.');
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = cart.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || '',
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsPayload,
          pickupTime: pickupDateTime.toISOString(),
          notes,
          studentName,
          studentEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to place order');
      }

      const createdOrder: Order = await res.json();

      // Play cheerful audio alert
      sound.playOrderPlaced();

      // Clear cart
      clearCart();

      // Pass created order to parent to open Tracking Modal
      onOrderPlaced(createdOrder);
      onClose();
    } catch (err: any) {
      console.error('Order placement error:', err);
      setError(err.message || 'Network error placing order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base">Schedule Canteen Pickup</h2>
              <p className="text-xs text-emerald-200 font-medium">
                Reserve your meal slot & skip waiting in queues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handlePlaceOrder} className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Info */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Student Pickup Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  School / College Email
                </label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Pickup Date Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Pickup Date (Advance booking up to 7 days)
            </label>
            <input
              type="date"
              required
              min={todayStr}
              max={maxDateStr}
              value={pickupDate}
              onChange={e => setPickupDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Pickup Time Slots */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Select Pickup Window (Canteen Operating Hours)
              </label>
              <button
                type="button"
                onClick={() => setUseCustomTime(!useCustomTime)}
                className="text-[11px] font-semibold text-emerald-700 hover:underline"
              >
                {useCustomTime ? 'Use Standard Slots' : 'Custom Time'}
              </button>
            </div>

            {!useCustomTime ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {standardTimeSlots.map(slot => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition text-center ${
                      selectedTimeSlot === slot
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <input
                  type="time"
                  required={useCustomTime}
                  value={customTime}
                  onChange={e => setCustomTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
            <p className="text-[11px] text-gray-500 italic">
              Kitchen prep time: ~{estimatedPrepTime} minutes. Your order will be fresh and boxed by this time.
            </p>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              General Order Notes (Optional)
            </label>
            <textarea
              placeholder="e.g. Please pack disposable cutlery, peanut allergy, will collect with student ID..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Order Summary & Total */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Items Total ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span className="font-mono font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Packaging & Pre-Order Service</span>
              <span className="text-emerald-600 font-semibold">FREE</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-gray-900">
              <span>Total Payable</span>
              <span className="text-emerald-700 font-mono text-base font-black">
                ₹{subtotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || cart.length === 0}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50 text-sm"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Confirming Order with Kitchen...
              </span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm & Generate Pickup Ticket (₹{subtotal.toFixed(2)})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
