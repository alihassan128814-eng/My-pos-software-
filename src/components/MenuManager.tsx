import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Check, Clock, Flame, Image as ImageIcon } from 'lucide-react';
import { MenuItem, POSSettings } from '../types/pos';
import { formatCurrency } from '../utils/format';

interface MenuManagerProps {
  menu: MenuItem[];
  settings: POSSettings;
  onSaveItem: (item: MenuItem) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  menu,
  settings,
  onSaveItem,
  onDeleteItem,
}) => {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [hasSizes, setHasSizes] = useState(false);

  const categories = Array.from(new Set(menu.map((m) => m.category)));

  const handleOpenAdd = () => {
    setIsNew(true);
    setHasSizes(false);
    setEditingItem({
      id: 0,
      name: '',
      category: categories[0] || 'Artisan Pizzas',
      emoji: '🍕',
      description: '',
      price: 650,
      prepTime: 12,
      tags: [],
      stock: 25,
      isSoldOut: false,
    });
  };

  const handleOpenEdit = (item: MenuItem) => {
    setIsNew(false);
    setHasSizes(Array.isArray(item.sizes) && item.sizes.length > 0);
    setEditingItem({ ...item });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    const payload: MenuItem = {
      ...editingItem,
      name: editingItem.name.trim(),
      category: editingItem.category.trim(),
      description: editingItem.description.trim(),
    };

    if (hasSizes) {
      delete payload.price;
      if (!payload.sizes || payload.sizes.length < 3) {
        payload.sizes = [650, 1100, 1550];
      }
    } else {
      delete payload.sizes;
      payload.price = payload.price || 500;
    }

    await onSaveItem(payload);
    setEditingItem(null);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0] overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#e5e1d8] bg-white/70 backdrop-blur-sm flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 leading-tight">
            Menu Configuration & Recipe Pricing
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage restaurant recipes, multi-tier crust sizing, modifiers and availability.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#c93a2f] to-[#8f1d17] text-white font-display font-bold text-xs shadow-md hover:brightness-105 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menu.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border bg-white shadow-sm flex flex-col justify-between transition-all ${
                item.isSoldOut ? 'opacity-60 border-slate-200' : 'border-[#e5e1d8] hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <span className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl border border-amber-200/50">
                        {item.emoji}
                      </span>
                    )}
                    <div>
                      <h4 className="font-display font-bold text-sm text-slate-900 leading-tight">
                        {item.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">{item.category}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.isSoldOut
                        ? 'bg-rose-100 text-rose-700'
                        : item.stock <= 5
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {item.isSoldOut ? 'Sold Out' : `Stock: ${item.stock}`}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>

                {/* Sizing & Pricing */}
                <div className="mt-3 pt-2 border-t border-slate-100 text-xs">
                  {item.sizes ? (
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="font-medium">S: {formatCurrency(item.sizes[0], settings.currencySymbol)}</span>
                      <span>·</span>
                      <span className="font-medium">M: {formatCurrency(item.sizes[1], settings.currencySymbol)}</span>
                      <span>·</span>
                      <span className="font-medium">L: {formatCurrency(item.sizes[2], settings.currencySymbol)}</span>
                    </div>
                  ) : (
                    <div className="font-display font-bold text-slate-900 tabular-nums">
                      {formatCurrency(item.price || 0, settings.currencySymbol)}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.prepTime} mins</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    title="Edit Item"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove ${item.name} from the active menu?`)) {
                        onDeleteItem(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-display font-bold text-lg text-slate-900">
                {isNew ? 'Create Menu Item' : `Edit ${editingItem.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-600 mb-1">Emoji</label>
                  <input
                    type="text"
                    value={editingItem.emoji}
                    onChange={(e) => setEditingItem({ ...editingItem, emoji: e.target.value })}
                    className="w-full text-center text-xl py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block font-bold text-slate-600 mb-1">Dish Name</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#c93a2f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Category</label>
                  <input
                    type="text"
                    list="cat-options"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#c93a2f]"
                  />
                  <datalist id="cat-options">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingItem.prepTime}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, prepTime: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#c93a2f]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Ingredients & Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#c93a2f]"
                />
              </div>

              {/* Pricing model switch */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700">Pricing Model</span>
                  <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setHasSizes(false)}
                      className={`px-2.5 py-1 rounded-md ${!hasSizes ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                    >
                      Single Price
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasSizes(true);
                        if (!editingItem.sizes) setEditingItem({ ...editingItem, sizes: [650, 1100, 1550] });
                      }}
                      className={`px-2.5 py-1 rounded-md ${hasSizes ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                    >
                      Small / Medium / Large
                    </button>
                  </div>
                </div>

                {hasSizes ? (
                  <div className="grid grid-cols-3 gap-2">
                    {['Small', 'Medium', 'Large'].map((sName, sIdx) => (
                      <div key={sName}>
                        <label className="block text-[11px] text-slate-500 font-medium mb-1">{sName}</label>
                        <input
                          type="number"
                          value={editingItem.sizes ? editingItem.sizes[sIdx] : 0}
                          onChange={(e) => {
                            const newSizes = [...(editingItem.sizes || [650, 1100, 1550])];
                            newSizes[sIdx] = Number(e.target.value);
                            setEditingItem({ ...editingItem, sizes: newSizes });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">Price (Rs)</label>
                    <input
                      type="number"
                      value={editingItem.price || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Stock & Availability */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Available Stock Units</label>
                  <input
                    type="number"
                    min={0}
                    value={editingItem.stock}
                    onChange={(e) => setEditingItem({ ...editingItem, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="sold-out-chk"
                    checked={editingItem.isSoldOut || false}
                    onChange={(e) => setEditingItem({ ...editingItem, isSoldOut: e.target.checked })}
                    className="w-4 h-4 rounded text-[#c93a2f]"
                  />
                  <label htmlFor="sold-out-chk" className="font-semibold text-slate-700 cursor-pointer">
                    Mark as Sold Out
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-[#c93a2f] hover:bg-[#8f1d17] text-white shadow-sm"
              >
                Save Recipe
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
