import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F1', desc: 'Clear Current Ticket' },
    { key: 'F2 or /', desc: 'Focus Menu Search Bar' },
    { key: 'F3', desc: 'Hold Current Ticket' },
    { key: 'F4', desc: 'Recall Held Ticket Queue' },
    { key: 'F5 / Space', desc: 'Open Checkout Tender Screen' },
    { key: 'F6', desc: 'Jump to Counter Terminal' },
    { key: 'F7', desc: 'Jump to Kitchen KDS' },
    { key: 'F8', desc: 'Jump to Orders Audit Table' },
    { key: 'F9', desc: 'Jump to Shift Reports' },
    { key: 'Enter', desc: 'Confirm Selection / Submit Payment' },
    { key: 'Esc', desc: 'Dismiss Active Modal or Search' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#c93a2f]" />
            <h3 className="font-display font-bold text-lg text-slate-900">
              Kitchen & Cashier Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs"
            >
              <span className="font-medium text-slate-700">{s.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-mono font-bold text-slate-900 shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
          >
            Got it, Back to POS
          </button>
        </div>
      </div>
    </div>
  );
};
