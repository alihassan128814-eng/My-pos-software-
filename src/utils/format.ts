import { Order, OrderTotals, POSSettings } from '../types/pos';

export function formatCurrency(amount: number, symbol: string = 'Rs'): string {
  const rounded = Math.round(amount);
  return `${symbol} ${rounded.toLocaleString()}`;
}

export function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m ago`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Generate formatted plain-text receipt for thermal printer simulation
export function generateThermalReceiptText(order: Order, settings: POSSettings): string {
  const width = 34;
  const line = (left: string, right: string = '') => {
    const space = Math.max(1, width - left.length - right.length);
    return left + ' '.repeat(space) + right;
  };
  const separator = '-'.repeat(width);

  const lines: string[] = [
    settings.restaurantName.toUpperCase().padStart(Math.floor((width + settings.restaurantName.length) / 2)),
    settings.branchName.padStart(Math.floor((width + settings.branchName.length) / 2)),
    settings.address.padStart(Math.floor((width + settings.address.length) / 2)),
    settings.phone.padStart(Math.floor((width + settings.phone.length) / 2)),
    separator,
    line(`Order #${order.orderNumber}`, order.type.toUpperCase()),
    line(`Date: ${formatDate(order.createdAt)}`, formatTime(order.createdAt)),
    line(`Server: ${order.cashierName}`),
    order.tableNumber ? line(`Table: ${order.tableNumber}`) : line(`Customer: ${order.customerName}`),
    order.customerPhone ? line(`Phone: ${order.customerPhone}`) : '',
    order.notes ? line(`Note: ${order.notes}`) : '',
    separator,
  ].filter(Boolean);

  order.items.forEach((item) => {
    const itemTitle = `${item.quantity}x ${item.name}${item.size && item.size !== 'Regular' ? ` (${item.size})` : ''}`;
    const priceStr = formatCurrency(item.unitPrice * item.quantity, settings.currencySymbol);
    lines.push(line(itemTitle.slice(0, 22), priceStr));
    if (item.modifiers && item.modifiers.length > 0) {
      lines.push(`  + ${item.modifiers.join(', ')}`);
    }
  });

  lines.push(separator);
  lines.push(line('Subtotal', formatCurrency(order.totals.subtotal, settings.currencySymbol)));

  if (order.totals.discountAmount > 0) {
    lines.push(line(`Discount (${order.totals.discountPercent}%)`, `-${formatCurrency(order.totals.discountAmount, settings.currencySymbol)}`));
  }

  lines.push(line(`GST / Tax (${order.totals.taxPercent}%)`, formatCurrency(order.totals.taxAmount, settings.currencySymbol)));

  if (order.totals.deliveryFee > 0) {
    lines.push(line('Delivery Fee', formatCurrency(order.totals.deliveryFee, settings.currencySymbol)));
  }

  lines.push(separator);
  lines.push(line('TOTAL DUE', formatCurrency(order.totals.total, settings.currencySymbol)));
  lines.push(line('Payment Method', order.paymentMethod));

  if (order.amountTendered !== undefined) {
    lines.push(line('Amount Tendered', formatCurrency(order.amountTendered, settings.currencySymbol)));
    lines.push(line('Change Given', formatCurrency(order.changeDue || 0, settings.currencySymbol)));
  }

  lines.push(separator);
  lines.push('Thank you for dining with us!'.padStart(Math.floor((width + 29) / 2)));
  lines.push('Tax Invoice / NTN Verified'.padStart(Math.floor((width + 26) / 2)));

  return lines.join('\n');
}

// Generate CSV data for sales and items
export function exportOrdersToCSV(orders: Order[], settings: POSSettings): void {
  const headers = [
    'Order #',
    'Date',
    'Time',
    'Type',
    'Customer / Table',
    'Status',
    'Payment Method',
    'Items Count',
    'Subtotal',
    'Discount',
    'Tax',
    'Delivery',
    'Total',
    'Cashier',
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    new Date(o.createdAt).toISOString().split('T')[0],
    new Date(o.createdAt).toLocaleTimeString(),
    `"${o.type}"`,
    `"${o.customerName || o.tableNumber || ''}"`,
    `"${o.status}"`,
    `"${o.paymentMethod}"`,
    o.items.reduce((acc, i) => acc + i.quantity, 0),
    o.totals.subtotal,
    o.totals.discountAmount,
    o.totals.taxAmount,
    o.totals.deliveryFee,
    o.totals.total,
    `"${o.cashierName}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${settings.restaurantName.replace(/\s+/g, '_')}_Sales_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
