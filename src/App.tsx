/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header, ActiveTab } from './components/Header';
import { OrderTerminal } from './components/OrderTerminal';
import { CartSidebar } from './components/CartSidebar';
import { ItemCustomizerModal } from './components/ItemCustomizerModal';
import { PaymentModal } from './components/PaymentModal';
import { KitchenDisplay } from './components/KitchenDisplay';
import { OrdersHistory } from './components/OrdersHistory';
import { MenuManager } from './components/MenuManager';
import { InventoryManager } from './components/InventoryManager';
import { CustomerManager } from './components/CustomerManager';
import { ReportsView } from './components/ReportsView';
import { ShortcutsModal } from './components/ShortcutsModal';
import {
  MenuItem,
  OrderLineItem,
  OrderType,
  OrderTotals,
  PaymentMethod,
  OrderStatus,
  Order,
  ComboDeal,
  CustomerRecord,
  HeldOrder,
  WasteRecord,
  POSSettings,
  POSState,
} from './types/pos';
import { INITIAL_STATE } from './data/initialData';
import { posApi } from './services/api';
import { formatCurrency } from './utils/format';
import { ShoppingBag } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<POSState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('terminal');

  // Terminal active cart state
  const [cartItems, setCartItems] = useState<OrderLineItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('Dine-in');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('1');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Modals
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initial load from server
  useEffect(() => {
    async function init() {
      try {
        const fetchedState = await posApi.getState();
        if (fetchedState) {
          setState(fetchedState);
        }
      } catch (err) {
        console.error('Initial state fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Compute order totals
  const totals: OrderTotals = useMemo(() => {
    const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round((taxableAmount * state.settings.taxRatePercent) / 100);
    const deliveryFee = orderType === 'Delivery' && subtotal > 0 ? state.settings.deliveryFee : 0;
    const total = taxableAmount + taxAmount + deliveryFee;

    return {
      subtotal,
      discountPercent,
      discountAmount,
      taxPercent: state.settings.taxRatePercent,
      taxAmount,
      deliveryFee,
      total,
    };
  }, [cartItems, discountPercent, orderType, state.settings]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't override if typing in an input or textarea (unless it's an F-key)
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      if (e.key === 'Escape') {
        setCustomizingItem(null);
        setIsPaymentOpen(false);
        setIsShortcutsOpen(false);
        setIsMobileCartOpen(false);
        return;
      }

      if (!isInput && (e.key === '?' || (e.ctrlKey && e.key === '/'))) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        handleClearOrder();
      } else if (e.key === 'F2' || (!isInput && e.key === '/')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleHoldOrder();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (state.heldOrders.length > 0) {
          handleRecallOrder(state.heldOrders[0]);
        }
      } else if (e.key === 'F5' || (!isInput && e.code === 'Space' && cartItems.length > 0)) {
        if (!isInput) {
          e.preventDefault();
          if (cartItems.length > 0) setIsPaymentOpen(true);
        }
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveTab('terminal');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setActiveTab('kitchen');
      } else if (e.key === 'F8') {
        e.preventDefault();
        setActiveTab('orders');
      } else if (e.key === 'F9') {
        e.preventDefault();
        setActiveTab('reports');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, state.heldOrders]);

  // Audio chime
  const playChime = () => {
    if (!state.settings.soundAlerts) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // AudioContext policy
    }
  };

  // Cart operations
  const handleSelectItem = (item: MenuItem) => {
    // If it has sizes or is a pizza, open customizer
    if (item.sizes && item.sizes.length > 0) {
      setCustomizingItem(item);
    } else {
      // Direct add regular single-priced item
      const lineItem: OrderLineItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        menuItemId: item.id,
        name: item.name,
        size: 'Regular',
        unitPrice: item.price || 0,
        quantity: 1,
        modifiers: [],
      };
      handleAddLineItem(lineItem);
    }
  };

  const handleAddCombo = (combo: ComboDeal) => {
    const lineItem: OrderLineItem = {
      id: `combo-${Date.now()}`,
      menuItemId: null,
      name: combo.name,
      size: 'Regular',
      unitPrice: combo.price,
      quantity: 1,
      modifiers: combo.items.map((i) => `${i.quantity}x ${i.name}`),
      isCombo: true,
    };
    handleAddLineItem(lineItem);
  };

  const handleAddLineItem = (lineItem: OrderLineItem) => {
    setCartItems((prev) => {
      // Match identical items with identical size and modifiers
      const existing = prev.find(
        (i) =>
          i.menuItemId === lineItem.menuItemId &&
          i.size === lineItem.size &&
          i.name === lineItem.name &&
          JSON.stringify(i.modifiers) === JSON.stringify(lineItem.modifiers)
      );
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + lineItem.quantity } : i
        );
      }
      return [...prev, lineItem];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearOrder = () => {
    if (cartItems.length === 0) return;
    if (confirm('Clear the current order ticket?')) {
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setOrderNotes('');
      setDiscountPercent(0);
    }
  };

  const handleHoldOrder = async () => {
    if (cartItems.length === 0) return;
    const held: HeldOrder = {
      id: `held-${Date.now()}`,
      heldAt: Date.now(),
      type: orderType,
      customerName: customerName || 'Walk-in Guest',
      tableNumber,
      notes: orderNotes,
      discountPercent,
      items: [...cartItems],
    };

    const updated = await posApi.manageHeldOrder('save', held);
    setState((prev) => ({ ...prev, heldOrders: updated }));
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNotes('');
    setDiscountPercent(0);
  };

  const handleRecallOrder = async (held: HeldOrder) => {
    setCartItems(held.items);
    setOrderType(held.type);
    setCustomerName(held.customerName === 'Walk-in Guest' ? '' : held.customerName);
    setTableNumber(held.tableNumber || '');
    setOrderNotes(held.notes || '');
    setDiscountPercent(held.discountPercent || 0);

    const updated = await posApi.manageHeldOrder('remove', undefined, held.id);
    setState((prev) => ({ ...prev, heldOrders: updated }));
    setActiveTab('terminal');
  };

  // Payment Confirmation
  const handleConfirmPayment = async (
    method: PaymentMethod,
    tendered?: number,
    change?: number
  ): Promise<Order | null> => {
    const orderData: Partial<Order> = {
      type: orderType,
      customerName: customerName || (orderType === 'Dine-in' ? `Table ${tableNumber}` : 'Walk-in Guest'),
      customerPhone,
      tableNumber: orderType === 'Dine-in' ? tableNumber : undefined,
      notes: orderNotes,
      items: cartItems,
      totals,
      paymentMethod: method,
      amountTendered: tendered,
      changeDue: change,
      cashierName: state.settings.currentCashier,
    };

    try {
      const res = await posApi.createOrder(orderData);
      setState(res.state);
      playChime();

      // Reset active cart
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setOrderNotes('');
      setDiscountPercent(0);

      return res.order;
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Could not save order. Please check local connectivity.');
      return null;
    }
  };

  // Kitchen status transition
  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await posApi.updateOrderStatus(orderId, status);
      setState(updated);
      playChime();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Void order
  const handleVoidOrder = async (orderId: string, pin: string, reason: string) => {
    const updated = await posApi.voidOrder(orderId, pin, reason);
    setState(updated);
  };

  // Menu operations
  const handleSaveMenuItem = async (item: MenuItem) => {
    const updated = await posApi.saveMenuItem(item);
    setState((prev) => ({ ...prev, menu: updated }));
  };

  const handleDeleteMenuItem = async (id: number) => {
    const updated = await posApi.deleteMenuItem(id);
    setState((prev) => ({ ...prev, menu: updated }));
  };

  // Inventory operations
  const handleUpdateInventory = async (updates: { id: number; stock: number }[]) => {
    const updated = await posApi.updateInventory(updates);
    setState((prev) => ({ ...prev, menu: updated }));
  };

  const handleLogWaste = async (wasteEntry: WasteRecord) => {
    const updated = await posApi.logWaste(wasteEntry);
    setState(updated);
  };

  // Customer operations
  const handleSaveCustomer = async (cust: CustomerRecord) => {
    const updated = await posApi.saveSettings(state.settings); // keep state in sync
    const res = await fetch('/api/pos/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cust),
    });
    if (res.ok) {
      const data = await res.json();
      setState((prev) => ({ ...prev, customers: data.customers }));
    }
  };

  const handleSelectCustomerForOrder = (cust: CustomerRecord) => {
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setActiveTab('terminal');
  };

  // Settings & Backup
  const handleUpdateSettings = async (settings: POSSettings) => {
    const updated = await posApi.saveSettings(settings);
    setState((prev) => ({ ...prev, settings: updated }));
  };

  const handleRestoreBackup = async (backup: POSState) => {
    const updated = await posApi.restoreBackup(backup);
    setState(updated);
  };

  const activeKitchenCount = state.orders.filter(
    (o) => o.status === 'New' || o.status === 'Baking'
  ).length;

  const lowStockCount = state.menu.filter(
    (m) => m.stock <= state.settings.lowStockThreshold
  ).length;

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f6f4f0]">
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={state.settings}
        activeKitchenCount={activeKitchenCount}
        lowStockCount={lowStockCount}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'terminal' && (
          <div className="flex-1 flex overflow-hidden w-full">
            <OrderTerminal
              menu={state.menu}
              combos={state.combos}
              settings={state.settings}
              onSelectItem={handleSelectItem}
              onAddCombo={handleAddCombo}
              searchInputRef={searchInputRef}
            />

            {/* Desktop Ticket Sidebar */}
            <div className="hidden xl:flex h-full">
              <CartSidebar
                items={cartItems}
                orderType={orderType}
                setOrderType={setOrderType}
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                tableNumber={tableNumber}
                setTableNumber={setTableNumber}
                orderNotes={orderNotes}
                setOrderNotes={setOrderNotes}
                discountPercent={discountPercent}
                setDiscountPercent={setDiscountPercent}
                totals={totals}
                settings={state.settings}
                heldOrders={state.heldOrders}
                customers={state.customers}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearOrder={handleClearOrder}
                onHoldOrder={handleHoldOrder}
                onRecallOrder={handleRecallOrder}
                onOpenPayment={() => setIsPaymentOpen(true)}
              />
            </div>

            {/* Mobile / Tablet Cart Floating Action Bar */}
            {totalCartCount > 0 && (
              <div className="xl:hidden fixed bottom-4 left-4 right-4 z-30">
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(true)}
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#17191b] text-white font-display font-bold text-sm shadow-2xl flex items-center justify-between border border-white/10"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#c93a2f] flex items-center justify-center text-xs">
                      {totalCartCount}
                    </div>
                    <span>View Order Ticket</span>
                  </div>
                  <span className="tabular-nums font-extrabold text-[#d9b560]">
                    {formatCurrency(totals.total, state.settings.currencySymbol)}
                  </span>
                </button>
              </div>
            )}

            {/* Mobile Cart Drawer */}
            {isMobileCartOpen && (
              <div className="xl:hidden fixed inset-0 z-40 flex flex-col bg-black/60 backdrop-blur-sm">
                <div className="flex-1" onClick={() => setIsMobileCartOpen(false)} />
                <div className="h-[88vh] bg-white rounded-t-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200">
                  <div className="p-3 bg-slate-100 flex items-center justify-between border-b border-slate-200">
                    <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-700">
                      Order Ticket ({totalCartCount} items)
                    </span>
                    <button
                      onClick={() => setIsMobileCartOpen(false)}
                      className="px-3 py-1 bg-white rounded-lg text-xs font-semibold shadow-sm text-slate-700"
                    >
                      Back to Menu
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <CartSidebar
                      items={cartItems}
                      orderType={orderType}
                      setOrderType={setOrderType}
                      customerName={customerName}
                      setCustomerName={setCustomerName}
                      customerPhone={customerPhone}
                      setCustomerPhone={setCustomerPhone}
                      tableNumber={tableNumber}
                      setTableNumber={setTableNumber}
                      orderNotes={orderNotes}
                      setOrderNotes={setOrderNotes}
                      discountPercent={discountPercent}
                      setDiscountPercent={setDiscountPercent}
                      totals={totals}
                      settings={state.settings}
                      heldOrders={state.heldOrders}
                      customers={state.customers}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemoveItem={handleRemoveItem}
                      onClearOrder={handleClearOrder}
                      onHoldOrder={handleHoldOrder}
                      onRecallOrder={handleRecallOrder}
                      onOpenPayment={() => {
                        setIsMobileCartOpen(false);
                        setIsPaymentOpen(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'kitchen' && (
          <KitchenDisplay
            orders={state.orders}
            settings={state.settings}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersHistory
            orders={state.orders}
            settings={state.settings}
            onVoidOrder={handleVoidOrder}
          />
        )}

        {activeTab === 'menu' && (
          <MenuManager
            menu={state.menu}
            settings={state.settings}
            onSaveItem={handleSaveMenuItem}
            onDeleteItem={handleDeleteMenuItem}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            menu={state.menu}
            waste={state.waste}
            settings={state.settings}
            onUpdateInventory={handleUpdateInventory}
            onLogWaste={handleLogWaste}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerManager
            customers={state.customers}
            settings={state.settings}
            onSaveCustomer={handleSaveCustomer}
            onSelectForOrder={handleSelectCustomerForOrder}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            orders={state.orders}
            settings={state.settings}
            fullState={state}
            onUpdateSettings={handleUpdateSettings}
            onRestoreBackup={handleRestoreBackup}
          />
        )}
      </main>

      {/* Global Modals */}
      <ItemCustomizerModal
        item={customizingItem}
        settings={state.settings}
        isOpen={!!customizingItem}
        onClose={() => setCustomizingItem(null)}
        onAdd={handleAddLineItem}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        totals={totals}
        settings={state.settings}
        onClose={() => setIsPaymentOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
