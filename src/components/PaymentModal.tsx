import React, { useState, useEffect } from 'react';
import { X, Check, Banknote, CreditCard, Smartphone, Printer, ArrowRight } from 'lucide-react';
import { PaymentMethod, OrderTotals, POSSettings, Order } from '../types/pos';
import { formatCurrency, generateThermalReceiptText } from '../utils/format';

interface PaymentModalProps {
  isOpen: boolean;
  totals: OrderTotals;
  settings: POSSettings;
  onClose: () => void;
  onConfirmPayment: (method: PaymentMethod, tendered?: number, change?: number) => Promise<Order | null>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  totals,
  settings,
  onClose,
  onConfirmPayment,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [tenderedAmount, setTenderedAmount] = useState<number>(0);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMethod('Cash');
      setTenderedAmount(totals.total);
      setCompletedOrder(null);
      setIsSubmitting(false);
    }
  }, [isOpen, totals.total]);

  if (!isOpen) return null;

  const changeDue = Math.max(0, tenderedAmount - totals.total);
  const isShort = method === 'Cash' && tenderedAmount < totals.total;

  // Quick denomination suggestions for cash
  const quickTenders = [
    totals.total,
    Math.ceil(totals.total / 100) * 100,
    Math.ceil(totals.total / 500) * 500,
    Math.ceil(totals.total / 1000) * 1000,
    5000,
  ].filter((v, i, a) => v >= totals.total && a.indexOf(v) === i).slice(0, 4);

  const handleComplete = async () => {
    if (isShort || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const order = await onConfirmPayment(
        method,
        method === 'Cash' ? tenderedAmount : totals.total,
        method === 'Cash' ? changeDue : 0
      );
      if (order) {
        setCompletedOrder(order);
        if (settings.autoPrintReceipt) {
          setTimeout(() => window.print(), 300);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-display font-bold text-xl text-slate-900">
              {completedOrder ? 'Payment Successful' : 'Checkout & Tender'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {completedOrder
                ? `Order #${completedOrder.orderNumber} sent to kitchen display`
                : `Total Balance: ${formatCurrency(totals.total, settings.currencySymbol)}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {completedOrder ? (
            /* Post-Payment Success View with Thermal Receipt Preview */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <div className="font-display font-bold text-sm text-emerald-950">
                    Order #{completedOrder.orderNumber} Paid & Printed
                  </div>
                  <div className="text-xs text-emerald-700">
                    Paid via {completedOrder.paymentMethod} · Change:{' '}
                    {formatCurrency(completedOrder.changeDue || 0, settings.currencySymbol)}
                  </div>
                </div>
              </div>

              {/* Thermal Receipt Preview Box */}
              <div className="relative">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Thermal Receipt Preview
                </div>
                <pre
                  id="printable-receipt"
                  className="bg-[#fcfbf9] text-[#1a1a1a] p-4 rounded-xl border border-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto shadow-inner max-h-56 select-all"
                >
                  {generateThermalReceiptText(completedOrder, settings)}
                </pre>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#c93a2f] to-[#8f1d17] text-white font-display font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:brightness-105 transition-all"
                >
                  <span>New Order Ticket</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Active Tender Form */
            <div className="space-y-6">
              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMethod('Cash')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      method === 'Cash'
                        ? 'border-[#c93a2f] bg-[#c93a2f]/5 text-[#8f1d17] font-semibold shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs">Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('Card')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      method === 'Card'
                        ? 'border-[#c93a2f] bg-[#c93a2f]/5 text-[#8f1d17] font-semibold shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs">Card / POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('Mobile Wallet')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      method === 'Mobile Wallet'
                        ? 'border-[#c93a2f] bg-[#c93a2f]/5 text-[#8f1d17] font-semibold shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-amber-600" />
                    <span className="text-xs">Mobile Wallet</span>
                  </button>
                </div>
              </div>

              {/* Cash Tender Details */}
              {method === 'Cash' ? (
                <div className="space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Cash Received from Customer
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={tenderedAmount || ''}
                        onChange={(e) => setTenderedAmount(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-2.5 text-lg font-display font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#c93a2f] focus:ring-2 focus:ring-[#c93a2f]/10 tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Quick Cash Suggestions */}
                  <div className="flex flex-wrap gap-2">
                    {quickTenders.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTenderedAmount(amt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          tenderedAmount === amt
                            ? 'bg-[#17191b] text-white border-[#17191b]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {formatCurrency(amt, settings.currencySymbol)}
                      </button>
                    ))}
                  </div>

                  {/* Change Due Display */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">
                      {isShort ? 'Short By' : 'Change to Return'}
                    </span>
                    <span
                      className={`font-display font-extrabold text-lg tabular-nums ${
                        isShort ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(
                        isShort ? totals.total - tenderedAmount : changeDue,
                        settings.currencySymbol
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Terminal Ready</div>
                    <div className="text-indigo-700 text-[11px] mt-0.5">
                      Tap card or scan QR on customer display for{' '}
                      {formatCurrency(totals.total, settings.currencySymbol)}.
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Order Button */}
              <button
                type="button"
                onClick={handleComplete}
                disabled={isShort || isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#c93a2f] to-[#8f1d17] hover:brightness-105 active:scale-[0.99] text-white font-display font-bold text-sm shadow-md disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>Confirm & Send to Kitchen</span>
                    <span className="text-white/80 tabular-nums font-semibold">
                      ({formatCurrency(totals.total, settings.currencySymbol)})
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
