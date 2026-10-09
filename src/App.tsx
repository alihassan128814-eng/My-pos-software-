/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { formatCurrency, formatTime, formatDate, generateThermalReceiptText, exportOrdersToCSV } from './utils/format';
import {
  Bell,
  Search,
  Plus,
  Minus,
  Trash2,
  Clock,
  Printer,
  Ban,
  PackageOpen,
  Users,
  Settings,
  Download,
  Upload,
  Keyboard,
  Flame,
  CheckCircle2,
  Eye,
  X,
  Moon,
  Sun,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Receipt,
  UserCheck,
} from 'lucide-react';

export default function App() {
  const [state, setState] = useState<POSState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'sale' | 'orders' | 'report'>('sale');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('my_pizza_theme') === 'dark';
    } catch (e) {
      return false;
    }
  });

  // Terminal active ticket state
  const [cart, setCart] = useState<OrderLineItem[]>([]);
  const [cat, setCat] = useState<string>('Artisan Pizzas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>('Dine-in');
  const [who, setWho] = useState<string>('Table 1');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [bumpId, setBumpId] = useState<number | null>(null);

  // Orders view state
  const [ordersFilter, setOrdersFilter] = useState<'Open' | 'History'>('Open');
  const [kdsStatusTab, setKdsStatusTab] = useState<'All' | 'New' | 'Baking' | 'Ready'>('All');
  const [nowTick, setNowTick] = useState<number>(Date.now());

  // Modals state
  const [pickerItem, setPickerItem] = useState<MenuItem | null>(null);
  const [pickerSize, setPickerSize] = useState<number>(1); // 0=Small, 1=Medium, 2=Large
  const [pickerExtras, setPickerExtras] = useState<string[]>([]);
  const [pickerQty, setPickerQty] = useState<number>(1);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [tenderedAmount, setTenderedAmount] = useState<number>(0);

  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const [isMenuEditorOpen, setIsMenuEditorOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuSizedToggle, setMenuSizedToggle] = useState<boolean>(true);

  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [toolView, setToolView] = useState<'hub' | 'stock' | 'combos' | 'customers' | 'waste' | 'held'>('hub');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState<POSSettings>({ ...INITIAL_STATE.settings });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; msg: string; time: number; read: boolean }[]>([]);

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [showPaymentMixModal, setShowPaymentMixModal] = useState(false);

  // Void modal
  const [voidModalOrder, setVoidModalOrder] = useState<Order | null>(null);
  const [voidPin, setVoidPin] = useState('');
  const [voidReason, setVoidReason] = useState('Customer Cancellation');
  const [voidError, setVoidError] = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMsg(null), 2400);
  };

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    try {
      localStorage.setItem('my_pizza_theme', isDarkMode ? 'dark' : 'light');
    } catch (e) {}
  }, [isDarkMode]);

  // Audio Sound System (Web Audio API)
  const playSound = (type: 'add' | 'pay' | 'bell') => {
    if (!state.settings.soundAlerts) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'add') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'pay') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.38);
      } else if (type === 'bell') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (e) {}
  };

  // Clock tick & Late orders check
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
      );
      setNowTick(Date.now());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const s = await posApi.getState();
        if (s) {
          setState(s);
          setSettingsForm({ ...s.settings });
        }
      } catch (err) {
        console.warn('Initial load error:', err);
      }
    }
    init();
  }, []);

  // Available categories
  const categories = useMemo(() => {
    const set = Array.from(new Set(state.menu.map((m) => m.category)));
    return set.length ? set : ['Artisan Pizzas', 'Gourmet Sides', 'Drinks & Craft', 'Desserts'];
  }, [state.menu]);

  useEffect(() => {
    if (!categories.includes(cat) && categories.length > 0) {
      setCat(categories[0]);
    }
  }, [categories, cat]);

  // Financial calculations
  const totals: OrderTotals = useMemo(() => {
    const subtotal = cart.reduce((acc, c) => acc + c.unitPrice * c.quantity, 0);
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const taxable = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round((taxable * state.settings.taxRatePercent) / 100);
    const deliveryFee = orderType === 'Delivery' && subtotal > 0 ? state.settings.deliveryFee : 0;
    const total = taxable + taxAmount + deliveryFee;

    return {
      subtotal,
      discountPercent,
      discountAmount,
      taxPercent: state.settings.taxRatePercent,
      taxAmount,
      deliveryFee,
      total,
    };
  }, [cart, discountPercent, orderType, state.settings]);

  // Check late orders (>15 mins)
  useEffect(() => {
    const lateOrders = state.orders.filter(
      (o) =>
        (o.status === 'New' || o.status === 'Baking') &&
        nowTick - o.createdAt > 15 * 60 * 1000
    );
    if (lateOrders.length > 0) {
      const latestLate = lateOrders[0];
      const alertId = `late-${latestLate.id}`;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === alertId)) return prev;
        return [
          {
            id: alertId,
            msg: `Order #${latestLate.orderNumber} has waited over 15 minutes!`,
            time: Date.now(),
            read: false,
          },
          ...prev,
        ];
      });
    }
  }, [nowTick, state.orders]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      if (e.key === 'Escape') {
        setPickerItem(null);
        setIsPaymentOpen(false);
        setIsMenuEditorOpen(false);
        setIsToolsOpen(false);
        setIsSettingsOpen(false);
        setIsNotificationsOpen(false);
        setIsShortcutsOpen(false);
        setShowPaymentMixModal(false);
        setReceiptOrder(null);
        setVoidModalOrder(null);
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
        handleClearCart();
      } else if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleHoldCart();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (state.heldOrders.length > 0) {
          handleRecallHeld(state.heldOrders[0]);
        }
      } else if (e.key === 'F5' || (!isInput && e.code === 'Space' && cart.length > 0)) {
        if (!isInput && cart.length > 0) {
          e.preventDefault();
          handleOpenPayment();
        }
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveTab('sale');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setActiveTab('orders');
      } else if (e.key === 'F8') {
        e.preventDefault();
        setActiveTab('report');
      } else if (e.key === 'F9') {
        e.preventDefault();
        setIsMenuEditorOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, state.heldOrders]);

  // Cart operations
  const inCartCount = (itemId: number) => {
    return cart.filter((c) => c.menuItemId === itemId).reduce((acc, c) => acc + c.quantity, 0);
  };

  const handleCardBodyClick = (item: MenuItem) => {
    if (item.isSoldOut || item.stock <= 0) {
      showToast(`${item.name} is sold out`);
      return;
    }

    if (item.sizes && item.sizes.length > 0) {
      setPickerItem(item);
      setPickerSize(1); // Medium default
      setPickerExtras([]);
      setPickerQty(1);
    } else {
      handleQuickAdd(item);
    }
  };

  const handleQuickAdd = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (item.isSoldOut || item.stock <= 0) {
      showToast(`${item.name} is sold out`);
      return;
    }

    playSound('add');
    const isSized = item.sizes && item.sizes.length > 0;
    const defaultPrice = isSized ? item.sizes![1] : item.price || 0; // Medium by default
    const defaultSize = isSized ? 'Medium' : 'Regular';

    addToCart({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      menuItemId: item.id,
      name: isSized ? `${item.name} (${defaultSize})` : item.name,
      size: defaultSize,
      unitPrice: defaultPrice,
      quantity: 1,
      modifiers: [],
    });
  };

  const addToCart = (lineItem: OrderLineItem) => {
    setBumpId(lineItem.menuItemId);
    setTimeout(() => setBumpId(null), 350);

    setCart((prev) => {
      const match = prev.find(
        (c) =>
          c.menuItemId === lineItem.menuItemId &&
          c.size === lineItem.size &&
          c.name === lineItem.name &&
          JSON.stringify(c.modifiers) === JSON.stringify(lineItem.modifiers)
      );

      if (match) {
        return prev.map((c) =>
          c.id === match.id ? { ...c, quantity: c.quantity + lineItem.quantity } : c
        );
      }
      return [...prev, lineItem];
    });
  };

  const handleConfirmPicker = () => {
    if (!pickerItem) return;
    playSound('add');
    const basePrice = pickerItem.sizes ? pickerItem.sizes[pickerSize] : pickerItem.price || 0;
    const extrasPrice = pickerExtras.reduce((sum, ext) => {
      const p = ext.includes('+150') ? 150 : ext.includes('+200') ? 200 : ext.includes('+80') ? 80 : 50;
      return sum + p;
    }, 0);

    const sizeLabels: ('Small' | 'Medium' | 'Large')[] = ['Small', 'Medium', 'Large'];

    addToCart({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      menuItemId: pickerItem.id,
      name: `${pickerItem.name} (${sizeLabels[pickerSize]})`,
      size: sizeLabels[pickerSize],
      unitPrice: basePrice + extrasPrice,
      quantity: pickerQty,
      modifiers: pickerExtras,
    });
    setPickerItem(null);
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const item = prev[idx];
      if (!item) return prev;
      const nextQty = item.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      return prev.map((c, i) => (i === idx ? { ...c, quantity: nextQty } : c));
    });
  };

  const handleClearCart = () => {
    if (!cart.length) return;
    setCart([]);
    setWho('Table 1');
    setCustomerPhone('');
    setNote('');
    showToast('Order cleared');
  };

  const handleHoldCart = async () => {
    if (cart.length > 0) {
      const held: HeldOrder = {
        id: `held-${Date.now()}`,
        heldAt: Date.now(),
        type: orderType,
        customerName: who || 'Walk-in',
        tableNumber: orderType === 'Dine-in' ? who : undefined,
        notes: note,
        discountPercent,
        items: [...cart],
      };
      const updated = await posApi.manageHeldOrder('save', held);
      setState((prev) => ({ ...prev, heldOrders: updated }));
      setCart([]);
      setWho('Table 1');
      setCustomerPhone('');
      setNote('');
      showToast('Order held');
    } else {
      setToolView('held');
      setIsToolsOpen(true);
    }
  };

  const handleRecallHeld = async (held: HeldOrder) => {
    setCart(held.items);
    setOrderType(held.type);
    setWho(held.customerName || held.tableNumber || '');
    setNote(held.notes || '');
    setDiscountPercent(held.discountPercent || 0);

    const updated = await posApi.manageHeldOrder('remove', undefined, held.id);
    setState((prev) => ({ ...prev, heldOrders: updated }));
    setIsToolsOpen(false);
    showToast('Held order recalled');
  };

  const handleOpenPayment = () => {
    if (!cart.length) return;
    setPayMethod('Cash');
    setTenderedAmount(totals.total);
    setIsPaymentOpen(true);
  };

  const handleCompleteOrder = async () => {
    if (!cart.length) return;

    const changeDue = Math.max(0, tenderedAmount - totals.total);
    const orderData: Partial<Order> = {
      type: orderType,
      customerName: who.trim() || 'Walk-in',
      customerPhone: customerPhone.trim() || undefined,
      tableNumber: orderType === 'Dine-in' ? who.trim() : undefined,
      notes: note.trim(),
      items: [...cart],
      totals,
      paymentMethod: payMethod,
      amountTendered: payMethod === 'Cash' ? tenderedAmount : totals.total,
      changeDue: payMethod === 'Cash' ? changeDue : 0,
      cashierName: state.settings.currentCashier,
    };

    const res = await posApi.createOrder(orderData);
    setState(res.state);
    playSound('pay');

    // Notification
    setNotifications((prev) => [
      {
        id: `order-${res.order.orderNumber}`,
        msg: `New order #${res.order.orderNumber} sent to kitchen`,
        time: Date.now(),
        read: false,
      },
      ...prev,
    ]);

    setCart([]);
    setWho(orderType === 'Dine-in' ? 'Table 1' : '');
    setCustomerPhone('');
    setNote('');
    setDiscountPercent(0);
    setIsPaymentOpen(false);
    setIsMobileCartOpen(false);

    // Show thermal receipt
    setReceiptOrder(res.order);
  };

  // Kitchen transition actions
  const handleTransitionStatus = async (orderId: string, currentStatus: OrderStatus) => {
    const nextMap: { [key in OrderStatus]?: OrderStatus } = {
      New: 'Baking',
      Baking: 'Ready',
      Ready: 'Completed',
    };
    const next = nextMap[currentStatus];
    if (!next) return;

    const updated = await posApi.updateOrderStatus(orderId, next);
    setState(updated);

    const order = updated.orders.find((o) => o.id === orderId);
    if (next === 'Ready' && order) {
      playSound('bell');
      setNotifications((prev) => [
        {
          id: `ready-${order.id}`,
          msg: `Order #${order.orderNumber} is READY to serve!`,
          time: Date.now(),
          read: false,
        },
        ...prev,
      ]);
      showToast(`Order #${order.orderNumber} is Ready!`);
    } else {
      playSound('add');
    }
  };

  // Void order
  const handleConfirmVoid = async () => {
    if (!voidModalOrder) return;
    setVoidError('');
    try {
      const updated = await posApi.voidOrder(voidModalOrder.id, voidPin, voidReason);
      setState(updated);
      setVoidModalOrder(null);
      setVoidPin('');
      showToast(`Order #${voidModalOrder.orderNumber} voided`);
    } catch (e: any) {
      setVoidError(e.message || 'Incorrect Manager PIN');
    }
  };

  // Filtered menu
  const filteredMenu = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return state.menu.filter((m) => {
      const matchesSearch =
        q === '' ||
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q);
      const matchesCat = q ? true : m.category === cat;
      return matchesSearch && matchesCat;
    });
  }, [state.menu, cat, searchQuery]);

  // Open orders
  const openOrders = useMemo(() => {
    return state.orders
      .filter((o) => o.status !== 'Completed' && o.status !== 'Void')
      .filter((o) => kdsStatusTab === 'All' || o.status === kdsStatusTab)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [state.orders, kdsStatusTab]);

  const allOpenCount = state.orders.filter((o) => o.status !== 'Completed' && o.status !== 'Void').length;
  const newCount = state.orders.filter((o) => o.status === 'New').length;
  const bakingCount = state.orders.filter((o) => o.status === 'Baking').length;
  const readyCount = state.orders.filter((o) => o.status === 'Ready').length;

  const unreadNotesCount = notifications.filter((n) => !n.read).length;

  // Day end stats
  const todayDateStr = new Date().toDateString();
  const todayOrders = state.orders.filter((o) => new Date(o.createdAt).toDateString() === todayDateStr);
  const validTodayOrders = todayOrders.filter((o) => o.status !== 'Void');
  const todayRevenue = validTodayOrders.reduce((sum, o) => sum + o.totals.total, 0);
  const todayItemsSold = validTodayOrders.reduce(
    (sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );
  const todayVoidCount = todayOrders.filter((o) => o.status === 'Void').length;

  const byPayment = (m: PaymentMethod) =>
    validTodayOrders.filter((o) => o.paymentMethod === m).reduce((sum, o) => sum + o.totals.total, 0);

  // Quick Table Chips
  const tableChips = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'VIP'];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg)] text-[var(--ink)] select-none">
      {/* ===== HEADER ===== */}
      <header className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2.5 sm:py-3 bg-[var(--hd)] text-[#ffffff] border-b border-white/10 shrink-0">
        <div
          onClick={() => setActiveTab('sale')}
          className="brand disp flex items-center gap-2.5 cursor-pointer font-extrabold text-lg sm:text-xl text-white group"
        >
          <i className="brand-icon group-hover:scale-110 transition-transform"></i>
          <span className="tracking-tight">{state.settings.restaurantName}</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-1 bg-white/10 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('sale')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'sale' ? 'bg-[#ffffff] text-[#14181a] shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            Sale
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'orders' ? 'bg-[#ffffff] text-[#14181a] shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            <span>Orders</span>
            {allOpenCount > 0 && (
              <em className="not-italic px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--red)] text-white">
                {allOpenCount}
              </em>
            )}
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'report' ? 'bg-[#ffffff] text-[#14181a] shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            Today
          </button>
        </nav>

        <div className="flex-1"></div>

        {/* Clock & Cashier Chip */}
        <span className="hidden md:inline text-xs font-mono text-white/60 tabular-nums">
          {currentTime}
        </span>

        <span className="hidden sm:inline px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-white/90 border border-white/10">
          {state.settings.currentCashier}
        </span>

        {/* Theme Toggle (Sun / Moon) */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          title={isDarkMode ? 'Switch to Light theme' : 'Switch to Dark theme'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-200" />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => {
            setIsNotificationsOpen(true);
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          }}
          className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotesCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--red)] text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
              {unreadNotesCount}
            </span>
          )}
        </button>

        {/* Tools / Feature Pack Button */}
        <button
          onClick={() => {
            setToolView('hub');
            setIsToolsOpen(true);
          }}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors"
        >
          <Layers className="w-4 h-4 text-[#d9b560]" />
          <span className="hidden sm:inline">Tools</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => {
            setSettingsForm({ ...state.settings });
            setIsSettingsOpen(true);
          }}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </header>

      {/* ===== MAIN VIEW AREA ===== */}
      <main className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* VIEW 1: SALE (ORDER TERMINAL) */}
        {activeTab === 'sale' && (
          <div className="flex-1 flex overflow-hidden w-full">
            {/* Catalog Column */}
            <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 gap-3 overflow-hidden">
              {/* Search & Edit Menu Toolbar */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--mute)]" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search menu (Press / or F2)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--red)] shadow-sm"
                  />
                </div>
                <button
                  onClick={() => setIsMenuEditorOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-xs font-semibold text-[var(--mute)] hover:text-[var(--ink)] hover:border-slate-400 whitespace-nowrap shadow-sm"
                >
                  Edit menu
                </button>
              </div>

              {/* Category Pills Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
                {categories.map((c) => {
                  const count = state.menu.filter((m) => m.category === c).length;
                  const isSelected = cat === c;
                  return (
                    <button
                      key={c}
                      onClick={() => {
                        setCat(c);
                        setSearchQuery('');
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)] shadow-sm'
                          : 'bg-[var(--panel)] text-[var(--mute)] border-[var(--line)] hover:border-slate-400'
                      }`}
                    >
                      <span>{c}</span>
                      <em className="not-italic text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                        {count}
                      </em>
                    </button>
                  );
                })}
              </div>

              {/* Combo Specials Tray */}
              {state.combos.length > 0 && !searchQuery && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
                  {state.combos.map((combo) => (
                    <button
                      key={combo.id}
                      onClick={() => {
                        playSound('add');
                        addToCart({
                          id: `combo-${Date.now()}`,
                          menuItemId: null,
                          name: `${combo.name} (Combo)`,
                          size: 'Regular',
                          unitPrice: combo.price,
                          quantity: 1,
                          modifiers: combo.items.map((i) => `${i.quantity}x ${i.name}`),
                          isCombo: true,
                        });
                        showToast(`${combo.name} added to order`);
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:border-[var(--red)] text-xs font-semibold whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <span>🍕 {combo.name}</span>
                      <span className="font-bold text-[var(--red)] tabular-nums">
                        {formatCurrency(combo.price, state.settings.currencySymbol)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Menu Items Grid */}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 content-start pb-20 xl:pb-4">
                {filteredMenu.map((item) => {
                  const inCart = inCartCount(item.id);
                  const isSized = !!(item.sizes && item.sizes.length > 0);
                  const isSoldOut = item.isSoldOut || item.stock <= 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleCardBodyClick(item)}
                      className={`mcard relative flex flex-col justify-between p-3.5 rounded-2xl border bg-[var(--panel)] shadow-sm transition-all cursor-pointer select-none ${
                        isSoldOut
                          ? 'opacity-50 grayscale border-[var(--line)]'
                          : 'border-[var(--line)] hover:border-[var(--red)]'
                      }`}
                    >
                      {/* Top Badges */}
                      {isSoldOut ? (
                        <i className="not-italic absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--ink)] text-[var(--bg)] z-10">
                          Sold out
                        </i>
                      ) : inCart > 0 ? (
                        <i
                          className={`not-italic absolute top-2 right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-[var(--red)] text-white text-xs font-bold flex items-center justify-center z-10 shadow-sm ${
                            bumpId === item.id ? 'bump-badge' : ''
                          }`}
                        >
                          {inCart}
                        </i>
                      ) : null}

                      <div>
                        {/* Top: Emoji / Photo + Prep Time */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-11 h-11 rounded-xl object-cover border border-[var(--line)] shadow-inner"
                            />
                          ) : (
                            <span className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl bg-[#c4342a18]">
                              {item.emoji}
                            </span>
                          )}
                          <span className="text-[11px] font-medium text-[var(--mute)] bg-[var(--chip)] px-2 py-0.5 rounded-full">
                            ⏱ {item.prepTime} min
                          </span>
                        </div>

                        {/* Title & Description */}
                        <b className="disp text-sm font-bold text-[var(--ink)] leading-snug line-clamp-1 block">
                          {item.name}
                        </b>
                        <span className="text-[11px] text-[var(--mute)] line-clamp-2 mt-0.5 block leading-tight">
                          {item.description || '—'}
                        </span>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.includes('veg') && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700">
                                🌱 Veg
                              </span>
                            )}
                            {item.tags.includes('spicy') && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700">
                                🌶️ Spicy
                              </span>
                            )}
                            {item.tags.includes('bestseller') && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700">
                                ★ Best
                              </span>
                            )}
                          </div>
                        )}

                        {/* Sizes Preview */}
                        {isSized && (
                          <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] text-center font-medium tabular-nums">
                            {item.sizes!.map((v, i) => (
                              <span key={i} className="bg-[var(--chip)] rounded py-0.5">
                                <em className="not-italic opacity-60 mr-0.5">
                                  {['S', 'M', 'L'][i]}
                                </em>
                                {Math.round(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer: Price & Quick Add Button */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-dashed border-[var(--line)]">
                        <div className="flex items-baseline gap-1">
                          {isSized && <em className="not-italic text-[10px] text-[var(--mute)]">From</em>}
                          <strong className="font-display font-bold text-sm text-[var(--ink)] tabular-nums">
                            {formatCurrency(isSized ? item.sizes![0] : item.price || 0, state.settings.currencySymbol)}
                          </strong>
                        </div>

                        {/* 1-Tap Quick Add Button */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(item, e)}
                          title="Quick add default"
                          className="w-7 h-7 rounded-full bg-[var(--red)] text-white text-base font-bold flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Cart / Ticket Sidebar */}
            <aside className="hidden xl:flex w-[390px] bg-[var(--panel)] border-l border-[var(--line)] flex-col shadow-md shrink-0">
              {/* Ticket Header */}
              <div className="p-4 border-b border-[var(--line)] space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <b className="disp text-lg font-extrabold text-[var(--ink)]">
                      Order #{state.nextOrderNumber}
                    </b>
                    <span className="text-xs text-[var(--mute)] ml-2">
                      {cart.reduce((a, c) => a + c.quantity, 0)} items
                    </span>
                  </div>
                </div>

                {/* Dine-in, Takeaway, Delivery */}
                <div className="grid grid-cols-3 gap-1 bg-[var(--chip)] p-1 rounded-xl">
                  {(['Dine-in', 'Takeaway', 'Delivery'] as OrderType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setOrderType(t)}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        orderType === t ? 'bg-[var(--red)] text-white shadow-sm' : 'text-[var(--mute)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Quick Table Selector Chips for Dine-in */}
                {orderType === 'Dine-in' && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                    {tableChips.map((tChip) => (
                      <button
                        key={tChip}
                        type="button"
                        onClick={() => setWho(tChip)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                          who === tChip
                            ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                            : 'bg-[var(--chip)] text-[var(--mute)] border-[var(--line)] hover:border-slate-400'
                        }`}
                      >
                        {tChip}
                      </button>
                    ))}
                  </div>
                )}

                {/* Table / Customer Name & Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={orderType === 'Dine-in' ? 'Table / Guest' : 'Customer name'}
                    value={who}
                    onChange={(e) => setWho(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--red)]"
                  />
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--red)]"
                  />
                </div>

                {/* Order note */}
                <input
                  type="text"
                  placeholder="Ticket instruction (e.g. Extra crisp, sauce on side)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--red)]"
                />
              </div>

              {/* Order Lines List */}
              <div className="flex-1 overflow-y-auto p-4 divide-y divide-dashed divide-[var(--line)]">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--mute)] space-y-2">
                    <div className="eic w-14 h-14 rounded-full bg-[var(--chip)] mx-auto flex items-center justify-center">
                      <i className="logo"></i>
                    </div>
                    <b className="disp text-base font-bold text-[var(--ink)]">No items yet</b>
                    <span className="text-xs">Tap a menu item or "+" to build an order ticket.</span>
                  </div>
                ) : (
                  cart.map((line, idx) => (
                    <div key={line.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-[var(--ink)] truncate">
                          {line.name}
                        </div>
                        {line.modifiers && line.modifiers.length > 0 && (
                          <div className="text-[11px] text-[var(--mute)]">
                            + {line.modifiers.join(', ')}
                          </div>
                        )}
                        <div className="text-[10px] text-[var(--mute)] tabular-nums mt-0.5">
                          {formatCurrency(line.unitPrice, state.settings.currencySymbol)} each
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center bg-[var(--chip)] rounded-lg p-0.5">
                            <button
                              onClick={() => updateCartQty(idx, -1)}
                              className="w-6 h-6 flex items-center justify-center rounded bg-[var(--panel)] font-bold text-xs"
                            >
                              -
                            </button>
                            <b className="min-w-[24px] text-center text-xs tabular-nums">
                              {line.quantity}
                            </b>
                            <button
                              onClick={() => updateCartQty(idx, 1)}
                              className="w-6 h-6 flex items-center justify-center rounded bg-[var(--panel)] font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="font-semibold text-xs tabular-nums text-[var(--ink)]">
                          {formatCurrency(line.unitPrice * line.quantity, state.settings.currencySymbol)}
                        </span>
                        <button
                          onClick={() => updateCartQty(idx, -9999)}
                          className="text-[var(--mute)] hover:text-[var(--red)] p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bill Totals Summary */}
              <div className="p-4 border-t border-dashed border-[var(--line)] bg-[var(--panel)] space-y-1.5 text-xs text-[var(--mute)]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-[var(--ink)]">
                    {formatCurrency(totals.subtotal, state.settings.currencySymbol)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>
                    Discount{' '}
                    <select
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="px-2 py-0.5 rounded border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-xs ml-1"
                    >
                      <option value={0}>None</option>
                      <option value={5}>5%</option>
                      <option value={10}>10%</option>
                      <option value={20}>20%</option>
                    </select>
                  </span>
                  <span className="tabular-nums font-medium text-emerald-700">
                    - {formatCurrency(totals.discountAmount, state.settings.currencySymbol)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>GST {totals.taxPercent}%</span>
                  <span className="tabular-nums font-medium text-[var(--ink)]">
                    {formatCurrency(totals.taxAmount, state.settings.currencySymbol)}
                  </span>
                </div>

                {orderType === 'Delivery' && (
                  <div className="flex justify-between">
                    <span>Delivery fee</span>
                    <span className="tabular-nums font-medium text-[var(--ink)]">
                      {formatCurrency(totals.deliveryFee, state.settings.currencySymbol)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-[var(--ink)] flex justify-between items-baseline font-bold">
                  <span className="text-sm text-[var(--ink)]">Total</span>
                  <span className="disp text-2xl font-extrabold text-[var(--ink)] tabular-nums">
                    {formatCurrency(totals.total, state.settings.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Hold, Clear, Pay */}
              <div className="p-4 pt-0 grid grid-cols-4 gap-2">
                <button
                  onClick={handleHoldCart}
                  disabled={!cart.length && !state.heldOrders.length}
                  className="p-3 rounded-xl bg-[var(--chip)] hover:bg-slate-200 text-xs font-semibold text-[var(--mute)] hover:text-[var(--ink)] disabled:opacity-40"
                >
                  {cart.length ? 'Hold' : `Recall (${state.heldOrders.length})`}
                </button>
                <button
                  onClick={handleClearCart}
                  disabled={!cart.length}
                  className="p-3 rounded-xl bg-[var(--chip)] hover:bg-slate-200 text-xs font-semibold text-[var(--mute)] hover:text-[var(--ink)] disabled:opacity-40"
                >
                  Clear
                </button>
                <button
                  onClick={handleOpenPayment}
                  disabled={!cart.length}
                  className="col-span-2 py-3 px-4 rounded-xl bg-[var(--red)] hover:bg-[var(--redd)] text-white font-display font-bold text-sm shadow-md disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{cart.length ? `Charge ${formatCurrency(totals.total, state.settings.currencySymbol)}` : 'Take payment'}</span>
                </button>
              </div>
            </aside>

            {/* Mobile Bottom Order Bar */}
            {cart.length > 0 && (
              <div className="xl:hidden fixed bottom-3 left-3 right-3 z-30">
                <button
                  onClick={() => setIsMobileCartOpen(true)}
                  className="w-full h-14 px-5 rounded-2xl bg-[var(--red)] text-white font-display font-bold text-base shadow-2xl flex items-center justify-between"
                >
                  <span>View order · {cart.reduce((a, c) => a + c.quantity, 0)} items</span>
                  <b className="tabular-nums font-extrabold">
                    {formatCurrency(totals.total, state.settings.currencySymbol)}
                  </b>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ORDERS (KITCHEN & AUDIT) */}
        {activeTab === 'orders' && (
          <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-5 overflow-y-auto gap-3.5">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="disp text-2xl font-bold text-[var(--ink)]">Orders</h2>
                <p className="text-xs text-[var(--mute)] mt-0.5">
                  {ordersFilter === 'Open'
                    ? allOpenCount
                      ? `${allOpenCount} orders in progress in the kitchen`
                      : 'Kitchen is clear'
                    : `${state.orders.length} orders on historical audit record`}
                </p>
              </div>

              <div className="grid grid-cols-2 w-48 bg-[var(--chip)] p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setOrdersFilter('Open')}
                  className={`py-1.5 rounded-lg transition-all ${
                    ordersFilter === 'Open' ? 'bg-[var(--red)] text-white shadow-sm' : 'text-[var(--mute)]'
                  }`}
                >
                  Open
                </button>
                <button
                  onClick={() => setOrdersFilter('History')}
                  className={`py-1.5 rounded-lg transition-all ${
                    ordersFilter === 'History' ? 'bg-[var(--red)] text-white shadow-sm' : 'text-[var(--mute)]'
                  }`}
                >
                  History
                </button>
              </div>
            </div>

            {/* Status Summary & Filter Strip */}
            <div className="flex flex-wrap items-center gap-2">
              {ordersFilter === 'Open' ? (
                <>
                  <button
                    onClick={() => setKdsStatusTab('All')}
                    className={`flex-1 min-w-[100px] flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      kdsStatusTab === 'All'
                        ? 'border-[var(--ink)] bg-[var(--panel)] shadow-sm'
                        : 'border-[var(--line)] bg-[var(--panel)]/70'
                    }`}
                  >
                    <b className="disp text-base font-bold tabular-nums">{allOpenCount}</b>
                    <small className="text-[10px] uppercase font-bold text-[var(--mute)]">All Open</small>
                  </button>

                  <button
                    onClick={() => setKdsStatusTab('New')}
                    className={`flex-1 min-w-[100px] flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      kdsStatusTab === 'New'
                        ? 'border-[var(--red)] bg-[var(--panel)] shadow-sm'
                        : 'border-[var(--line)] bg-[var(--panel)]/70'
                    }`}
                  >
                    <span className="w-1.5 h-4 rounded-full bg-[var(--red)]"></span>
                    <b className="disp text-base font-bold text-[var(--red)] tabular-nums">{newCount}</b>
                    <small className="text-[10px] uppercase font-bold text-[var(--mute)]">New</small>
                  </button>

                  <button
                    onClick={() => setKdsStatusTab('Baking')}
                    className={`flex-1 min-w-[100px] flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      kdsStatusTab === 'Baking'
                        ? 'border-[var(--amber)] bg-[var(--panel)] shadow-sm'
                        : 'border-[var(--line)] bg-[var(--panel)]/70'
                    }`}
                  >
                    <span className="w-1.5 h-4 rounded-full bg-[var(--amber)]"></span>
                    <b className="disp text-base font-bold text-[var(--amber)] tabular-nums">{bakingCount}</b>
                    <small className="text-[10px] uppercase font-bold text-[var(--mute)]">Baking</small>
                  </button>

                  <button
                    onClick={() => setKdsStatusTab('Ready')}
                    className={`flex-1 min-w-[100px] flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      kdsStatusTab === 'Ready'
                        ? 'border-[var(--green)] bg-[var(--panel)] shadow-sm'
                        : 'border-[var(--line)] bg-[var(--panel)]/70'
                    }`}
                  >
                    <span className="w-1.5 h-4 rounded-full bg-[var(--green)]"></span>
                    <b className="disp text-base font-bold text-[var(--green)] tabular-nums">{readyCount}</b>
                    <small className="text-[10px] uppercase font-bold text-[var(--mute)]">Ready</small>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-[120px] flex items-center gap-2 p-2.5 rounded-xl border border-[var(--line)] bg-[var(--panel)]">
                    <b className="disp text-base font-bold tabular-nums">{state.orders.length}</b>
                    <small className="text-[10px] uppercase font-bold text-[var(--mute)]">Total orders</small>
                  </div>
                  <div className="flex-1 min-w-[120px] flex items-center gap-2 p-2.5 rounded-xl border border-[var(--line)] bg-[var(--panel)]">
                    <b className="disp text-base font-bold text-emerald-800 tabular-nums">
                      {formatCurrency(todayRevenue, state.settings.currencySymbol)}
                    </b>
                    <small className="text-[10px] uppercase font-bold text-[var(--mute)]">Today sales</small>
                  </div>
                </>
              )}
            </div>

            {/* Orders Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(ordersFilter === 'Open' ? openOrders : state.orders).length === 0 ? (
                <div className="col-span-full py-16 text-center text-[var(--mute)] space-y-2">
                  <div className="eic w-14 h-14 rounded-full bg-[var(--chip)] mx-auto flex items-center justify-center">
                    <i className="logo"></i>
                  </div>
                  <b className="disp text-base font-bold text-[var(--ink)]">
                    {ordersFilter === 'Open' ? 'No open orders' : 'No past orders yet'}
                  </b>
                  <p className="text-xs">
                    {ordersFilter === 'Open'
                      ? 'New sales will appear here for the kitchen.'
                      : 'Completed sales will be listed here.'}
                  </p>
                </div>
              ) : (
                (ordersFilter === 'Open' ? openOrders : state.orders).map((o) => {
                  const elapsedMins = Math.floor((nowTick - o.createdAt) / 60000);
                  const isLate = ordersFilter === 'Open' && elapsedMins >= 15;
                  const totalItems = o.items.reduce((sum, i) => sum + i.quantity, 0);

                  return (
                    <article
                      key={o.id}
                      className={`oc2 flex flex-col bg-[var(--panel)] border border-[var(--line)] rounded-2xl shadow-sm overflow-hidden transition-all ${
                        o.status === 'New'
                          ? 'border-l-4 border-l-[var(--red)]'
                          : o.status === 'Baking'
                          ? 'border-l-4 border-l-[var(--amber)]'
                          : o.status === 'Ready'
                          ? 'border-l-4 border-l-[var(--green)]'
                          : ''
                      } ${isLate ? 'border-[var(--red)]/80 bg-red-50/20' : ''}`}
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between p-3.5 pb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="onum font-display font-bold text-base text-[var(--ink)]">
                              #{o.orderNumber}
                            </span>
                            <span className="text-xs font-semibold text-[var(--mute)]">{o.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--mute)]">
                            <span className="px-2 py-0.2 rounded-full border border-[var(--line)]">
                              {o.type}
                            </span>
                            <span>{formatTime(o.createdAt)}</span>
                            {ordersFilter === 'Open' && (
                              <span
                                className={`font-bold tabular-nums ml-auto ${
                                  isLate ? 'text-[var(--red)] font-extrabold animate-pulse' : ''
                                }`}
                              >
                                {elapsedMins} min
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            o.status === 'New'
                              ? 'bg-rose-50 text-[var(--red)]'
                              : o.status === 'Baking'
                              ? 'bg-amber-50 text-[var(--amber)]'
                              : o.status === 'Ready'
                              ? 'bg-emerald-50 text-[var(--green)]'
                              : o.status === 'Void'
                              ? 'bg-slate-100 text-[var(--mute)] line-through'
                              : 'bg-slate-100 text-[var(--mute)]'
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>

                      {/* Items List */}
                      <ul className="px-3.5 py-2 space-y-1.5 flex-1 border-t border-dashed border-[var(--line)] text-xs text-[var(--ink)]">
                        {o.items.map((line, lIdx) => (
                          <li key={lIdx} className="flex items-start gap-2">
                            <span className="font-bold text-[var(--gold)] tabular-nums">
                              {line.quantity}×
                            </span>
                            <div>
                              <span>{line.name}</span>
                              {line.modifiers && line.modifiers.length > 0 && (
                                <small className="block text-[11px] text-[var(--mute)]">
                                  + {line.modifiers.join(', ')}
                                </small>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>

                      {o.notes && (
                        <div className="mx-3.5 mb-2 p-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 text-[11px] text-amber-900">
                          <b>Note:</b> {o.notes}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="p-3 bg-[var(--bg)] border-t border-[var(--line)] flex items-center justify-between gap-2">
                        <div>
                          <b className="disp text-sm font-bold text-[var(--ink)] tabular-nums block">
                            {formatCurrency(o.totals.total, state.settings.currencySymbol)}
                          </b>
                          <small className="text-[10px] text-[var(--mute)]">
                            {totalItems} items · {o.paymentMethod}
                          </small>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {ordersFilter === 'Open' ? (
                            <button
                              onClick={() => handleTransitionStatus(o.id, o.status)}
                              className="px-3.5 py-1.5 rounded-xl bg-[var(--red)] hover:bg-[var(--redd)] text-white text-xs font-bold shadow-sm transition-all"
                            >
                              {o.status === 'New'
                                ? 'Start baking'
                                : o.status === 'Baking'
                                ? 'Mark ready'
                                : 'Complete order'}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setReceiptOrder(o)}
                                className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] text-xs font-semibold text-[var(--mute)] hover:text-[var(--ink)]"
                              >
                                Receipt
                              </button>
                              {o.status !== 'Void' && (
                                <button
                                  onClick={() => setVoidModalOrder(o)}
                                  className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                >
                                  Void
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: TODAY (REPORT) */}
        {activeTab === 'report' && (
          <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-5 overflow-y-auto gap-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="disp text-2xl font-bold text-[var(--ink)]">Today</h2>
                <p className="text-xs text-[var(--mute)] mt-0.5">
                  {new Date().toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => exportOrdersToCSV(state.orders, state.settings)}
                  className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-xs font-semibold shadow-sm hover:border-[var(--gold)]"
                >
                  Export to Excel
                </button>
                <button
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
                    const a = document.createElement('a');
                    a.href = dataStr;
                    a.download = `my-pizza-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    showToast('Backup downloaded');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-xs font-semibold shadow-sm hover:border-[var(--gold)]"
                >
                  Back up
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-xs font-semibold shadow-sm hover:border-[var(--gold)]"
                >
                  Restore
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const rd = new FileReader();
                    rd.onload = async () => {
                      try {
                        const parsed = JSON.parse(rd.result as string);
                        await posApi.restoreBackup(parsed);
                        setState(parsed);
                        showToast('Backup restored successfully');
                      } catch (err) {
                        showToast('Invalid backup file');
                      }
                    };
                    rd.readAsText(f);
                  }}
                />
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--red)] text-white text-xs font-bold shadow-md hover:bg-[var(--redd)]"
                >
                  End-of-day report
                </button>
              </div>
            </div>

            {/* Hero KPI Card (Interactive) */}
            <div
              onClick={() => setShowPaymentMixModal(true)}
              className="p-5 rounded-2xl bg-gradient-to-br from-[#1b1e20] to-[#101213] text-[#f3f1ec] border border-[var(--gold)]/40 shadow-xl cursor-pointer hover:border-[var(--gold)] transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--gold)] uppercase tracking-wider block">
                  Today's revenue
                </span>
                <span className="text-[11px] text-white/50 group-hover:text-white transition-colors">
                  Tap to view tender breakdown &rarr;
                </span>
              </div>
              <div className="disp text-4xl font-extrabold text-white mt-1 tabular-nums">
                {formatCurrency(todayRevenue, state.settings.currencySymbol)}
              </div>
              <span className="text-xs text-[#b9b6ae] mt-1 block">
                {validTodayOrders.length} orders · {todayItemsSold} items sold
              </span>
            </div>

            {/* Sub-KPIs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-sm">
                <span className="text-[11px] text-[var(--mute)] font-medium block">Orders</span>
                <b className="disp text-xl font-bold text-[var(--ink)] mt-1 block tabular-nums">
                  {validTodayOrders.length}
                </b>
              </div>
              <div className="p-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-sm">
                <span className="text-[11px] text-[var(--mute)] font-medium block">Average order</span>
                <b className="disp text-xl font-bold text-[var(--ink)] mt-1 block tabular-nums">
                  {formatCurrency(
                    validTodayOrders.length ? todayRevenue / validTodayOrders.length : 0,
                    state.settings.currencySymbol
                  )}
                </b>
              </div>
              <div className="p-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-sm">
                <span className="text-[11px] text-[var(--mute)] font-medium block">Items sold</span>
                <b className="disp text-xl font-bold text-[var(--ink)] mt-1 block tabular-nums">
                  {todayItemsSold}
                </b>
              </div>
              <div className="p-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-sm">
                <span className="text-[11px] text-[var(--mute)] font-medium block">Voided</span>
                <b className="disp text-xl font-bold text-rose-600 mt-1 block tabular-nums">
                  {todayVoidCount}
                </b>
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            <div className="p-4 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-sm space-y-3">
              <h3 className="disp font-bold text-sm text-[var(--ink)]">Payment methods</h3>

              <div className="flex h-3 rounded-full bg-[var(--chip)] overflow-hidden gap-0.5">
                {todayRevenue > 0 && (
                  <>
                    <i
                      style={{ width: `${(byPayment('Cash') / todayRevenue) * 100}%` }}
                      className="bg-[#c8a24a]"
                    ></i>
                    <i
                      style={{ width: `${(byPayment('Card') / todayRevenue) * 100}%` }}
                      className="bg-[#b3261e]"
                    ></i>
                    <i
                      style={{ width: `${(byPayment('Mobile Wallet') / todayRevenue) * 100}%` }}
                      className="bg-[#3a8f6a]"
                    ></i>
                  </>
                )}
              </div>

              <div className="divide-y divide-[var(--line)] text-xs">
                <div className="py-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#c8a24a]"></span>
                    <span>Cash</span>
                  </span>
                  <b className="tabular-nums">{formatCurrency(byPayment('Cash'), state.settings.currencySymbol)}</b>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#b3261e]"></span>
                    <span>Card</span>
                  </span>
                  <b className="tabular-nums">{formatCurrency(byPayment('Card'), state.settings.currencySymbol)}</b>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3a8f6a]"></span>
                    <span>Mobile Wallet</span>
                  </span>
                  <b className="tabular-nums">
                    {formatCurrency(byPayment('Mobile Wallet'), state.settings.currencySymbol)}
                  </b>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== MODAL 1: ITEM PICKER (SIZES & EXTRAS) ===== */}
      {pickerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--panel)] rounded-2xl p-5 shadow-2xl border border-[var(--line)] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="disp text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                  <span>{pickerItem.emoji}</span>
                  <span>{pickerItem.name}</span>
                </h2>
                <p className="text-xs text-[var(--mute)] mt-0.5">{pickerItem.description}</p>
              </div>
              <button
                onClick={() => setPickerItem(null)}
                className="text-[var(--mute)] hover:text-[var(--ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Size selection */}
            {pickerItem.sizes && (
              <div>
                <div className="text-xs font-semibold text-[var(--mute)] mb-2">Size</div>
                <div className="grid grid-cols-3 gap-2">
                  {['Small', 'Medium', 'Large'].map((sName, sIdx) => (
                    <button
                      key={sName}
                      type="button"
                      onClick={() => setPickerSize(sIdx)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        pickerSize === sIdx
                          ? 'border-[var(--red)] bg-[#c4342a18] text-[var(--red)] font-bold'
                          : 'border-[var(--line)] text-[var(--ink)] bg-[var(--chip)]'
                      }`}
                    >
                      <b className="text-xs">{sName}</b>
                      <span className="text-[11px] tabular-nums opacity-80">
                        {formatCurrency(pickerItem.sizes![sIdx], state.settings.currencySymbol)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Extras */}
            <div>
              <div className="text-xs font-semibold text-[var(--mute)] mb-2">Extras</div>
              <div className="flex flex-wrap gap-2">
                {[
                  ['Extra cheese', '+150'],
                  ['Jalapeños', '+80'],
                  ['Olives', '+80'],
                  ['Stuffed crust', '+200'],
                ].map(([exName, exPrice]) => {
                  const tag = `${exName} ${exPrice}`;
                  const isChecked = pickerExtras.includes(tag);
                  return (
                    <button
                      key={exName}
                      type="button"
                      onClick={() =>
                        setPickerExtras((prev) =>
                          isChecked ? prev.filter((x) => x !== tag) : [...prev, tag]
                        )
                      }
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        isChecked
                          ? 'border-[var(--red)] bg-[#c4342a18] text-[var(--red)]'
                          : 'border-[var(--line)] bg-[var(--chip)] text-[var(--ink)]'
                      }`}
                    >
                      {isChecked && '✓ '}
                      {exName} {exPrice}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-[var(--mute)]">Quantity</span>
              <div className="flex items-center bg-[var(--chip)] rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setPickerQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-[var(--panel)] font-bold text-sm"
                >
                  -
                </button>
                <b className="min-w-[28px] text-center text-sm tabular-nums">{pickerQty}</b>
                <button
                  type="button"
                  onClick={() => setPickerQty((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-[var(--panel)] font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Confirm Add */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPickerItem(null)}
                className="py-3 rounded-xl bg-[var(--chip)] font-bold text-xs text-[var(--mute)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPicker}
                className="py-3 rounded-xl bg-[var(--red)] text-white font-bold text-xs shadow-md"
              >
                Add to order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL 2: PAYMENT & TENDER ===== */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--panel)] rounded-2xl p-5 shadow-2xl border border-[var(--line)] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="disp text-lg font-bold text-[var(--ink)]">
                  Payment · {formatCurrency(totals.total, state.settings.currencySymbol)}
                </h2>
                <p className="text-xs text-[var(--mute)]">Select customer tender method</p>
              </div>
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="text-[var(--mute)] hover:text-[var(--ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment methods */}
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'Card', 'Mobile Wallet'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayMethod(m)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    payMethod === m
                      ? 'border-[var(--red)] bg-[#c4342a18] text-[var(--red)] font-bold'
                      : 'border-[var(--line)] bg-[var(--chip)] text-[var(--mute)]'
                  }`}
                >
                  {m === 'Mobile Wallet' ? 'Wallet' : m}
                </button>
              ))}
            </div>

            {/* For Cash: Cash received */}
            {payMethod === 'Cash' && (
              <div className="space-y-2 bg-[var(--chip)] p-3 rounded-xl">
                <label className="block text-xs font-semibold text-[var(--mute)]">
                  Cash received
                </label>
                <input
                  type="number"
                  min={0}
                  value={tenderedAmount || ''}
                  onChange={(e) => setTenderedAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xl font-bold tabular-nums rounded-xl border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)]"
                />

                {/* Fast Cash Tender Suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    totals.total,
                    Math.ceil(totals.total / 100) * 100,
                    Math.ceil(totals.total / 500) * 500,
                    1000,
                    2000,
                    5000,
                  ]
                    .filter((val, idx, arr) => val >= totals.total && arr.indexOf(val) === idx)
                    .slice(0, 4)
                    .map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTenderedAmount(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          tenderedAmount === val
                            ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                            : 'bg-[var(--panel)] border-[var(--line)] text-[var(--ink)]'
                        }`}
                      >
                        {formatCurrency(val, state.settings.currencySymbol)}
                      </button>
                    ))}
                </div>

                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-[var(--line)]">
                  <span className="font-semibold text-[var(--mute)]">
                    {tenderedAmount < totals.total ? 'Short by' : 'Change due'}
                  </span>
                  <b
                    className={`text-base tabular-nums ${
                      tenderedAmount < totals.total ? 'text-rose-600' : 'text-emerald-700 font-extrabold'
                    }`}
                  >
                    {formatCurrency(
                      Math.abs(tenderedAmount - totals.total),
                      state.settings.currencySymbol
                    )}
                  </b>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="py-3 rounded-xl bg-[var(--chip)] font-bold text-xs text-[var(--mute)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={payMethod === 'Cash' && tenderedAmount < totals.total}
                className="py-3 rounded-xl bg-[var(--red)] text-white font-bold text-xs shadow-md disabled:opacity-40"
              >
                Complete order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL 3: THERMAL RECEIPT DISPLAY ===== */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--panel)] rounded-2xl p-5 shadow-2xl border border-[var(--line)] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="disp text-lg font-bold text-[var(--ink)]">
                  Receipt · Order #{receiptOrder.orderNumber}
                </h2>
                <p className="text-xs text-[var(--mute)]">Sent to kitchen & ready to print</p>
              </div>
              <button
                onClick={() => setReceiptOrder(null)}
                className="text-[var(--mute)] hover:text-[var(--ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre
              id="printable-receipt"
              className="bg-[#fffdf8] text-[#1d1d1d] p-3.5 rounded-xl border border-[var(--line)] font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto select-all shadow-inner"
            >
              {generateThermalReceiptText(receiptOrder, state.settings)}
            </pre>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReceiptOrder(null)}
                className="py-2.5 rounded-xl bg-[var(--chip)] font-bold text-xs text-[var(--mute)]"
              >
                New order
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 rounded-xl bg-[var(--red)] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL 4: MENU EDITOR ===== */}
      {isMenuEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--panel)] rounded-2xl p-5 shadow-2xl border border-[var(--line)] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h2 className="disp text-lg font-bold text-[var(--ink)]">Edit menu</h2>
                <p className="text-xs text-[var(--mute)]">{state.menu.length} items total</p>
              </div>
              <button
                onClick={() => {
                  setEditingMenuItem({
                    id: 0,
                    name: '',
                    category: categories[0] || 'Artisan Pizzas',
                    emoji: '🍕',
                    description: '',
                    price: 650,
                    prepTime: 15,
                    tags: [],
                    stock: 25,
                    isSoldOut: false,
                  });
                  setMenuSizedToggle(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-[var(--red)] text-white text-xs font-bold shadow-sm"
              >
                + Add item
              </button>
            </div>

            {/* If currently editing an item */}
            {editingMenuItem ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--mute)]">Emoji</label>
                    <input
                      type="text"
                      value={editingMenuItem.emoji}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, emoji: e.target.value })}
                      className="w-full p-2 text-center text-xl rounded-xl border border-[var(--line)] bg-[var(--chip)]"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[11px] font-bold text-[var(--mute)]">Dish Name</label>
                    <input
                      type="text"
                      value={editingMenuItem.name}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
                      className="w-full p-2 text-xs font-semibold rounded-xl border border-[var(--line)] bg-[var(--bg)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--mute)]">Category</label>
                  <input
                    type="text"
                    value={editingMenuItem.category}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, category: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--mute)]">Description</label>
                  <input
                    type="text"
                    value={editingMenuItem.description}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)]"
                  />
                </div>

                {/* Sized toggle */}
                <div className="grid grid-cols-2 gap-2 bg-[var(--chip)] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMenuSizedToggle(false)}
                    className={`py-1.5 rounded-lg text-xs font-semibold ${
                      !menuSizedToggle ? 'bg-[var(--panel)] shadow-sm' : 'text-[var(--mute)]'
                    }`}
                  >
                    One price
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuSizedToggle(true);
                      if (!editingMenuItem.sizes) setEditingMenuItem({ ...editingMenuItem, sizes: [650, 1100, 1500] });
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold ${
                      menuSizedToggle ? 'bg-[var(--panel)] shadow-sm' : 'text-[var(--mute)]'
                    }`}
                  >
                    Small / Medium / Large
                  </button>
                </div>

                {menuSizedToggle ? (
                  <div className="grid grid-cols-3 gap-2">
                    {['Small', 'Medium', 'Large'].map((sName, sIdx) => (
                      <div key={sName}>
                        <label className="block text-[10px] text-[var(--mute)]">{sName}</label>
                        <input
                          type="number"
                          value={editingMenuItem.sizes ? editingMenuItem.sizes[sIdx] : 0}
                          onChange={(e) => {
                            const newSizes = [...(editingMenuItem.sizes || [650, 1100, 1500])];
                            newSizes[sIdx] = Number(e.target.value);
                            setEditingMenuItem({ ...editingMenuItem, sizes: newSizes });
                          }}
                          className="w-full p-1.5 text-xs rounded-lg border border-[var(--line)] bg-[var(--bg)]"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] text-[var(--mute)]">Price</label>
                    <input
                      type="number"
                      value={editingMenuItem.price || 0}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: Number(e.target.value) })}
                      className="w-full p-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)]"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="soldout-toggle"
                    checked={editingMenuItem.isSoldOut || false}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, isSoldOut: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--red)]"
                  />
                  <label htmlFor="soldout-toggle" className="font-semibold text-[var(--ink)]">
                    Mark as sold out today
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => setEditingMenuItem(null)}
                    className="py-2.5 rounded-xl bg-[var(--chip)] font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const payload = { ...editingMenuItem };
                      if (menuSizedToggle) delete payload.price;
                      else delete payload.sizes;
                      const updated = await posApi.saveMenuItem(payload);
                      setState((prev) => ({ ...prev, menu: updated }));
                      setEditingMenuItem(null);
                      showToast('Menu updated');
                    }}
                    className="py-2.5 rounded-xl bg-[var(--red)] text-white font-bold text-xs shadow-md"
                  >
                    Save dish
                  </button>
                </div>
              </div>
            ) : (
              /* Menu items list */
              <div className="divide-y divide-[var(--line)] max-h-72 overflow-y-auto">
                {state.menu.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl">{m.emoji}</span>
                      <div className="truncate">
                        <div className="font-semibold text-xs text-[var(--ink)] truncate">{m.name}</div>
                        <div className="text-[11px] text-[var(--mute)]">
                          {m.sizes
                            ? m.sizes.map((s) => formatCurrency(s, state.settings.currencySymbol)).join(' · ')
                            : formatCurrency(m.price || 0, state.settings.currencySymbol)}
                          {m.isSoldOut ? ' · Sold out' : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingMenuItem(m);
                        setMenuSizedToggle(!!(m.sizes && m.sizes.length));
                      }}
                      className="px-3 py-1 rounded-full border border-[var(--line)] text-xs font-semibold hover:border-[var(--gold)]"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsMenuEditorOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--chip)] font-bold text-xs text-[var(--mute)]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ===== MODAL 5: TOOLS & PRO HUB ===== */}
      {isToolsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--panel)] rounded-2xl p-5 shadow-2xl border border-[var(--line)] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h2 className="disp text-lg font-bold text-[var(--ink)]">My Pizza Pro Tools</h2>
                <p className="text-xs text-[var(--mute)]">Smart inventory, deals, CRM & waste</p>
              </div>
              <button onClick={() => setIsToolsOpen(false)} className="text-[var(--mute)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {toolView === 'hub' ? (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setToolView('stock')}
                  className="p-3 rounded-xl border border-[var(--line)] bg-[var(--chip)] text-left hover:border-[var(--gold)] flex flex-col gap-1"
                >
                  <b className="text-xs text-[var(--ink)]">📦 Smart Stock</b>
                  <small className="text-[11px] text-[var(--mute)]">
                    {state.menu.filter((m) => m.stock <= state.settings.lowStockThreshold).length} low alerts
                  </small>
                </button>

                <button
                  onClick={() => setToolView('combos')}
                  className="p-3 rounded-xl border border-[var(--line)] bg-[var(--chip)] text-left hover:border-[var(--gold)] flex flex-col gap-1"
                >
                  <b className="text-xs text-[var(--ink)]">🍕 Combo Deals</b>
                  <small className="text-[11px] text-[var(--mute)]">{state.combos.length} deals</small>
                </button>

                <button
                  onClick={() => setToolView('customers')}
                  className="p-3 rounded-xl border border-[var(--line)] bg-[var(--chip)] text-left hover:border-[var(--gold)] flex flex-col gap-1"
                >
                  <b className="text-xs text-[var(--ink)]">👤 Customers</b>
                  <small className="text-[11px] text-[var(--mute)]">{state.customers.length} saved</small>
                </button>

                <button
                  onClick={() => setToolView('waste')}
                  className="p-3 rounded-xl border border-[var(--line)] bg-[var(--chip)] text-left hover:border-[var(--gold)] flex flex-col gap-1"
                >
                  <b className="text-xs text-[var(--ink)]">🗑 Waste Tracking</b>
                  <small className="text-[11px] text-[var(--mute)]">{state.waste.length} logs</small>
                </button>

                <button
                  onClick={() => setToolView('held')}
                  className="p-3 rounded-xl border border-[var(--line)] bg-[var(--chip)] text-left hover:border-[var(--gold)] flex flex-col gap-1"
                >
                  <b className="text-xs text-[var(--ink)]">⏸ Hold / Recall</b>
                  <small className="text-[11px] text-[var(--mute)]">{state.heldOrders.length} waiting</small>
                </button>

                <button
                  onClick={() => {
                    setIsToolsOpen(false);
                    setIsShortcutsOpen(true);
                  }}
                  className="p-3 rounded-xl border border-[var(--line)] bg-[var(--chip)] text-left hover:border-[var(--gold)] flex flex-col gap-1"
                >
                  <b className="text-xs text-[var(--ink)]">⌨ Shortcuts</b>
                  <small className="text-[11px] text-[var(--mute)]">F1–F9 keys</small>
                </button>
              </div>
            ) : toolView === 'stock' ? (
              /* Stock manager view */
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[var(--mute)]">
                  Low stock alert threshold: {state.settings.lowStockThreshold} units
                </div>
                <div className="divide-y divide-[var(--line)] max-h-64 overflow-y-auto text-xs">
                  {state.menu.map((m) => (
                    <div key={m.id} className="py-2 flex items-center justify-between">
                      <div>
                        <b>{m.name}</b>
                        <small className="block text-[var(--mute)]">Stock: {m.stock}</small>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={async () => {
                            const updated = await posApi.updateInventory([{ id: m.id, stock: m.stock + 5 }]);
                            setState((prev) => ({ ...prev, menu: updated }));
                            showToast(`+5 ${m.name} restocked`);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--chip)] font-bold hover:bg-slate-200"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setToolView('hub')}
                  className="w-full py-2 rounded-xl bg-[var(--chip)] font-bold text-xs"
                >
                  Back to Hub
                </button>
              </div>
            ) : toolView === 'held' ? (
              /* Held queue view */
              <div className="space-y-3">
                <div className="divide-y divide-[var(--line)] max-h-64 overflow-y-auto text-xs">
                  {state.heldOrders.length === 0 ? (
                    <div className="py-6 text-center text-[var(--mute)]">No held orders in queue.</div>
                  ) : (
                    state.heldOrders.map((h) => (
                      <div key={h.id} className="py-2 flex items-center justify-between">
                        <div>
                          <b>{h.customerName || h.tableNumber || 'Held Guest'}</b>
                          <small className="block text-[var(--mute)]">{h.items.length} items</small>
                        </div>
                        <button
                          onClick={() => handleRecallHeld(h)}
                          className="px-3 py-1 rounded-lg bg-[var(--red)] text-white font-bold"
                        >
                          Recall
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setToolView('hub')}
                  className="w-full py-2 rounded-xl bg-[var(--chip)] font-bold text-xs"
                >
                  Back to Hub
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setToolView('hub')}
                  className="w-full py-2 rounded-xl bg-[var(--chip)] font-bold text-xs"
                >
                  Back to Hub
                </button>
              </div>
            )}

            <button
              onClick={() => setIsToolsOpen(false)}
              className="w-full py-2 rounded-xl bg-[var(--chip)] font-bold text-xs text-[var(--mute)]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===== MODAL 6: SHOP SETTINGS ===== */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--panel)] rounded-2xl p-5 shadow-2xl border border-[var(--line)] space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <h2 className="disp text-lg font-bold text-[var(--ink)]">Shop settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-[var(--mute)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-[var(--mute)] font-semibold">
              Shop name
              <input
                type="text"
                value={settingsForm.restaurantName}
                onChange={(e) => setSettingsForm({ ...settingsForm, restaurantName: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]"
              />
            </label>

            <label className="block text-[var(--mute)] font-semibold">
              Cashier name
              <input
                type="text"
                value={settingsForm.currentCashier}
                onChange={(e) => setSettingsForm({ ...settingsForm, currentCashier: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[var(--mute)] font-semibold">
                GST percent
                <input
                  type="number"
                  value={settingsForm.taxRatePercent}
                  onChange={(e) => setSettingsForm({ ...settingsForm, taxRatePercent: Number(e.target.value) })}
                  className="w-full mt-1 p-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]"
                />
              </label>

              <label className="block text-[var(--mute)] font-semibold">
                Delivery fee (Rs)
                <input
                  type="number"
                  value={settingsForm.deliveryFee}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: Number(e.target.value) })}
                  className="w-full mt-1 p-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]"
                />
              </label>
            </div>

            <label className="block text-[var(--mute)] font-semibold">
              Manager PIN for voids
              <input
                type="password"
                value={settingsForm.managerPin}
                onChange={(e) => setSettingsForm({ ...settingsForm, managerPin: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]"
              />
            </label>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="py-2.5 rounded-xl bg-[var(--chip)] font-bold text-[var(--mute)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const updated = await posApi.saveSettings(settingsForm);
                  setState((prev) => ({ ...prev, settings: updated }));
                  setIsSettingsOpen(false);
                  showToast('Settings saved');
                }}
                className="py-2.5 rounded-xl bg-[var(--red)] text-white font-bold shadow-md"
              >
                Save settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL 7: NOTIFICATIONS ===== */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--panel)] rounded-2xl p-5 shadow-2xl border border-[var(--line)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <div>
                <h2 className="disp text-lg font-bold text-[var(--ink)]">Notifications</h2>
                <p className="text-xs text-[var(--mute)]">{notifications.length} alerts on record</p>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs font-semibold px-2.5 py-1 rounded-full border border-[var(--line)] text-[var(--mute)]"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="divide-y divide-[var(--line)] max-h-64 overflow-y-auto text-xs">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-[var(--mute)]">No notifications. All caught up!</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="py-2.5 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--red)] mt-1 shrink-0"></span>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--ink)]">{n.msg}</div>
                      <small className="text-[var(--mute)]">{formatTime(n.time)}</small>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--chip)] font-bold text-xs text-[var(--mute)]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===== MODAL 8: KEYBOARD SHORTCUTS ===== */}
      {isShortcutsOpen && (
        <div
          id="shortcutPanel"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-[min(260px,calc(100vw-40px))] bg-[var(--panel)] rounded-xl p-3 shadow-2xl border border-[var(--line)] space-y-2">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
              <h3 className="disp text-xs font-bold text-[var(--ink)]">Keyboard Shortcuts</h3>
              <button onClick={() => setIsShortcutsOpen(false)} className="text-[var(--mute)] text-sm">
                ✕
              </button>
            </div>

            <div className="grid gap-1 text-[10px]">
              {[
                ['New Order / Clear', 'F1'],
                ['Menu Search', 'F2'],
                ['Hold Current', 'F3'],
                ['Recall Queue', 'F4'],
                ['Payment Tender', 'F5'],
                ['Orders Screen', 'F6'],
                ['Today Reports', 'F7'],
                ['Customer CRM', 'F8'],
                ['Menu Editor', 'F9'],
                ['Close Panel', 'Esc'],
                ['Confirm / Pay', 'Ctrl+Enter'],
              ].map(([action, key]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-1.5 border border-[var(--line)] rounded-md bg-[var(--chip)]"
                >
                  <span className="font-medium text-[var(--ink)]">{action}</span>
                  <kbd className="font-mono font-bold text-[9px] px-1.5 py-0.5 rounded bg-[var(--panel)] border border-[var(--line)]">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL 9: VOID ORDER SECURITY CONFIRMATION ===== */}
      {voidModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--panel)] rounded-2xl p-5 shadow-2xl border border-[var(--line)] space-y-3 text-xs">
            <h3 className="disp text-base font-bold text-rose-700">
              Void Order #{voidModalOrder.orderNumber}
            </h3>
            <p className="text-[var(--mute)]">
              Reverses sales total and automatically returns items back to stock inventory.
            </p>

            {voidError && (
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 font-semibold">{voidError}</div>
            )}

            <div>
              <label className="block text-[var(--mute)] font-semibold mb-1">Manager PIN</label>
              <input
                type="password"
                placeholder="Default: 1234"
                value={voidPin}
                onChange={(e) => setVoidPin(e.target.value)}
                className="w-full p-2 rounded-xl border border-[var(--line)] bg-[var(--bg)]"
              />
            </div>

            <div>
              <label className="block text-[var(--mute)] font-semibold mb-1">Reason</label>
              <select
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full p-2 rounded-xl border border-[var(--line)] bg-[var(--bg)]"
              >
                <option value="Customer Cancellation">Customer Cancellation</option>
                <option value="Kitchen Mistake">Kitchen Mistake</option>
                <option value="Incorrect Tender">Incorrect Tender</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidModalOrder(null)}
                className="py-2.5 rounded-xl bg-[var(--chip)] font-bold text-[var(--mute)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="py-2.5 rounded-xl bg-rose-600 text-white font-bold shadow-md"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL 10: PAYMENT MIX DETAIL MODAL ===== */}
      {showPaymentMixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--panel)] rounded-2xl p-5 shadow-2xl border border-[var(--line)] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="disp text-lg font-bold text-[var(--ink)]">Payment methods</h2>
                <p className="text-xs text-[var(--mute)]">
                  Today's total revenue · {formatCurrency(todayRevenue, state.settings.currencySymbol)}
                </p>
              </div>
              <button onClick={() => setShowPaymentMixModal(false)} className="text-[var(--mute)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--chip)] flex justify-between items-center">
                <span className="font-semibold text-[var(--ink)]">Cash Tender</span>
                <b className="tabular-nums font-bold">
                  {formatCurrency(byPayment('Cash'), state.settings.currencySymbol)} (
                  {todayRevenue ? Math.round((byPayment('Cash') / todayRevenue) * 100) : 0}%)
                </b>
              </div>

              <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--chip)] flex justify-between items-center">
                <span className="font-semibold text-[var(--ink)]">Card / Terminal</span>
                <b className="tabular-nums font-bold">
                  {formatCurrency(byPayment('Card'), state.settings.currencySymbol)} (
                  {todayRevenue ? Math.round((byPayment('Card') / todayRevenue) * 100) : 0}%)
                </b>
              </div>

              <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--chip)] flex justify-between items-center">
                <span className="font-semibold text-[var(--ink)]">Mobile Wallet / QR</span>
                <b className="tabular-nums font-bold">
                  {formatCurrency(byPayment('Mobile Wallet'), state.settings.currencySymbol)} (
                  {todayRevenue ? Math.round((byPayment('Mobile Wallet') / todayRevenue) * 100) : 0}%)
                </b>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentMixModal(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--chip)] font-bold text-xs text-[var(--mute)]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===== MOBILE CART DRAWER ===== */}
      {isMobileCartOpen && (
        <div className="xl:hidden fixed inset-0 z-40 flex flex-col bg-black/60 backdrop-blur-sm">
          <div className="flex-1" onClick={() => setIsMobileCartOpen(false)} />
          <div className="h-[88vh] bg-[var(--panel)] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <b className="disp font-bold text-sm text-[var(--ink)]">
                Order #{state.nextOrderNumber} ({cart.length} items)
              </b>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="px-3 py-1 rounded-lg bg-[var(--chip)] text-xs font-semibold"
              >
                Back to menu
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {cart.map((line, idx) => (
                <div key={line.id} className="p-2.5 border border-[var(--line)] rounded-xl flex items-center justify-between bg-[var(--bg)]">
                  <div>
                    <b className="text-xs">{line.name}</b>
                    <div className="text-[10px] text-[var(--mute)]">
                      {formatCurrency(line.unitPrice * line.quantity, state.settings.currencySymbol)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCartQty(idx, -1)}
                      className="w-6 h-6 rounded bg-[var(--chip)] font-bold"
                    >
                      -
                    </button>
                    <b className="text-xs tabular-nums">{line.quantity}</b>
                    <button
                      onClick={() => updateCartQty(idx, 1)}
                      className="w-6 h-6 rounded bg-[var(--chip)] font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--line)] flex justify-between items-baseline font-bold">
              <span>Total</span>
              <span className="disp text-xl text-[var(--red)] tabular-nums">
                {formatCurrency(totals.total, state.settings.currencySymbol)}
              </span>
            </div>

            <button
              onClick={() => {
                setIsMobileCartOpen(false);
                handleOpenPayment();
              }}
              className="w-full py-3 rounded-xl bg-[var(--red)] text-white font-bold text-sm shadow-md"
            >
              Take payment
            </button>
          </div>
        </div>
      )}

      {/* Toast Alert Notification */}
      {toastMsg && (
        <div
          id="toast"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[var(--ink)] text-[var(--bg)] text-xs font-semibold shadow-2xl border border-[var(--gold)]/40 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
