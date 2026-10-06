import React, { useState } from 'react';
import {
  Search,
  Clock,
  Flame,
  Star,
  Plus,
  Minus,
  Check,
  Heart,
  Coffee,
  Utensils,
  Moon,
  Sandwich,
  Pizza,
  Cookie,
  CupSoda,
  Sparkles,
  Info,
  Filter,
  X,
} from 'lucide-react';
import { MenuItem, Category } from '../../types/index.ts';
import { useCart } from '../../context/CartContext.tsx';
import { sound } from '../../utils/sound.ts';

interface MenuDisplayProps {
  items: MenuItem[];
  loading: boolean;
  wishlistIds: number[];
  onToggleWishlist: (id: number) => void;
  onOpenDetails: (item: MenuItem) => void;
}

export const MenuDisplay: React.FC<MenuDisplayProps> = ({
  items,
  loading,
  wishlistIds,
  onToggleWishlist,
  onOpenDetails,
}) => {
  const { addItem, cart, updateQuantity } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [veganOnly, setVeganOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'price-high' | 'prep-time' | 'rating'>('recommended');
  const [addedItemEffect, setAddedItemEffect] = useState<number | null>(null);

  const categories: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Dishes', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'breakfast', label: 'Tiffins & Breakfast', icon: <Coffee className="w-4 h-4" /> },
    { id: 'lunch', label: 'Lunch Meals & Rices', icon: <Utensils className="w-4 h-4" /> },
    { id: 'dinner', label: 'Dinner Specials', icon: <Moon className="w-4 h-4" /> },
    { id: 'snacks', label: 'Evening Snacks', icon: <Sandwich className="w-4 h-4" /> },
    { id: 'beverages', label: 'Chai, Coffee & Drinks', icon: <CupSoda className="w-4 h-4" /> },
    { id: 'desserts', label: 'Sweets & Desserts', icon: <Cookie className="w-4 h-4" /> },
  ];

  // Filtering
  const filteredItems = items.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (vegetarianOnly && !item.isVegetarian) {
      return false;
    }
    if (veganOnly && !item.isVegan) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
    if (sortBy === 'prep-time') return a.preparationTimeMinutes - b.preparationTimeMinutes;
    if (sortBy === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
    return a.id - b.id;
  });

  const handleAddToCart = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    if (item.availabilityStatus === 'unavailable') return;
    addItem(item, 1);
    setAddedItemEffect(item.id);
    setTimeout(() => setAddedItemEffect(null), 1200);
  };

  const getCartQuantity = (itemId: number) => {
    const found = cart.find(ci => ci.menuItem.id === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/50 backdrop-blur-md text-emerald-100 text-xs font-semibold mb-3 border border-emerald-400/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Quick Pickup • No Counter Queues
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Fresh Tiffins, Meals & Rice Bowls Ready On Time
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Order your morning tiffins (dosa, idly, puri), afternoon meals & fried rices, or evening dinner specials. Pick up hot & fresh at your scheduled time.
          </p>
        </div>

        {/* Decorative graphic glow */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-4">
        {/* Top search & Sort */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dosa, idly, puri, egg rice, chicken rice, meals, biryani..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0 font-medium">
              <Filter className="w-3.5 h-3.5" />
              Sort:
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="recommended">Featured / Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="prep-time">Fastest Prep Time</option>
              <option value="rating">Top Rated (★)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Dietary toggles */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 text-xs">
          <span className="text-gray-500 font-medium">Dietary:</span>
          <button
            onClick={() => setVegetarianOnly(!vegetarianOnly)}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
              vegetarianOnly
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            🌱 Vegetarian
            {vegetarianOnly && <X className="w-3 h-3 ml-0.5" />}
          </button>

          <button
            onClick={() => setVeganOnly(!veganOnly)}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
              veganOnly
                ? 'bg-teal-100 text-teal-800 border-teal-300'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            🌿 100% Vegan
            {veganOnly && <X className="w-3 h-3 ml-0.5" />}
          </button>

          {(vegetarianOnly || veganOnly || searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setVegetarianOnly(false);
                setVeganOnly(false);
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="ml-auto text-emerald-600 hover:text-emerald-700 text-xs font-semibold underline underline-offset-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Menu items count status */}
      <div className="flex items-center justify-between text-xs font-medium text-gray-500 px-1">
        <span>
          Showing <strong className="text-gray-800">{sortedItems.length}</strong> canteen items
        </span>
        <span className="text-emerald-600 font-semibold">
          ⚡ Orders prepared fresh on order
        </span>
      </div>

      {/* Loading state skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs animate-pulse">
              <div className="h-44 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No dishes found</h3>
          <p className="text-xs text-gray-500">
            We couldn’t find any items matching your selected criteria. Try adjusting your search or filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setVegetarianOnly(false);
              setVeganOnly(false);
            }}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sortedItems.map(item => {
            const isWishlisted = wishlistIds.includes(item.id);
            const inCartQty = getCartQuantity(item.id);
            const isUnavailable = item.availabilityStatus === 'unavailable';
            const isLimited = item.availabilityStatus === 'limited';

            return (
              <div
                key={item.id}
                onClick={() => onOpenDetails(item)}
                className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1 ${
                  isUnavailable ? 'opacity-70 grayscale-[20%]' : ''
                }`}
              >
                {/* Image Section */}
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Gradient overlay for badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>

                  {/* Top badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                      {item.category}
                    </span>
                    {item.isVegetarian && (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-0.5">
                        🌱 Veg
                      </span>
                    )}
                    {item.isVegan && (
                      <span className="px-1.5 py-0.5 rounded-md bg-teal-600/90 text-white text-[10px] font-bold flex items-center gap-0.5">
                        🌿 Vegan
                      </span>
                    )}
                  </div>

                  {/* Wishlist button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onToggleWishlist(item.id);
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-md text-gray-700 flex items-center justify-center shadow-xs transition active:scale-90 z-10"
                    title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  >
                    <Heart
                      className={`w-4 h-4 transition ${
                        isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-600'
                      }`}
                    />
                  </button>

                  {/* Bottom Image Stats (Prep Time, Calories, Rating) */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-medium z-10">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 text-emerald-300" />
                      {item.preparationTimeMinutes}m prep
                    </span>
                    {item.calories && (
                      <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                        <Flame className="w-3 h-3 text-orange-400" />
                        {item.calories} kcal
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Header: Name & Rating */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-emerald-700 transition">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{item.rating || '4.8'}</span>
                      </div>
                    </div>

                    <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Availability Badge */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-50">
                    <div>
                      {item.availabilityStatus === 'available' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Available
                        </span>
                      ) : isLimited ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Limited Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Sold Out
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 flex items-center gap-0.5 group-hover:text-emerald-600 transition">
                      <Info className="w-3 h-3" />
                      Details
                    </span>
                  </div>

                  {/* Price & Action Button */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-xs text-gray-400 block font-medium">Price</span>
                      <span className="text-base font-extrabold text-gray-900 font-mono">
                        ₹{Number(item.price).toFixed(2)}
                      </span>
                    </div>

                    {/* Add to cart / quantity controls */}
                    {isUnavailable ? (
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed"
                      >
                        Unavailable
                      </button>
                    ) : inCartQty > 0 ? (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl p-1"
                      >
                        <button
                          onClick={() => updateQuantity(item.id, inCartQty - 1)}
                          className="w-7 h-7 rounded-lg bg-white text-emerald-700 flex items-center justify-center hover:bg-emerald-100 shadow-2xs font-bold transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-emerald-900 font-mono">
                          {inCartQty}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, inCartQty + 1)}
                          className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 shadow-2xs font-bold transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={e => handleAddToCart(e, item)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                          addedItemEffect === item.id
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-600/20'
                        }`}
                      >
                        {addedItemEffect === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Added!
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add to Cart
                          </>
                        )}
                      </button>
                    )}
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
