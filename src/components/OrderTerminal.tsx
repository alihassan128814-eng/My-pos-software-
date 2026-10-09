import React, { useState, useMemo } from 'react';
import { Search, Flame, Clock, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { MenuItem, ComboDeal, OrderLineItem, POSSettings } from '../types/pos';
import { formatCurrency } from '../utils/format';

interface OrderTerminalProps {
  menu: MenuItem[];
  combos: ComboDeal[];
  settings: POSSettings;
  onSelectItem: (item: MenuItem) => void;
  onAddCombo: (combo: ComboDeal) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const OrderTerminal: React.FC<OrderTerminalProps> = ({
  menu,
  combos,
  settings,
  onSelectItem,
  onAddCombo,
  searchInputRef,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract distinct categories
  const categories = useMemo(() => {
    const cats = ['All', ...Array.from(new Set(menu.map((m) => m.category)))];
    return cats;
  }, [menu]);

  // Filter items
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0] overflow-hidden">
      {/* Top Search & Filter Bar */}
      <div className="p-4 sm:p-5 pb-3 border-b border-[#e5e1d8] bg-white/70 backdrop-blur-sm space-y-3">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#9a978f]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search pizza, sides, beverages or ingredients (Press / or F2)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e5e1d8] rounded-xl text-xs sm:text-sm text-slate-800 placeholder-[#9a978f] focus:outline-none focus:border-[#c93a2f] focus:ring-2 focus:ring-[#c93a2f]/10 shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const count =
              cat === 'All' ? menu.length : menu.filter((m) => m.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#17191b] text-white shadow-sm'
                    : 'bg-white/80 text-slate-600 hover:text-slate-900 border border-[#e5e1d8] hover:bg-white'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Catalog Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Combo Specials Tray */}
        {combos.length > 0 && selectedCategory === 'All' && !searchQuery && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8f1d17]">
                <Flame className="w-4 h-4 text-[#c93a2f]" />
                <span>Chef's Bundled Combos & Feast Deals</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {combos.map((combo) => (
                <div
                  key={combo.id}
                  onClick={() => onAddCombo(combo)}
                  className="group relative p-3.5 bg-gradient-to-br from-amber-50/60 to-white rounded-2xl border border-amber-200/60 hover:border-[#c93a2f]/60 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-display font-bold text-sm text-slate-900 group-hover:text-[#8f1d17] transition-colors">
                        {combo.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                        {combo.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {combo.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-amber-100">
                    <span className="font-display font-extrabold text-sm text-[#8f1d17] tabular-nums">
                      {formatCurrency(combo.price, settings.currencySymbol)}
                    </span>
                    <span className="text-xs font-bold text-[#c93a2f] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Add Bundle</span>
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Cards Grid */}
        <div>
          {filteredMenu.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
              <div className="font-display font-bold text-sm text-slate-700">No matching dishes</div>
              <p className="text-xs text-slate-400">
                Try searching for something else or switch the category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5">
              {filteredMenu.map((item) => {
                const isLowStock = item.stock <= settings.lowStockThreshold && item.stock > 0;
                const isOut = item.stock <= 0 || item.isSoldOut;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isOut && onSelectItem(item)}
                    className={`group relative rounded-2xl border bg-white p-3.5 shadow-sm transition-all flex flex-col justify-between ${
                      isOut
                        ? 'opacity-50 grayscale cursor-not-allowed border-slate-200'
                        : 'hover:border-[#c93a2f]/50 hover:shadow-md cursor-pointer border-[#e5e1d8]'
                    }`}
                  >
                    <div>
                      {/* Image or Icon Container */}
                      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-amber-50 to-orange-50/50">
                            {item.emoji}
                          </div>
                        )}

                        {/* Sold out badge */}
                        {isOut && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs uppercase tracking-wider">
                              Sold Out
                            </span>
                          </div>
                        )}

                        {/* Tag indicators */}
                        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                          {item.tags.includes('bestseller') && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#17191b]/80 backdrop-blur-sm text-amber-300">
                              ★ Bestseller
                            </span>
                          )}
                          {item.tags.includes('veg') && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-700/80 backdrop-blur-sm text-white">
                              🌱 Veg
                            </span>
                          )}
                          {item.tags.includes('spicy') && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-700/80 backdrop-blur-sm text-white">
                              🌶️ Spicy
                            </span>
                          )}
                        </div>

                        {/* Prep time */}
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-300" />
                          <span>{item.prepTime}m</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h4 className="font-display font-bold text-sm text-slate-900 group-hover:text-[#8f1d17] transition-colors leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Pricing & Stock Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        {item.sizes ? (
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                              From
                            </span>
                            <span className="font-display font-bold text-sm text-slate-900 tabular-nums">
                              {formatCurrency(item.sizes[0], settings.currencySymbol)}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                              Price
                            </span>
                            <span className="font-display font-bold text-sm text-slate-900 tabular-nums">
                              {formatCurrency(item.price || 0, settings.currencySymbol)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        {isLowStock ? (
                          <span className="text-[10px] font-bold text-amber-600 block">
                            Only {item.stock} left
                          </span>
                        ) : !isOut ? (
                          <span className="text-[10px] text-slate-400 block">
                            Stock: {item.stock}
                          </span>
                        ) : null}

                        <span className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#c93a2f] group-hover:text-white text-slate-600 flex items-center justify-center transition-colors shadow-sm ml-auto mt-0.5">
                          <Plus className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
