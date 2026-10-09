import React, { useState } from 'react';
import { PackageOpen, AlertTriangle, Plus, Trash2, ArrowUpRight, Flame } from 'lucide-react';
import { MenuItem, WasteRecord, POSSettings } from '../types/pos';
import { formatCurrency, formatTimeAgo } from '../utils/format';

interface InventoryManagerProps {
  menu: MenuItem[];
  waste: WasteRecord[];
  settings: POSSettings;
  onUpdateInventory: (updates: { id: number; stock: number }[]) => Promise<void>;
  onLogWaste: (wasteEntry: WasteRecord) => Promise<void>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  menu,
  waste,
  settings,
  onUpdateInventory,
  onLogWaste,
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'waste'>('stock');
  const [stockChanges, setStockChanges] = useState<{ [id: number]: number }>({});
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [wasteItemId, setWasteItemId] = useState<number>(menu[0]?.id || 1);
  const [wasteQty, setWasteQty] = useState<number>(1);
  const [wasteReason, setWasteReason] = useState<WasteRecord['reason']>('Burnt');
  const [wasteNotes, setWasteNotes] = useState<string>('');

  const lowStockItems = menu.filter((m) => m.stock <= settings.lowStockThreshold);

  const handleStockDelta = (id: number, current: number, delta: number) => {
    const curVal = stockChanges[id] !== undefined ? stockChanges[id] : current;
    const newVal = Math.max(0, curVal + delta);
    setStockChanges({ ...stockChanges, [id]: newVal });
  };

  const handleSaveStock = async () => {
    const updates = Object.entries(stockChanges).map(([id, stock]) => ({
      id: Number(id),
      stock,
    }));
    if (updates.length > 0) {
      await onUpdateInventory(updates);
      setStockChanges({});
    }
  };

  const handleSaveWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = menu.find((m) => m.id === wasteItemId);
    if (!item) return;

    const unitPrice = item.price || (item.sizes ? item.sizes[0] : 400);

    const entry: WasteRecord = {
      id: `waste-${Date.now()}`,
      timestamp: Date.now(),
      menuItemId: item.id,
      itemName: item.name,
      quantity: wasteQty,
      reason: wasteReason,
      staffName: settings.currentCashier,
      estimatedCost: unitPrice * wasteQty,
      notes: wasteNotes.trim(),
    };

    await onLogWaste(entry);
    setShowWasteModal(false);
    setWasteQty(1);
    setWasteNotes('');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0] overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#e5e1d8] bg-white/70 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 leading-tight">
            Inventory & Ingredient Waste Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time kitchen inventory counts, restock ingredients, and log waste.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'stock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Stock Levels ({menu.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('waste')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'waste' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Waste Incidents ({waste.length})
            </button>
          </div>

          {activeTab === 'waste' ? (
            <button
              type="button"
              onClick={() => setShowWasteModal(true)}
              className="py-2 px-3 rounded-xl bg-[#c93a2f] hover:bg-[#8f1d17] text-white font-display font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Log Kitchen Waste</span>
            </button>
          ) : (
            Object.keys(stockChanges).length > 0 && (
              <button
                type="button"
                onClick={handleSaveStock}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs shadow-md"
              >
                Save {Object.keys(stockChanges).length} Adjusted Items
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* Low Stock Warning Banner if applicable */}
        {lowStockItems.length > 0 && activeTab === 'stock' && (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">
                Low Inventory Warning ({lowStockItems.length} items below threshold of{' '}
                {settings.lowStockThreshold})
              </div>
              <div className="text-amber-800 mt-0.5">
                {lowStockItems.map((i) => `${i.name} (${i.stock})`).join(' · ')}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stock' ? (
          /* Stock Table */
          <div className="bg-white rounded-2xl border border-[#e5e1d8] shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Menu Recipe</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {menu.map((item) => {
                  const currentVal =
                    stockChanges[item.id] !== undefined ? stockChanges[item.id] : item.stock;
                  const isModified = stockChanges[item.id] !== undefined;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{item.emoji}</span>
                          <span className="font-display font-bold text-slate-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.category}</td>
                      <td className="py-3 px-4 font-display font-bold text-slate-900 text-sm tabular-nums">
                        <span className={isModified ? 'text-blue-600 underline' : ''}>
                          {currentVal}
                        </span>{' '}
                        units
                      </td>
                      <td className="py-3 px-4 text-slate-500 tabular-nums">
                        ≤ {settings.lowStockThreshold} units
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            currentVal <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : currentVal <= settings.lowStockThreshold
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {currentVal <= 0
                            ? 'Stockout'
                            : currentVal <= settings.lowStockThreshold
                            ? 'Reorder'
                            : 'Optimal'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleStockDelta(item.id, item.stock, -1)}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
                          title="Decrement 1"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStockDelta(item.id, item.stock, 5)}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
                          title="Restock +5"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStockDelta(item.id, item.stock, 20)}
                          className="px-2 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-bold"
                          title="Restock batch +20"
                        >
                          +20
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Waste Incidents Log */
          <div className="bg-white rounded-2xl border border-[#e5e1d8] shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Time Recorded</th>
                  <th className="py-3 px-4">Item Lost</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Est. Loss Value</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waste.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No kitchen waste logged. Great inventory discipline!
                    </td>
                  </tr>
                ) : (
                  waste.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatTimeAgo(w.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-display font-bold text-slate-900">
                        {w.itemName}
                      </td>
                      <td className="py-3 px-4 tabular-nums font-semibold">{w.quantity} pcs</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                          {w.reason}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-display font-bold text-rose-800 tabular-nums">
                        {formatCurrency(w.estimatedCost, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{w.staffName}</td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                        {w.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Waste Modal */}
      {showWasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveWaste}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <span>Log Kitchen Food Waste</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowWasteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Discarded Menu Dish</label>
                <select
                  value={wasteItemId}
                  onChange={(e) => setWasteItemId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {menu.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.emoji} {m.name} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={wasteQty}
                    onChange={(e) => setWasteQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Incident Reason</label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Burnt">Burnt in Woodfire Oven</option>
                    <option value="Dropped / Damaged">Dropped / Damaged Crust</option>
                    <option value="Wrong Order">Wrong Order Prepared</option>
                    <option value="Expired">Expired Dough / Prep</option>
                    <option value="Quality Check">Chef Quality Check</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Explanation / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Dough stuck to oven peel during launch"
                  value={wasteNotes}
                  onChange={(e) => setWasteNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setShowWasteModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Save Waste Log
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
