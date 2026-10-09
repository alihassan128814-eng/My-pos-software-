import React, { useState } from 'react';
import { Search, UserPlus, Phone, MapPin, ShoppingBag, Heart, ArrowRight } from 'lucide-react';
import { CustomerRecord, POSSettings } from '../types/pos';
import { formatCurrency, formatDate } from '../utils/format';

interface CustomerManagerProps {
  customers: CustomerRecord[];
  settings: POSSettings;
  onSaveCustomer: (customer: CustomerRecord) => Promise<void>;
  onSelectForOrder: (customer: CustomerRecord) => void;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers,
  settings,
  onSaveCustomer,
  onSelectForOrder,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCust, setEditingCust] = useState<CustomerRecord | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingCust({
      id: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      ordersCount: 0,
      totalSpent: 0,
      notes: '',
      createdAt: Date.now(),
    });
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCust || !editingCust.name.trim() || !editingCust.phone.trim()) return;

    await onSaveCustomer({
      ...editingCust,
      name: editingCust.name.trim(),
      phone: editingCust.phone.trim(),
    });
    setShowAddModal(false);
    setEditingCust(null);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0] overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#e5e1d8] bg-white/70 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 leading-tight">
            Customer Profiles & VIP Regulars
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quickly look up guest order history, delivery addresses and favorite artisan pizzas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#c93a2f] to-[#8f1d17] text-white font-display font-bold text-xs shadow-md hover:brightness-105 flex items-center gap-1.5 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Customer Profile</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 sm:p-5 pb-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone number or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#e5e1d8] rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c93a2f] shadow-sm"
          />
        </div>
      </div>

      {/* Customer Directory Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              No customers found. Click "Add Customer Profile" to create one.
            </div>
          ) : (
            filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-white rounded-2xl border border-[#e5e1d8] shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-display font-bold text-base text-slate-900">{c.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      {c.ordersCount} {c.ordersCount === 1 ? 'order' : 'orders'}
                    </span>
                  </div>

                  {c.address && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-2.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{c.address}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Lifetime Spend
                      </span>
                      <span className="font-display font-bold text-slate-900 tabular-nums">
                        {formatCurrency(c.totalSpent, settings.currencySymbol)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Favorite Dish
                      </span>
                      <span className="font-medium text-slate-700 truncate block">
                        {c.favoriteItem || 'None recorded'}
                      </span>
                    </div>
                  </div>

                  {c.notes && (
                    <div className="mt-2 text-[11px] text-amber-700 bg-amber-50/60 p-2 rounded-lg italic">
                      Note: {c.notes}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Joined {formatDate(c.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectForOrder(c)}
                    className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-[#c93a2f] text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>New Ticket</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {showAddModal && editingCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-display font-bold text-lg text-slate-900">
                {editingCust.id ? 'Edit Customer Profile' : 'New Customer Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marco Bellini"
                  value={editingCust.name}
                  onChange={(e) => setEditingCust({ ...editingCust, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#c93a2f]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0300-1234567"
                  value={editingCust.phone}
                  onChange={(e) => setEditingCust({ ...editingCust, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#c93a2f]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Delivery Address</label>
                <textarea
                  rows={2}
                  placeholder="Apartment, Street, Landmark"
                  value={editingCust.address}
                  onChange={(e) => setEditingCust({ ...editingCust, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#c93a2f]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Preference / Allergies Note</label>
                <input
                  type="text"
                  placeholder="e.g. Extra well done pizza crust, no plastic bags"
                  value={editingCust.notes}
                  onChange={(e) => setEditingCust({ ...editingCust, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#c93a2f]"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-[#c93a2f] hover:bg-[#8f1d17] text-white shadow-sm"
              >
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
