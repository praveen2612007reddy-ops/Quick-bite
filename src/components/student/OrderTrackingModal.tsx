import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  BellRing,
  Star,
  Send,
  QrCode,
  Share2,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/index.ts';
import { sound } from '../../utils/sound.ts';

interface OrderTrackingModalProps {
  orderNumber: string;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  orderNumber,
  onClose,
  onOrderUpdated,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [prevStatus, setPrevStatus] = useState<OrderStatus | null>(null);

  // Poll for live status every 3 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        if (res.ok) {
          const data: Order = await res.json();
          if (isMounted) {
            // Sound chime when status changes to 'ready'
            if (prevStatus && prevStatus !== 'ready' && data.status === 'ready') {
              sound.playOrderReady();
            }
            setPrevStatus(data.status);
            setOrder(data);

            // Generate QR code for orderNumber
            QRCode.toDataURL(data.orderNumber, { width: 220, margin: 1 }, (err, url) => {
              if (!err && isMounted) setQrDataUrl(url);
            });
          }
        }
      } catch (err) {
        console.warn('Error fetching order update:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderNumber, prevStatus]);

  const copyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkCollected = async () => {
    if (!order) return;
    sound.playClick();
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'collected' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(prev => (prev ? { ...prev, status: 'collected' } : null));
        if (onOrderUpdated) onOrderUpdated();
      }
    } catch (e) {
      console.error('Failed to mark collected:', e);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellationReason: cancelReason || 'Student cancelled before preparation',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(prev => (prev ? { ...prev, status: 'cancelled' } : null));
        setShowCancelPrompt(false);
        if (onOrderUpdated) onOrderUpdated();
      }
    } catch (e) {
      console.error('Failed to cancel order:', e);
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!order || !order.items || order.items.length === 0) return;
    const firstItem = order.items[0];
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          menuItemId: firstItem.menuItemId,
          rating,
          comment: reviewComment,
        }),
      });
      setReviewed(true);
      sound.playOrderPlaced();
    } catch (e) {
      console.warn('Failed to submit review:', e);
    }
  };

  // Status step progression helper
  const steps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: 'placed', label: 'Order Placed', desc: 'Received by kitchen system' },
    { key: 'confirmed', label: 'Confirmed', desc: 'Chef queued preparation' },
    { key: 'preparing', label: 'Preparing', desc: 'Cooking & assembling meal' },
    { key: 'ready', label: 'Ready for Pickup', desc: 'Waiting at Pickup Counter' },
    { key: 'collected', label: 'Collected', desc: 'Order completed & enjoyed' },
  ];

  const getStepIndex = (st: OrderStatus) => {
    switch (st) {
      case 'placed':
        return 0;
      case 'confirmed':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
        return 3;
      case 'collected':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-xl w-full max-h-[94vh] overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base">Live Order Tracking</h2>
              <p className="text-[11px] text-emerald-200">Real-time Canteen Kitchen Feed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable tracker body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && !order ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-gray-500 font-medium">Fetching real-time order status...</p>
            </div>
          ) : order ? (
            <>
              {/* Order Number Banner */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 rounded-3xl p-5 border border-emerald-200/70 text-center space-y-3 relative overflow-hidden">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-white/80 px-2.5 py-1 rounded-full border border-emerald-200">
                  Pickup Order Pass
                </span>

                <div>
                  <div className="text-2xl sm:text-3xl font-black text-gray-900 font-mono tracking-tight flex items-center justify-center gap-2">
                    <span>{order.orderNumber}</span>
                    <button
                      onClick={copyOrderNumber}
                      className="p-1.5 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 shadow-2xs border border-emerald-200 transition active:scale-95"
                      title="Copy Order Number"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Show this number or the QR code at the counter for pickup
                  </p>
                </div>

                {/* QR Code and Status Highlight */}
                {qrDataUrl && (
                  <div className="inline-block p-2.5 bg-white rounded-2xl shadow-sm border border-emerald-100 mx-auto">
                    <img src={qrDataUrl} alt="Order QR" className="w-32 h-32 sm:w-36 sm:h-36 mx-auto" />
                    <p className="text-[10px] font-semibold text-gray-400 mt-1 flex items-center justify-center gap-1">
                      <QrCode className="w-3 h-3" /> Scan to Verify
                    </p>
                  </div>
                )}
              </div>

              {/* Status Alert Highlight */}
              {order.status === 'ready' && (
                <div className="p-4 rounded-2xl bg-emerald-600 text-white flex items-center gap-3 animate-pulse shadow-md shadow-emerald-600/30">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <BellRing className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm">Your order is ready for pickup!</h4>
                    <p className="text-xs text-emerald-100">
                      Please head to Counter #1 with your order number. Enjoy your meal!
                    </p>
                  </div>
                </div>
              )}

              {order.status === 'cancelled' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">This order was cancelled</h4>
                    <p className="text-xs text-rose-600 mt-0.5">
                      Reason: {order.cancellationReason || 'Cancelled by staff or student'}
                    </p>
                  </div>
                </div>
              )}

              {/* Visual Status Progression Timeline */}
              {order.status !== 'cancelled' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Kitchen Progress Timeline</span>
                    <span className="text-emerald-700 font-semibold normal-case text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Pickup:{' '}
                      {new Date(order.pickupTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </h3>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
                    {steps.map((st, idx) => {
                      const isComplete = currentStepIdx > idx;
                      const isCurrent = currentStepIdx === idx;

                      return (
                        <div key={st.key} className="relative flex items-start gap-3">
                          {/* Dot / Check icon */}
                          <div
                            className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-4 ring-white ${
                              isComplete
                                ? 'bg-emerald-600'
                                : isCurrent
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-gray-300'
                            }`}
                          >
                            {isComplete ? (
                              <Check className="w-3 h-3 stroke-[3]" />
                            ) : isCurrent ? (
                              <span className="w-2 h-2 rounded-full bg-white"></span>
                            ) : (
                              ''
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4
                                className={`text-xs font-bold ${
                                  isCurrent
                                    ? 'text-emerald-700 font-black'
                                    : isComplete
                                    ? 'text-gray-900'
                                    : 'text-gray-400'
                                }`}
                              >
                                {st.label}
                                {isCurrent && (
                                  <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                    Current
                                  </span>
                                )}
                              </h4>
                            </div>
                            <p className="text-[11px] text-gray-500">{st.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items Ordered List */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2.5">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Ordered Items
                </h4>
                <div className="divide-y divide-gray-200/70 text-xs">
                  {order.items?.map(it => (
                    <div key={it.id || it.menuItemId} className="py-2 flex justify-between gap-2">
                      <div>
                        <span className="font-bold text-gray-900">
                          {it.quantity}x {it.menuItemName}
                        </span>
                        {it.specialInstructions && (
                          <p className="text-[11px] text-orange-600 italic">
                            Note: "{it.specialInstructions}"
                          </p>
                        )}
                      </div>
                      <span className="font-mono font-bold text-gray-800">
                        ₹{(Number(it.priceAtOrderTime) * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-xs text-gray-900">
                  <span>Total Paid</span>
                  <span className="text-emerald-700 font-mono text-sm">
                    ₹{Number(order.totalPrice).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Review & Feedback Section if Collected */}
              {order.status === 'collected' && !reviewed && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-xs">How was your meal? Leave a quick review!</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Comment (e.g. Perfectly cooked, loved the katsu!)..."
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      onClick={handleSubmitReview}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Submit
                    </button>
                  </div>
                </div>
              )}

              {reviewed && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium text-center">
                  🎉 Thank you for your review!
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {order.status === 'ready' && (
                  <button
                    onClick={handleMarkCollected}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition text-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    I've Collected My Order
                  </button>
                )}

                {/* Cancel option if order is still placed/confirmed */}
                {['placed', 'confirmed'].includes(order.status) && (
                  <>
                    {!showCancelPrompt ? (
                      <button
                        onClick={() => setShowCancelPrompt(true)}
                        className="w-full py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      >
                        Cancel this order
                      </button>
                    ) : (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
                        <p className="font-bold text-rose-900">Are you sure you want to cancel?</p>
                        <input
                          type="text"
                          placeholder="Optional reason for cancellation..."
                          value={cancelReason}
                          onChange={e => setCancelReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelOrder}
                            disabled={cancelling}
                            className="flex-1 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition"
                          >
                            {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                          </button>
                          <button
                            onClick={() => setShowCancelPrompt(false)}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
                          >
                            Keep Order
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400 text-xs">Order details not found</div>
          )}
        </div>
      </div>
    </div>
  );
};
