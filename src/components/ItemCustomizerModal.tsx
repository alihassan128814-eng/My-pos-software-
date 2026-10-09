import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Clock, Check } from 'lucide-react';
import { MenuItem, OrderLineItem, POSSettings } from '../types/pos';
import { formatCurrency } from '../utils/format';

interface ItemCustomizerModalProps {
  item: MenuItem | null;
  settings: POSSettings;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (lineItem: OrderLineItem) => void;
}

const MODIFIERS_LIST = [
  { name: 'Extra Fior di Latte', price: 150 },
  { name: 'San Marzano Dipping Sauce', price: 80 },
  { name: 'Truffle Oil Glaze', price: 180 },
  { name: 'Charred Jalapeños', price: 70 },
  { name: 'Artisan Stuffed Crust', price: 220 },
  { name: 'Fresh Basil & Oregano Infusion', price: 50 },
];

const SIZES: ('Small' | 'Medium' | 'Large')[] = ['Small', 'Medium', 'Large'];

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({
  item,
  settings,
  isOpen,
  onClose,
  onAdd,
}) => {
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(1); // Medium by default
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedSizeIndex(1);
      setSelectedModifiers([]);
      setQuantity(1);
      setNotes('');
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const hasSizes = Array.isArray(item.sizes) && item.sizes.length > 0;
  const basePrice = hasSizes ? item.sizes![selectedSizeIndex] : item.price || 0;
  const modifiersPrice = selectedModifiers.reduce((sum, modName) => {
    const mod = MODIFIERS_LIST.find((m) => m.name === modName);
    return sum + (mod ? mod.price : 0);
  }, 0);
  const unitPrice = basePrice + modifiersPrice;
  const totalPrice = unitPrice * quantity;

  const toggleModifier = (name: string) => {
    setSelectedModifiers((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );
  };

  const handleConfirm = () => {
    const lineItem: OrderLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      menuItemId: item.id,
      name: item.name,
      size: hasSizes ? SIZES[selectedSizeIndex] : 'Regular',
      unitPrice,
      quantity,
      modifiers: selectedModifiers,
      notes: notes.trim(),
    };
    onAdd(lineItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#ffffff] text-[#17191b] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with image/icon and close button */}
        <div className="relative p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex gap-4 items-start">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-amber-50 text-2xl flex items-center justify-center border border-amber-200/50 shadow-sm">
                {item.emoji}
              </div>
            )}
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900 leading-snug">
                {item.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-sm">
                {item.description}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Prep: ~{item.prepTime} mins</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-semibold">Stock: {item.stock} left</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Size Selector */}
          {hasSizes && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Select Crust & Size
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {SIZES.map((sizeName, idx) => {
                  const isSelected = selectedSizeIndex === idx;
                  const price = item.sizes![idx];
                  return (
                    <button
                      key={sizeName}
                      type="button"
                      onClick={() => setSelectedSizeIndex(idx)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-[#c93a2f] bg-[#c93a2f]/5 shadow-sm text-[#8f1d17] font-semibold'
                          : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm font-display font-bold">{sizeName}</span>
                      <span className="text-xs mt-1 tabular-nums font-medium text-slate-600">
                        {formatCurrency(price, settings.currencySymbol)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Artisan Modifiers & Extras */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
              <span>Artisan Extras & Dips</span>
              <span className="text-[11px] text-slate-400 font-normal">Optional</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODIFIERS_LIST.map((mod) => {
                const isChecked = selectedModifiers.includes(mod.name);
                return (
                  <button
                    key={mod.name}
                    type="button"
                    onClick={() => toggleModifier(mod.name)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isChecked
                        ? 'border-[#c93a2f] bg-[#c93a2f]/5 text-[#8f1d17]'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                          isChecked
                            ? 'bg-[#c93a2f] border-[#c93a2f] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-medium">{mod.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">
                      +{formatCurrency(mod.price, settings.currencySymbol)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kitchen Instructions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Kitchen Instructions / Special Notes
            </label>
            <input
              type="text"
              placeholder="e.g., Crispy crust, slice into 8, sauce on side"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-[#c93a2f] focus:ring-2 focus:ring-[#c93a2f]/10"
            />
          </div>
        </div>

        {/* Footer: Quantity and Add Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-display font-bold text-base min-w-[20px] text-center tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Ticket Action */}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#c93a2f] to-[#8f1d17] hover:brightness-105 active:scale-[0.99] text-white font-display font-bold text-sm shadow-md flex items-center justify-between transition-all"
          >
            <span>Add to Order Ticket</span>
            <span className="tabular-nums font-semibold">
              {formatCurrency(totalPrice, settings.currencySymbol)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
