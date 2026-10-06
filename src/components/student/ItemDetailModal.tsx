import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Flame,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  Send,
  MessageSquare,
  Sparkles,
  Heart,
} from 'lucide-react';
import { MenuItem, Review } from '../../types/index.ts';
import { useCart } from '../../context/CartContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (id: number) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  isWishlisted,
  onToggleWishlist,
}) => {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setSpecialInstructions('');
      fetchReviews(item.id);
    }
  }, [item]);

  const fetchReviews = async (itemId: number) => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews/${itemId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (e) {
      console.warn('Failed to load reviews:', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleAdd = () => {
    if (!item || item.availabilityStatus === 'unavailable') return;
    addItem(item, quantity, specialInstructions);
    onClose();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId: item.id,
          rating: newRating,
          comment: newComment,
        }),
      });
      if (res.ok) {
        setNewComment('');
        fetchReviews(item.id);
      }
    } catch (e) {
      console.error('Review submit failed:', e);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header Image */}
        <div className="relative h-60 w-full overflow-hidden shrink-0">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

          {/* Badges on image */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider">
                  {item.category}
                </span>
                {item.isVegetarian && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-600/90 text-[10px] font-bold">
                    🌱 Vegetarian
                  </span>
                )}
                {item.isVegan && (
                  <span className="px-1.5 py-0.5 rounded-md bg-teal-600/90 text-[10px] font-bold">
                    🌿 Vegan
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold leading-tight drop-shadow-sm">{item.name}</h2>
            </div>

            <button
              onClick={() => onToggleWishlist(item.id)}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition active:scale-90"
            >
              <Heart
                className={`w-4 h-4 ${
                  isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-white'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Tabs: Details vs Reviews */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Dish Details & Customization
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'details' ? (
            <>
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-2xl text-center">
                <div>
                  <span className="text-[10px] text-gray-400 block font-medium">Preparation</span>
                  <span className="text-xs font-bold text-gray-800 flex items-center justify-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {item.preparationTimeMinutes} mins
                  </span>
                </div>
                <div className="border-x border-gray-200">
                  <span className="text-[10px] text-gray-400 block font-medium">Energy</span>
                  <span className="text-xs font-bold text-gray-800 flex items-center justify-center gap-1 mt-0.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    {item.calories || 350} kcal
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-medium">Rating</span>
                  <span className="text-xs font-bold text-amber-600 flex items-center justify-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {item.rating || '4.8'} ({item.ratingCount || 12})
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
              </div>

              {/* Special Instructions Input */}
              <div>
                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-1">
                  Special Kitchen Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, dressing on side, no ice, extra sauce..."
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition"
                  maxLength={120}
                />
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-gray-900">Quantity</span>
                <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg bg-white text-gray-700 flex items-center justify-center hover:bg-gray-50 shadow-2xs font-bold transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-gray-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 shadow-2xs font-bold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Reviews & Rating Tab */
            <div className="space-y-4">
              {/* Submit review box */}
              <form
                onSubmit={handleSubmitReview}
                className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">Rate this dish:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= newRating ? 'fill-amber-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a brief comment (e.g. Delicious, crisp!)..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition"
                  >
                    <Send className="w-3 h-3" />
                    Post
                  </button>
                </div>
              </form>

              {/* Reviews list */}
              {loadingReviews ? (
                <div className="text-center py-6 text-xs text-gray-400">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  No student reviews yet. Be the first to rate!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reviews.map(r => (
                    <div
                      key={r.id}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                          {[...Array(r.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {r.comment && <p className="text-gray-700 leading-snug">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer / Add to Cart */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-gray-400 block font-medium">Subtotal</span>
            <span className="text-lg font-black text-gray-900 font-mono">
              ₹{(Number(item.price) * quantity).toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={item.availabilityStatus === 'unavailable'}
            className="flex-1 max-w-xs flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-600/20 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Add to Order (₹{(Number(item.price) * quantity).toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
};
