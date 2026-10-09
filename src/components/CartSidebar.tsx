import React, { useState } from 'react';
import { Trash2, Plus, Minus, PauseCircle, PlayCircle, CreditCard, ChevronRight, User, Phone, MapPin, Percent } from 'lucide-react';
import { OrderLineItem, OrderType, OrderTotals, CustomerRecord, HeldOrder, POSSettings } from '../types/pos';
import { formatCurrency } from '../utils/format';

interface CartSidebarProps {
  items: OrderLineItem[];
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  discountPercent: number;
  setDiscountPercent: (percent: number) => void;
  totals: OrderTotals;
  settings: POSSettings;
  heldOrders: HeldOrder[];
  customers: CustomerRecord[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearOrder: () => void;
  onHoldOrder: () => void;
  onRecallOrder: (heldOrder: HeldOrder) => void;
  onOpenPayment: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  items,
  orderType,
  setOrderType,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  tableNumber,
  setTableNumber,
  orderNotes,
  setOrderNotes,
  discountPercent,
  setDiscountPercent,
  totals,
  settings,
  heldOrders,
  customers,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onHoldOrder,
  onRecallOrder,
  onOpenPayment,
}) => {
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Customer filter
  const matchingCustomers = customerSearchQuery.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
          c.phone.includes(customerSearchQuery)
      )
    : [];

  const handleSelectCustomer = (cust: CustomerRecord) => {
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setShowCustomerDropdown(false);
    setCustomerSearchQuery('');
  };

  return (
    <aside className="w-full xl:w-[410px] bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-20">
      {/* Order Header / Mode Selector */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        {/* Order Type Segmented Control */}
        <div className="grid grid-cols-3 gap-1 bg-slate-200/80 p-1 rounded-xl">
          {(['Dine-in', 'Takeaway', 'Delivery'] as OrderType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setOrderType(type)}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                orderType === type
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Dynamic Context Fields (Table or Customer) */}
        {orderType === 'Dine-in' ? (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Table Number (e.g. 4)"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#c93a2f]"
              />
              <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold">#</span>
            </div>
            <input
              type="text"
              placeholder="Guest Name (Opt.)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#c93a2f]"
            />
          </div>
        ) : (
          <div className="space-y-2 relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setCustomerSearchQuery(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#c93a2f]"
                />
                <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#c93a2f]"
                />
                <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              </div>
            </div>

            {/* Quick Customer Autocomplete dropdown */}
            {showCustomerDropdown && matchingCustomers.length > 0 && (
              <div className="absolute top-10 left-0 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden text-xs">
                <div className="p-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Existing Customer
                </div>
                {matchingCustomers.slice(0, 3).map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleSelectCustomer(cust)}
                    className="w-full p-2 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-500">{cust.phone}</div>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      {cust.ordersCount} orders
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Order Note input */}
        <input
          type="text"
          placeholder="Ticket note (e.g. Pack sauces separately)"
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#c93a2f]"
        />
      </div>

      {/* Ticket Lines List */}
      <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
              🍕
            </div>
            <div className="font-display font-bold text-sm text-slate-700">Ticket is Empty</div>
            <p className="text-xs text-slate-400 max-w-[200px]">
              Tap any pizza, side, combo or craft beverage from the menu to build an order.
            </p>
          </div>
        ) : (
          items.map((line) => (
            <div key={line.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-display font-bold text-xs text-slate-900 truncate">
                    {line.name}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-slate-800">
                    {formatCurrency(line.unitPrice * line.quantity, settings.currencySymbol)}
                  </span>
                </div>

                {/* Size & Modifiers */}
                <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                  {line.size && line.size !== 'Regular' && (
                    <span className="font-medium text-slate-600">[{line.size}] </span>
                  )}
                  {line.modifiers && line.modifiers.length > 0 && (
                    <span className="text-slate-500">+ {line.modifiers.join(', ')}</span>
                  )}
                  {line.notes && (
                    <div className="italic text-amber-700 text-[10px]">Note: {line.notes}</div>
                  )}
                </div>

                {/* Quantity Stepper & Remove */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5 bg-slate-100 rounded-md px-1.5 py-0.5">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(line.id, -1)}
                      className="w-4 h-4 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold tabular-nums min-w-[14px] text-center">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(line.id, 1)}
                      className="w-4 h-4 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    @{formatCurrency(line.unitPrice, settings.currencySymbol)}
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(line.id)}
                    className="ml-auto text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Financial Totals */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-2 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span className="font-medium tabular-nums">
            {formatCurrency(totals.subtotal, settings.currencySymbol)}
          </span>
        </div>

        {/* Discount Selector */}
        <div className="flex items-center justify-between text-slate-600">
          <div className="flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-slate-400" />
            <span>Discount</span>
          </div>
          <div className="flex items-center gap-1">
            <select
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value={0}>0%</option>
              <option value={5}>5%</option>
              <option value={10}>10%</option>
              <option value={15}>15%</option>
              <option value={20}>20%</option>
            </select>
            {totals.discountAmount > 0 && (
              <span className="text-emerald-700 font-semibold tabular-nums">
                -{formatCurrency(totals.discountAmount, settings.currencySymbol)}
              </span>
            )}
          </div>
        </div>

        {/* Tax */}
        <div className="flex justify-between text-slate-600">
          <span>GST ({totals.taxPercent}%)</span>
          <span className="font-medium tabular-nums">
            {formatCurrency(totals.taxAmount, settings.currencySymbol)}
          </span>
        </div>

        {/* Delivery Fee if applicable */}
        {orderType === 'Delivery' && (
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(totals.deliveryFee, settings.currencySymbol)}
            </span>
          </div>
        )}

        {/* Total Due */}
        <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
          <span className="font-display font-bold text-sm text-slate-900">Total Due</span>
          <span className="font-display font-extrabold text-xl text-[#8f1d17] tabular-nums">
            {formatCurrency(totals.total, settings.currencySymbol)}
          </span>
        </div>
      </div>

      {/* Action Buttons: Hold, Clear, Pay */}
      <div className="p-4 pt-2 border-t border-slate-200 bg-white grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={onClearOrder}
          disabled={items.length === 0}
          title="Clear ticket (F1)"
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1"
        >
          <Trash2 className="w-4 h-4 text-slate-500" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={onHoldOrder}
          disabled={items.length === 0}
          title="Hold current order (F3)"
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1"
        >
          <PauseCircle className="w-4 h-4 text-amber-600" />
          <span>Hold</span>
        </button>

        <button
          type="button"
          onClick={() => setShowRecallModal(true)}
          disabled={heldOrders.length === 0}
          title="Recall held ticket (F4)"
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 relative"
        >
          <PlayCircle className="w-4 h-4 text-emerald-600" />
          <span>Recall</span>
          {heldOrders.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center">
              {heldOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenPayment}
          disabled={items.length === 0}
          title="Take Payment (Space or Enter)"
          className="col-span-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#c93a2f] to-[#8f1d17] hover:brightness-105 active:scale-[0.98] text-white disabled:opacity-40 font-display font-bold text-xs shadow-md transition-all flex flex-col items-center justify-center gap-1"
        >
          <CreditCard className="w-4 h-4 text-white" />
          <span>Charge</span>
        </button>
      </div>

      {/* Recall Modal */}
      {showRecallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-slate-900">Held Orders Queue</h3>
              <button
                onClick={() => setShowRecallModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {heldOrders.map((h) => {
                const itemCount = h.items.reduce((acc, i) => acc + i.quantity, 0);
                const holdTotal = h.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
                return (
                  <div
                    key={h.id}
                    className="p-3 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 bg-slate-50/50"
                  >
                    <div>
                      <div className="font-display font-bold text-xs text-slate-900">
                        {h.tableNumber ? `Table #${h.tableNumber}` : h.customerName || 'Held Guest'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {h.type} · {itemCount} items · {formatCurrency(holdTotal, settings.currencySymbol)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onRecallOrder(h);
                        setShowRecallModal(false);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#c93a2f] text-white hover:bg-[#8f1d17] transition-colors"
                    >
                      Recall
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setShowRecallModal(false)}
              className="w-full py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
