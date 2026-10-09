import React, { useState } from 'react';
import { BarChart3, Download, Upload, Printer, Settings, DollarSign, PieChart, TrendingUp, Calendar, ShieldCheck } from 'lucide-react';
import { Order, POSSettings, POSState } from '../types/pos';
import { formatCurrency, exportOrdersToCSV } from '../utils/format';

interface ReportsViewProps {
  orders: Order[];
  settings: POSSettings;
  fullState: POSState;
  onUpdateSettings: (settings: POSSettings) => Promise<void>;
  onRestoreBackup: (state: POSState) => Promise<void>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  settings,
  fullState,
  onUpdateSettings,
  onRestoreBackup,
}) => {
  const [showZReport, setShowZReport] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState<POSSettings>({ ...settings });

  // Calculate today's metrics
  const todayDateStr = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === todayDateStr);
  const validOrders = todayOrders.filter((o) => o.status !== 'Void');
  const voidOrders = todayOrders.filter((o) => o.status === 'Void');

  const grossSales = validOrders.reduce((sum, o) => sum + o.totals.subtotal, 0);
  const totalDiscounts = validOrders.reduce((sum, o) => sum + o.totals.discountAmount, 0);
  const totalTax = validOrders.reduce((sum, o) => sum + o.totals.taxAmount, 0);
  const totalDelivery = validOrders.reduce((sum, o) => sum + o.totals.deliveryFee, 0);
  const netRevenue = validOrders.reduce((sum, o) => sum + o.totals.total, 0);

  const cashSales = validOrders
    .filter((o) => o.paymentMethod === 'Cash')
    .reduce((sum, o) => sum + o.totals.total, 0);

  const cardSales = validOrders
    .filter((o) => o.paymentMethod === 'Card')
    .reduce((sum, o) => sum + o.totals.total, 0);

  const walletSales = validOrders
    .filter((o) => o.paymentMethod === 'Mobile Wallet')
    .reduce((sum, o) => sum + o.totals.total, 0);

  const totalItemsSold = validOrders.reduce(
    (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
    0
  );

  const avgOrderValue = validOrders.length > 0 ? netRevenue / validOrders.length : 0;
  const expectedDrawerCash = settings.openingCashFloat + cashSales;

  // Top bestselling dishes
  const dishCounts: { [name: string]: number } = {};
  validOrders.forEach((o) => {
    o.items.forEach((i) => {
      dishCounts[i.name] = (dishCounts[i.name] || 0) + i.quantity;
    });
  });
  const topDishes = Object.entries(dishCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const handleDownloadBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Pizzeria_POS_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.menu) && Array.isArray(json.orders)) {
          await onRestoreBackup(json);
        }
      } catch (err) {
        console.warn('Could not parse backup JSON file:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings(settingsForm);
    setShowSettingsModal(false);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0] overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#e5e1d8] bg-white/70 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 leading-tight">
            Shift Financials & Day-End Z-Report
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cashier reconciliation, drawer float checks, Excel exports, and system backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportOrdersToCSV(orders, settings)}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-display font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadBackup}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-display font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Backup Data</span>
          </button>

          <label className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-display font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Restore</span>
            <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => setShowZReport(true)}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#c93a2f] to-[#8f1d17] text-white font-display font-bold text-xs shadow-md flex items-center gap-1.5 hover:brightness-105 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>End-of-Day Z-Report</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            title="Restaurant Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reports Content Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Top KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-[#e5e1d8] shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Today's Net Revenue
            </span>
            <div className="font-display font-extrabold text-2xl text-[#8f1d17] mt-1 tabular-nums">
              {formatCurrency(netRevenue, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {validOrders.length} orders completed today
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e5e1d8] shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Average Ticket Size
            </span>
            <div className="font-display font-extrabold text-2xl text-slate-900 mt-1 tabular-nums">
              {formatCurrency(avgOrderValue, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {totalItemsSold} total items baked & served
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e5e1d8] shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Cash Drawer Expected
            </span>
            <div className="font-display font-extrabold text-2xl text-emerald-800 mt-1 tabular-nums">
              {formatCurrency(expectedDrawerCash, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Float: {formatCurrency(settings.openingCashFloat, settings.currencySymbol)} + Cash:{' '}
              {formatCurrency(cashSales, settings.currencySymbol)}
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e5e1d8] shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Discounts & Void Reversals
            </span>
            <div className="font-display font-extrabold text-2xl text-amber-700 mt-1 tabular-nums">
              {formatCurrency(totalDiscounts, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {voidOrders.length} orders voided by manager
            </div>
          </div>
        </div>

        {/* Detailed Sections: Payment Methods & Bestsellers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Payment Method Breakdown */}
          <div className="p-5 bg-white rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-slate-900">
                Payment Method Reconciliation
              </h3>
              <PieChart className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-700">Cash Payments</span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(cashSales, settings.currencySymbol)} (
                    {netRevenue ? Math.round((cashSales / netRevenue) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${netRevenue ? (cashSales / netRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-700">Card / Terminal Payments</span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(cardSales, settings.currencySymbol)} (
                    {netRevenue ? Math.round((cardSales / netRevenue) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${netRevenue ? (cardSales / netRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-700">Mobile Wallet / QR</span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(walletSales, settings.currencySymbol)} (
                    {netRevenue ? Math.round((walletSales / netRevenue) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full"
                    style={{ width: `${netRevenue ? (walletSales / netRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-900">
              <span>Total Reconciled</span>
              <span className="tabular-nums">
                {formatCurrency(cashSales + cardSales + walletSales, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Top Selling Pizzas & Items */}
          <div className="p-5 bg-white rounded-2xl border border-[#e5e1d8] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-slate-900">
                Top Bestselling Dishes Today
              </h3>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {topDishes.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No dishes sold yet today.</div>
              ) : (
                topDishes.map(([dishName, qty], index) => (
                  <div key={dishName} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-display font-bold text-[11px] flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-medium text-slate-800">{dishName}</span>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {qty} {qty === 1 ? 'portion' : 'portions'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* End of Day Z-Report Modal */}
      {showZReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Daily Z-Report Closeout
              </h3>
              <button onClick={() => setShowZReport(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <pre
              id="printable-receipt"
              className="bg-[#fcfbf9] text-[#1a1a1a] p-4 rounded-xl border border-slate-200 font-mono text-[11px] leading-relaxed max-h-80 overflow-y-auto"
            >
              {[
                settings.restaurantName.toUpperCase().padStart(24),
                'END-OF-DAY Z-REPORT'.padStart(22),
                new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).padStart(28),
                `Cashier: ${settings.currentCashier}`,
                '--------------------------------',
                `Orders Count:         ${validOrders.length}`,
                `Voided Orders:        ${voidOrders.length}`,
                `Items Prepared:       ${totalItemsSold}`,
                '--------------------------------',
                `Gross Subtotal:       ${formatCurrency(grossSales, settings.currencySymbol)}`,
                `Discounts Given:     -${formatCurrency(totalDiscounts, settings.currencySymbol)}`,
                `Tax (GST) Collected:  ${formatCurrency(totalTax, settings.currencySymbol)}`,
                `Delivery Surcharge:   ${formatCurrency(totalDelivery, settings.currencySymbol)}`,
                '--------------------------------',
                `NET TOTAL REVENUE:    ${formatCurrency(netRevenue, settings.currencySymbol)}`,
                '--------------------------------',
                `Cash Tender:          ${formatCurrency(cashSales, settings.currencySymbol)}`,
                `Card / Terminal:      ${formatCurrency(cardSales, settings.currencySymbol)}`,
                `Mobile Wallets:       ${formatCurrency(walletSales, settings.currencySymbol)}`,
                '--------------------------------',
                `Opening Drawer Float: ${formatCurrency(settings.openingCashFloat, settings.currencySymbol)}`,
                `EXPECTED DRAWER CASH: ${formatCurrency(expectedDrawerCash, settings.currencySymbol)}`,
                '--------------------------------',
                'Z-Report Closed and Audited'.padStart(28),
              ].join('\n')}
            </pre>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowZReport(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#c93a2f] hover:bg-[#8f1d17] text-white flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Z-Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveSettings}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-600" />
                <span>Pizzeria Store Settings</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={settingsForm.restaurantName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, restaurantName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#c93a2f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={settingsForm.currencySymbol}
                    onChange={(e) => setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">GST / Tax Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settingsForm.taxRatePercent}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, taxRatePercent: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Delivery Fee</label>
                  <input
                    type="number"
                    min={0}
                    value={settingsForm.deliveryFee}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, deliveryFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Starting Cash Float</label>
                  <input
                    type="number"
                    min={0}
                    value={settingsForm.openingCashFloat}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, openingCashFloat: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Current Cashier</label>
                  <input
                    type="text"
                    value={settingsForm.currentCashier}
                    onChange={(e) => setSettingsForm({ ...settingsForm, currentCashier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Manager Security PIN</label>
                  <input
                    type="password"
                    value={settingsForm.managerPin}
                    onChange={(e) => setSettingsForm({ ...settingsForm, managerPin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Low Stock Warning Threshold</label>
                <input
                  type="number"
                  min={1}
                  value={settingsForm.lowStockThreshold}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, lowStockThreshold: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-[#c93a2f] hover:bg-[#8f1d17] text-white shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
