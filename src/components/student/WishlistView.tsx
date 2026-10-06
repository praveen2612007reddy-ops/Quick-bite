import React from 'react';
import { Heart, Plus, Clock, Star, Flame, ShoppingBag } from 'lucide-react';
import { MenuItem } from '../../types/index.ts';
import { useCart } from '../../context/CartContext.tsx';

interface WishlistViewProps {
  items: MenuItem[];
  onToggleWishlist: (id: number) => void;
  onExploreMenu: () => void;
  onOpenDetails: (item: MenuItem) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  items,
  onToggleWishlist,
  onExploreMenu,
  onOpenDetails,
}) => {
  const { addItem } = useCart();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            Saved Wishlist Items
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Your saved canteen dishes for quick one-click orders
          </p>
        </div>
        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-gray-800 text-base">Your wishlist is empty</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Tap the heart icon on any menu item card to save it here for fast re-ordering.
          </p>
          <button
            onClick={onExploreMenu}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
          >
            Explore Menu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => onOpenDetails(item)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col cursor-pointer group"
            >
              <div className="relative h-44 overflow-hidden bg-gray-100">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onToggleWishlist(item.id);
                  }}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-rose-500 flex items-center justify-center shadow-xs transition hover:scale-110"
                >
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h3>
                    <div className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {item.rating || '4.8'}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-base font-extrabold text-gray-900 font-mono">
                    ₹{Number(item.price).toFixed(2)}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      addItem(item, 1);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
