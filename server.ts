import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { POSState, Order, MenuItem, CustomerRecord, WasteRecord, HeldOrder, POSSettings, ComboDeal } from './src/types/pos';
import { INITIAL_STATE } from './src/data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'pos-state.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state with file persistence
let state: POSState = { ...INITIAL_STATE };

function loadPersistedState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.menu) && Array.isArray(parsed.orders)) {
        state = {
          ...INITIAL_STATE,
          ...parsed,
          settings: { ...INITIAL_STATE.settings, ...(parsed.settings || {}) },
        };
        console.log(`[POS Server] Loaded persisted state: ${state.orders.length} orders, ${state.menu.length} menu items.`);
        return;
      }
    }
  } catch (err) {
    console.error('[POS Server] Error loading persisted state, using defaults:', err);
  }
  savePersistedState();
}

function savePersistedState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[POS Server] Error saving state to disk:', err);
  }
}

loadPersistedState();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // --- API Endpoints ---

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get full POS state
  app.get('/api/pos/state', (_req: Request, res: Response) => {
    res.json(state);
  });

  // Place a new order
  app.post('/api/pos/orders', (req: Request, res: Response) => {
    try {
      const orderData: Partial<Order> = req.body;
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

      // Decrement stock for ordered items
      newOrder.items.forEach((item) => {
        if (item.menuItemId) {
          const menuItem = state.menu.find((m) => m.id === item.menuItemId);
          if (menuItem) {
            menuItem.stock = Math.max(0, (menuItem.stock ?? 20) - item.quantity);
          }
        }
      });

      // Update or link customer record if customer name or phone is provided
      if (newOrder.customerName && newOrder.customerName !== 'Walk-in Guest') {
        let customer = state.customers.find(
          (c) =>
            (newOrder.customerPhone && c.phone === newOrder.customerPhone) ||
            c.name.toLowerCase() === newOrder.customerName.toLowerCase()
        );

        if (customer) {
          customer.ordersCount += 1;
          customer.totalSpent += newOrder.totals.total;
          if (newOrder.customerPhone) customer.phone = newOrder.customerPhone;
        } else if (newOrder.customerPhone) {
          state.customers.push({
            id: `cust-${Date.now().toString(36)}`,
            name: newOrder.customerName,
            phone: newOrder.customerPhone,
            ordersCount: 1,
            totalSpent: newOrder.totals.total,
            createdAt: Date.now(),
          });
        }
      }

      state.orders.unshift(newOrder);
      savePersistedState();

      res.status(201).json({ success: true, order: newOrder, state });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create order' });
    }
  });

  // Update order status (New -> Baking -> Ready -> Completed -> Void)
  app.patch('/api/pos/orders/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const order = state.orders.find((o) => o.id === id || String(o.orderNumber) === id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    savePersistedState();
    res.json({ success: true, order, state });
  });

  // Void order with optional PIN and restock items
  app.post('/api/pos/orders/:id/void', (req: Request, res: Response) => {
    const { id } = req.params;
    const { pin, reason } = req.body;

    if (state.settings.managerPin && pin !== state.settings.managerPin) {
      return res.status(401).json({ error: 'Invalid Manager PIN' });
    }

    const order = state.orders.find((o) => o.id === id || String(o.orderNumber) === id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'Void') {
      return res.status(400).json({ error: 'Order is already voided' });
    }

    order.status = 'Void';
    order.voidReason = reason || 'Customer cancellation';

    // Restock items back to inventory
    order.items.forEach((item) => {
      if (item.menuItemId) {
        const menuItem = state.menu.find((m) => m.id === item.menuItemId);
        if (menuItem) {
          menuItem.stock = (menuItem.stock ?? 0) + item.quantity;
        }
      }
    });

    savePersistedState();
    res.json({ success: true, order, state });
  });

  // Add or update menu item
  app.post('/api/pos/menu', (req: Request, res: Response) => {
    const itemData: MenuItem = req.body;
    if (!itemData.name || !itemData.category) {
      return res.status(400).json({ error: 'Item name and category are required' });
    }

    const existingIndex = state.menu.findIndex((m) => m.id === itemData.id);
    if (existingIndex >= 0) {
      state.menu[existingIndex] = { ...state.menu[existingIndex], ...itemData };
    } else {
      const nextId = state.menu.length > 0 ? Math.max(...state.menu.map((m) => m.id)) + 1 : 1;
      state.menu.push({ ...itemData, id: itemData.id || nextId });
    }

    savePersistedState();
    res.json({ success: true, menu: state.menu });
  });

  // Delete menu item
  app.delete('/api/pos/menu/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    state.menu = state.menu.filter((m) => m.id !== id);
    savePersistedState();
    res.json({ success: true, menu: state.menu });
  });

  // Inventory adjustment / restock
  app.post('/api/pos/inventory', (req: Request, res: Response) => {
    const { updates } = req.body; // array of { id, stock }
    if (Array.isArray(updates)) {
      updates.forEach((u: { id: number; stock: number }) => {
        const item = state.menu.find((m) => m.id === u.id);
        if (item) {
          item.stock = Math.max(0, u.stock);
        }
      });
      savePersistedState();
    }
    res.json({ success: true, menu: state.menu });
  });

  // Customers
  app.post('/api/pos/customers', (req: Request, res: Response) => {
    const cust: CustomerRecord = req.body;
    if (!cust.name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const existingIndex = state.customers.findIndex((c) => c.id === cust.id);
    if (existingIndex >= 0) {
      state.customers[existingIndex] = { ...state.customers[existingIndex], ...cust };
    } else {
      state.customers.push({
        ...cust,
        id: cust.id || `cust-${Date.now().toString(36)}`,
        createdAt: Date.now(),
        ordersCount: cust.ordersCount || 0,
        totalSpent: cust.totalSpent || 0,
      });
    }

    savePersistedState();
    res.json({ success: true, customers: state.customers });
  });

  // Waste logging
  app.post('/api/pos/waste', (req: Request, res: Response) => {
    const wasteEntry: WasteRecord = req.body;
    state.waste.unshift({
      ...wasteEntry,
      id: `waste-${Date.now().toString(36)}`,
      timestamp: Date.now(),
    });

    if (wasteEntry.menuItemId) {
      const item = state.menu.find((m) => m.id === wasteEntry.menuItemId);
      if (item) {
        item.stock = Math.max(0, item.stock - wasteEntry.quantity);
      }
    }

    savePersistedState();
    res.json({ success: true, waste: state.waste, menu: state.menu });
  });

  // Combos
  app.post('/api/pos/combos', (req: Request, res: Response) => {
    const combo: ComboDeal = req.body;
    const existingIndex = state.combos.findIndex((c) => c.id === combo.id);
    if (existingIndex >= 0) {
      state.combos[existingIndex] = combo;
    } else {
      state.combos.push({ ...combo, id: combo.id || `combo-${Date.now()}` });
    }
    savePersistedState();
    res.json({ success: true, combos: state.combos });
  });

  // Held orders
  app.post('/api/pos/held', (req: Request, res: Response) => {
    const { action, heldOrder, id } = req.body;
    if (action === 'save' && heldOrder) {
      state.heldOrders.push({
        ...heldOrder,
        id: heldOrder.id || `held-${Date.now()}`,
        heldAt: Date.now(),
      });
    } else if (action === 'remove' && id) {
      state.heldOrders = state.heldOrders.filter((h) => h.id !== id);
    }
    savePersistedState();
    res.json({ success: true, heldOrders: state.heldOrders });
  });

  // Settings
  app.post('/api/pos/settings', (req: Request, res: Response) => {
    state.settings = { ...state.settings, ...req.body };
    savePersistedState();
    res.json({ success: true, settings: state.settings });
  });

  // Restore backup
  app.post('/api/pos/backup/restore', (req: Request, res: Response) => {
    try {
      const { backup } = req.body;
      if (!backup || !Array.isArray(backup.menu) || !Array.isArray(backup.orders)) {
        return res.status(400).json({ error: 'Invalid backup structure' });
      }
      state = {
        ...INITIAL_STATE,
        ...backup,
        settings: { ...INITIAL_STATE.settings, ...(backup.settings || {}) },
      };
      savePersistedState();
      res.json({ success: true, state });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Restore failed' });
    }
  });

  // Mount Vite or serve static files
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[POS Server] Running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[POS Server] Fatal error starting server:', err);
  process.exit(1);
});
