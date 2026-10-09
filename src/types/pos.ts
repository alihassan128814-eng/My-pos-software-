export type OrderType = 'Dine-in' | 'Takeaway' | 'Delivery';

export type OrderStatus = 'New' | 'Baking' | 'Ready' | 'Completed' | 'Void';

export type PaymentMethod = 'Cash' | 'Card' | 'Mobile Wallet';

export interface MenuItemModifier {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: number;
  category: string;
  name: string;
  emoji: string;
  image?: string;
  description: string;
  price?: number; // single price
  sizes?: number[]; // [Small, Medium, Large]
  prepTime: number; // minutes
  tags: ('veg' | 'spicy' | 'bestseller' | 'chef-special')[];
  stock: number;
  isSoldOut?: boolean;
}

export interface OrderLineItem {
  id: string;
  menuItemId: number | null;
  name: string;
  size?: 'Small' | 'Medium' | 'Large' | 'Regular';
  unitPrice: number;
  quantity: number;
  modifiers: string[];
  notes?: string;
  isCombo?: boolean;
}

export interface OrderTotals {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  deliveryFee: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: number;
  createdAt: number;
  type: OrderType;
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  notes?: string;
  items: OrderLineItem[];
  totals: OrderTotals;
  paymentMethod: PaymentMethod;
  amountTendered?: number;
  changeDue?: number;
  status: OrderStatus;
  cashierName: string;
  voidReason?: string;
}

export interface ComboDeal {
  id: string;
  name: string;
  description: string;
  price: number;
  items: { menuItemId: number; name: string; quantity: number }[];
  tag: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  ordersCount: number;
  totalSpent: number;
  favoriteItem?: string;
  notes?: string;
  createdAt: number;
}

export interface WasteRecord {
  id: string;
  timestamp: number;
  menuItemId?: number;
  itemName: string;
  quantity: number;
  reason: 'Burnt' | 'Dropped / Damaged' | 'Expired' | 'Wrong Order' | 'Quality Check';
  staffName: string;
  estimatedCost: number;
  notes?: string;
}

export interface HeldOrder {
  id: string;
  heldAt: number;
  type: OrderType;
  customerName: string;
  tableNumber?: string;
  notes?: string;
  discountPercent: number;
  items: OrderLineItem[];
}

export interface POSSettings {
  restaurantName: string;
  branchName: string;
  address: string;
  phone: string;
  currencySymbol: string;
  taxRatePercent: number;
  deliveryFee: number;
  openingCashFloat: number;
  currentCashier: string;
  managerPin: string;
  soundAlerts: boolean;
  lowStockThreshold: number;
  autoPrintReceipt: boolean;
}

export interface POSState {
  settings: POSSettings;
  menu: MenuItem[];
  orders: Order[];
  combos: ComboDeal[];
  customers: CustomerRecord[];
  waste: WasteRecord[];
  heldOrders: HeldOrder[];
  nextOrderNumber: number;
}
