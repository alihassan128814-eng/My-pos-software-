import React, { useState } from 'react';
import { Search, Printer, Ban, CheckCircle2, Clock, Filter, Eye } from 'lucide-react';
import { Order, POSSettings } from '../types/pos';
import { formatCurrency, formatTime, formatDate, generateThermalReceiptText } from '../utils/format';

interface OrdersHistoryProps {
  orders: Order[];
  settings: POSSettings;
  onVoidOrder: (orderId: string, pin: string, reason: string) => Promise<void>;
}

export const OrdersHistory: React.FC<OrdersHistoryProps> = ({
  orders,
  settings,
  onVoidOrder,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [voidModalOrder, setVoidModalOrder] = useState<Order | null>(null);
  const [managerPin, setManagerPin] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      search.trim() === '' ||
      String(o.orderNumber).includes(search) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (o.tableNumber && o.tableNumber.includes(search));

    const matchesType =
      filterType === 'All' ||
      (filterType === 'Active' && o.status !== 'Completed' && o.status !== 'Void') ||
      o.status === filterType;

    return matchesSearch && matchesType;
  });

  const handleConfirmVoid = async () => {
    if (!voidModalOrder) return;
    setVoidError('');
    try {
      await onVoidOrder(voidModalOrder.id, managerPin, voidReason || 'Customer Request');
      setVoidModalOrder(null);
      setManagerPin('');
      setVoidReason('');
    } catch (err: any) {
      setVoidError(err.message || 'Failed to void order');
    }
  };

  const handlePrintReceipt = (order: Order) => {
    setSelectedReceiptOrder(order);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0] overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 sm:p-5 border-b border-[#e5e1d8] bg-white/70 backdrop-blur-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900 leading-tight">
              Order Audit & Historical Records
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review invoices, reprint thermal tickets, and manage voids.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              {(['All', 'Active', 'Completed', 'Void'] as const).map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setFilterType(ft)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    filterType === ft
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order #, customer name, or table number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#e5e1d8] rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c93a2f] shadow-sm"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="bg-white rounded-2xl border border-[#e5e1d8] shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer / Table</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching orders found on record.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const itemCount = o.items.reduce((sum, i) => sum + i.quantity, 0);

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-display font-bold text-slate-900 text-sm tabular-nums">
                        #{o.orderNumber}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{formatTime(o.createdAt)}</div>
                        <div className="text-[11px] text-slate-400">{formatDate(o.createdAt)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {o.tableNumber ? `Table ${o.tableNumber}` : o.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400">{o.type}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="truncate font-medium text-slate-700">
                          {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                        <div className="text-[11px] text-slate-400">{itemCount} items total</div>
                      </td>
                      <td className="py-3 px-4 font-display font-bold text-slate-900 tabular-nums">
                        {formatCurrency(o.totals.total, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700">{o.paymentMethod}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            o.status === 'Completed'
                              ? 'bg-slate-100 text-slate-700'
                              : o.status === 'Void'
                              ? 'bg-rose-100 text-rose-800 line-through'
                              : o.status === 'Ready'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'Baking'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptOrder(o)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="View Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(o)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Reprint Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {o.status !== 'Void' && (
                          <button
                            type="button"
                            onClick={() => setVoidModalOrder(o)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Void Order (Manager PIN Required)"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Receipt Modal */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Receipt #{selectedReceiptOrder.orderNumber}
              </h3>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <pre className="bg-[#fcfbf9] text-[#1a1a1a] p-4 rounded-xl border border-slate-200 font-mono text-[11px] leading-relaxed max-h-80 overflow-y-auto">
              {generateThermalReceiptText(selectedReceiptOrder, settings)}
            </pre>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#c93a2f] hover:bg-[#8f1d17] text-white flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Authorization Modal */}
      {voidModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="font-display font-bold text-lg text-rose-950 flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <span>Void Order #{voidModalOrder.orderNumber}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Voiding will reverse sales revenue and automatically restock items back into inventory.
              </p>
            </div>

            {voidError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {voidError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Manager Security PIN
                </label>
                <input
                  type="password"
                  placeholder="Enter Manager PIN (Default: 1234)"
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#c93a2f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Reason for Cancellation
                </label>
                <select
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#c93a2f]"
                >
                  <option value="Customer Cancellation">Customer Cancellation</option>
                  <option value="Incorrect Items Tendered">Incorrect Items Tendered</option>
                  <option value="Kitchen Prep Mistake">Kitchen Prep Mistake</option>
                  <option value="Cashier Test Order">Cashier Test Order</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setVoidModalOrder(null);
                  setVoidError('');
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
