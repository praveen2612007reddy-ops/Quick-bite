import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  Clock,
  Flame,
  Star,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { MenuItem, AvailabilityStatus, Category } from '../../types/index.ts';

interface StaffMenuManagementProps {
  items: MenuItem[];
  onRefreshMenu: () => void;
}

export const StaffMenuManagement: React.FC<StaffMenuManagementProps> = ({
  items,
  onRefreshMenu,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('60.00');
  const [formCategory, setFormCategory] = useState<Category>('lunch');
  const [formImage, setFormImage] = useState('');
  const [formAvailability, setFormAvailability] = useState<AvailabilityStatus>('available');
  const [formVegetarian, setFormVegetarian] = useState(false);
  const [formVegan, setFormVegan] = useState(false);
  const [formCalories, setFormCalories] = useState<string>('400');
  const [formPrepTime, setFormPrepTime] = useState<string>('12');
  const [formDailyLimit, setFormDailyLimit] = useState<string>('50');

  const openAddModal = () => {
    setModalMode('add');
    setEditingItem(null);
    setFormName('');
    setFormDesc('');
    setFormPrice('60.00');
    setFormCategory('lunch');
    setFormImage(
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'
    );
    setFormAvailability('available');
    setFormVegetarian(false);
    setFormVegan(false);
    setFormCalories('450');
    setFormPrepTime('12');
    setFormDailyLimit('50');
  };

  const openEditModal = (item: MenuItem) => {
    setModalMode('edit');
    setEditingItem(item);
    setFormName(item.name);
    setFormDesc(item.description);
    setFormPrice(item.price);
    setFormCategory(item.category);
    setFormImage(item.imageUrl);
    setFormAvailability(item.availabilityStatus);
    setFormVegetarian(item.isVegetarian);
    setFormVegan(item.isVegan);
    setFormCalories(item.calories ? String(item.calories) : '');
    setFormPrepTime(String(item.preparationTimeMinutes));
    setFormDailyLimit(item.dailyLimit ? String(item.dailyLimit) : '');
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    const nextStatus: AvailabilityStatus =
      item.availabilityStatus === 'available'
        ? 'limited'
        : item.availabilityStatus === 'limited'
        ? 'unavailable'
        : 'available';

    try {
      await fetch(`/api/menu/${item.id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availabilityStatus: nextStatus }),
      });
      onRefreshMenu();
    } catch (e) {
      console.error('Failed to toggle availability:', e);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      setDeleteConfirmId(null);
      onRefreshMenu();
    } catch (e) {
      console.error('Failed to delete item:', e);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formName,
        description: formDesc,
        price: formPrice,
        category: formCategory,
        imageUrl: formImage,
        availabilityStatus: formAvailability,
        isVegetarian: formVegetarian,
        isVegan: formVegan,
        calories: formCalories ? parseInt(formCalories, 10) : null,
        preparationTimeMinutes: formPrepTime ? parseInt(formPrepTime, 10) : 15,
        dailyLimit: formDailyLimit ? parseInt(formDailyLimit, 10) : null,
      };

      if (modalMode === 'add') {
        await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && editingItem) {
        await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setModalMode(null);
      onRefreshMenu();
    } catch (e) {
      console.error('Error saving item:', e);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter items
  const filtered = items.filter(it => {
    if (selectedCategory !== 'all' && it.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!it.name.toLowerCase().includes(q) && !it.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Canteen Menu Inventory</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Add new dishes, edit pricing, or toggle live stock availability
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add New Dish
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search menu inventory..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs font-bold">
          {['all', 'breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts'].map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-xl capitalize transition ${
                selectedCategory === c
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {c === 'breakfast'
                ? 'Tiffins'
                : c === 'lunch'
                ? 'Lunch'
                : c === 'dinner'
                ? 'Dinner'
                : c}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Dish</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Prep Time</th>
                <th className="p-3.5">Stock Status (Click to Toggle)</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/70 transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-gray-900">{item.name}</span>
                          {item.isVegetarian && (
                            <span className="text-[10px] text-emerald-600 font-bold">🌱</span>
                          )}
                          {item.isVegan && (
                            <span className="text-[10px] text-teal-600 font-bold">🌿</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 max-w-xs truncate">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5 capitalize font-semibold text-gray-700">{item.category}</td>

                  <td className="p-3.5 font-bold font-mono text-gray-900">
                    ₹{Number(item.price).toFixed(2)}
                  </td>

                  <td className="p-3.5 text-gray-600">{item.preparationTimeMinutes} mins</td>

                  <td className="p-3.5">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition flex items-center gap-1.5 ${
                        item.availabilityStatus === 'available'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : item.availabilityStatus === 'limited'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                      title="Click to cycle status: Available -> Limited -> Out of Stock"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.availabilityStatus === 'available'
                            ? 'bg-emerald-500'
                            : item.availabilityStatus === 'limited'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      ></span>
                      <span className="capitalize">{item.availabilityStatus}</span>
                    </button>
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded-lg transition"
                        title="Edit dish"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">Delete this menu item?</h3>
            <p className="text-xs text-gray-500">
              This action permanently removes the dish from the canteen catalog.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleDeleteItem(deleteConfirmId)}
                className="flex-1 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-900 text-white">
              <h3 className="font-extrabold text-sm">
                {modalMode === 'add' ? 'Add New Canteen Dish' : 'Edit Menu Item'}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Crispy Teriyaki Chicken Bowl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Key ingredients and preparation highlights..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
                  >
                    <option value="breakfast">Tiffins & Breakfast</option>
                    <option value="lunch">Lunch Meals & Rices</option>
                    <option value="dinner">Dinner Specials</option>
                    <option value="snacks">Evening Snacks</option>
                    <option value="beverages">Beverages</option>
                    <option value="desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={formImage}
                  onChange={e => setFormImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[11px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Prep Time (min)</label>
                  <input
                    type="number"
                    required
                    value={formPrepTime}
                    onChange={e => setFormPrepTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={formCalories}
                    onChange={e => setFormCalories(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Daily Limit</label>
                  <input
                    type="number"
                    value={formDailyLimit}
                    onChange={e => setFormDailyLimit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={formVegetarian}
                    onChange={e => setFormVegetarian(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>🌱 Vegetarian</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={formVegan}
                    onChange={e => setFormVegan(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>🌿 Vegan</span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition"
                >
                  {submitting ? 'Saving...' : 'Save Dish'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
