import { POSState, Order, MenuItem, CustomerRecord, WasteRecord, HeldOrder, POSSettings, ComboDeal } from '../types/pos';
import { INITIAL_STATE } from '../data/initialData';

const LOCAL_STORAGE_KEY = 'antica_pizza_pos_local_state';

class POSApiService {
  private isOnline: boolean = true;

  // Retrieve current state from server or fallback to local storage
  async getState(): Promise<POSState> {
    try {
      const res = await fetch('/api/pos/state');
      if (res.ok) {
        const data = await res.json();
        this.saveLocalBackup(data);
        this.isOnline = true;
        return data;
      }
    } catch (err) {
      console.warn('[POS API] Backend unreachable, falling back to client cache:', err);
      this.isOnline = false;
    }
    return this.getLocalBackup();
  }

  // Create an order
  async createOrder(orderData: Partial<Order>): Promise<{ order: Order; state: POSState }> {
    try {
      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const data = await res.json();
        this.saveLocalBackup(data.state);
        return data;
      }
    } catch (err) {
      console.warn('[POS API] Order creation offline fallback:', err);
    }

    // Local fallback creation
    const state = this.getLocalBackup();
    const orderNumber = state.nextOrderNumber++;
    const newOrder: Order = {
      id: `ord-${orderNumber}-${Date.now().toString(36)}`,
      orderNumber,
      createdAt: Date.now(),
      type: orderData.type || 'Dine-in',
      customerName: (orderData.customerName || 'Walk-in Guest').trim(),
      customerPhone: orderData.customerPhone?.trim(),
      tableNumber: orderData.tableNumber?.trim(),
      notes: orderData.notes?.trim(),
      items: orderData.items || [],
      totals: orderData.totals || {
        subtotal: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: 5,
        taxAmount: 0,
        deliveryFee: 0,
        total: 0,
      },
      paymentMethod: orderData.paymentMethod || 'Cash',
      amountTendered: orderData.amountTendered,
      changeDue: orderData.changeDue,
      status: 'New',
      cashierName: orderData.cashierName || state.settings.currentCashier,
    };

    // Decrement stock
    newOrder.items.forEach((item) => {
      if (item.menuItemId) {
        const menuItem = state.menu.find((m) => m.id === item.menuItemId);
        if (menuItem) menuItem.stock = Math.max(0, (menuItem.stock ?? 20) - item.quantity);
      }
    });

    state.orders.unshift(newOrder);
    this.saveLocalBackup(state);
    return { order: newOrder, state };
  }

  // Update order status
  async updateOrderStatus(id: string, status: Order['status']): Promise<POSState> {
    try {
      const res = await fetch(`/api/pos/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        this.saveLocalBackup(data.state);
        return data.state;
      }
    } catch (err) {
      console.warn('[POS API] Status update offline fallback:', err);
    }

    const state = this.getLocalBackup();
    const order = state.orders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      this.saveLocalBackup(state);
    }
    return state;
  }

  // Void order
  async voidOrder(id: string, pin: string, reason: string): Promise<POSState> {
    try {
      const res = await fetch(`/api/pos/orders/${id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, reason }),
      });
      if (res.ok) {
        const data = await res.json();
        this.saveLocalBackup(data.state);
        return data.state;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to void order');
      }
    } catch (err: any) {
      if (err.message === 'Invalid Manager PIN') throw err;
      console.warn('[POS API] Void offline fallback:', err);
    }

    const state = this.getLocalBackup();
    if (state.settings.managerPin && pin !== state.settings.managerPin) {
      throw new Error('Invalid Manager PIN');
    }
    const order = state.orders.find((o) => o.id === id);
    if (order) {
      order.status = 'Void';
      order.voidReason = reason;
      // Restock items
      order.items.forEach((item) => {
        if (item.menuItemId) {
          const menuItem = state.menu.find((m) => m.id === item.menuItemId);
          if (menuItem) menuItem.stock = (menuItem.stock ?? 0) + item.quantity;
        }
      });
      this.saveLocalBackup(state);
    }
    return state;
  }

  // Save / Update Menu item
  async saveMenuItem(item: MenuItem): Promise<MenuItem[]> {
    try {
      const res = await fetch('/api/pos/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const data = await res.json();
        const state = this.getLocalBackup();
        state.menu = data.menu;
        this.saveLocalBackup(state);
        return data.menu;
      }
    } catch (err) {
      console.warn('[POS API] Save menu offline fallback:', err);
    }

    const state = this.getLocalBackup();
    const idx = state.menu.findIndex((m) => m.id === item.id);
    if (idx >= 0) {
      state.menu[idx] = item;
    } else {
      const nextId = state.menu.length > 0 ? Math.max(...state.menu.map((m) => m.id)) + 1 : 1;
      state.menu.push({ ...item, id: item.id || nextId });
    }
    this.saveLocalBackup(state);
    return state.menu;
  }

  // Delete Menu item
  async deleteMenuItem(id: number): Promise<MenuItem[]> {
    try {
      const res = await fetch(`/api/pos/menu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        const state = this.getLocalBackup();
        state.menu = data.menu;
        this.saveLocalBackup(state);
        return data.menu;
      }
    } catch (err) {
      console.warn('[POS API] Delete menu item fallback:', err);
    }

    const state = this.getLocalBackup();
    state.menu = state.menu.filter((m) => m.id !== id);
    this.saveLocalBackup(state);
    return state.menu;
  }

  // Update Inventory batch
  async updateInventory(updates: { id: number; stock: number }[]): Promise<MenuItem[]> {
    try {
      const res = await fetch('/api/pos/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (res.ok) {
        const data = await res.json();
        const state = this.getLocalBackup();
        state.menu = data.menu;
        this.saveLocalBackup(state);
        return data.menu;
      }
    } catch (err) {
      console.warn('[POS API] Inventory update fallback:', err);
    }

    const state = this.getLocalBackup();
    updates.forEach((u) => {
      const item = state.menu.find((m) => m.id === u.id);
      if (item) item.stock = Math.max(0, u.stock);
    });
    this.saveLocalBackup(state);
    return state.menu;
  }

  // Waste logging
  async logWaste(wasteEntry: WasteRecord): Promise<POSState> {
    try {
      const res = await fetch('/api/pos/waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wasteEntry),
      });
      if (res.ok) {
        const data = await res.json();
        const state = this.getLocalBackup();
        state.waste = data.waste;
        state.menu = data.menu;
        this.saveLocalBackup(state);
        return state;
      }
    } catch (err) {
      console.warn('[POS API] Waste logging fallback:', err);
    }

    const state = this.getLocalBackup();
    state.waste.unshift({ ...wasteEntry, id: `waste-${Date.now()}`, timestamp: Date.now() });
    if (wasteEntry.menuItemId) {
      const item = state.menu.find((m) => m.id === wasteEntry.menuItemId);
      if (item) item.stock = Math.max(0, item.stock - wasteEntry.quantity);
    }
    this.saveLocalBackup(state);
    return state;
  }

  // Save Settings
  async saveSettings(settings: POSSettings): Promise<POSSettings> {
    try {
      const res = await fetch('/api/pos/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        const state = this.getLocalBackup();
        state.settings = data.settings;
        this.saveLocalBackup(state);
        return data.settings;
      }
    } catch (err) {
      console.warn('[POS API] Save settings fallback:', err);
    }

    const state = this.getLocalBackup();
    state.settings = settings;
    this.saveLocalBackup(state);
    return settings;
  }

  // Save or remove held orders
  async manageHeldOrder(action: 'save' | 'remove', heldOrder?: HeldOrder, id?: string): Promise<HeldOrder[]> {
    try {
      const res = await fetch('/api/pos/held', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, heldOrder, id }),
      });
      if (res.ok) {
        const data = await res.json();
        const state = this.getLocalBackup();
        state.heldOrders = data.heldOrders;
        this.saveLocalBackup(state);
        return data.heldOrders;
      }
    } catch (err) {
      console.warn('[POS API] Held order fallback:', err);
    }

    const state = this.getLocalBackup();
    if (action === 'save' && heldOrder) {
      state.heldOrders.push({ ...heldOrder, id: `held-${Date.now()}`, heldAt: Date.now() });
    } else if (action === 'remove' && id) {
      state.heldOrders = state.heldOrders.filter((h) => h.id !== id);
    }
    this.saveLocalBackup(state);
    return state.heldOrders;
  }

  // Restore state from JSON backup
  async restoreBackup(backupData: any): Promise<POSState> {
    try {
      const res = await fetch('/api/pos/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup: backupData }),
      });
      if (res.ok) {
        const data = await res.json();
        this.saveLocalBackup(data.state);
        return data.state;
      }
    } catch (err) {
      console.warn('[POS API] Restore backup fallback:', err);
    }

    this.saveLocalBackup(backupData);
    return backupData;
  }

  private getLocalBackup(): POSState {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STATE;
  }

  private saveLocalBackup(state: POSState): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error(e);
    }
  }
}

export const posApi = new POSApiService();
