import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, CheckCircle2, Flame, Bell, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { Order, OrderStatus, POSSettings } from '../types/pos';
import { formatTimeAgo, formatTime } from '../utils/format';

interface KitchenDisplayProps {
  orders: Order[];
  settings: POSSettings;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({
  orders,
  settings,
  onUpdateStatus,
}) => {
  const [filter, setFilter] = useState<'All' | 'New' | 'Baking' | 'Ready'>('All');
  const [now, setNow] = useState(Date.now());
  const [soundMuted, setSoundMuted] = useState(!settings.soundAlerts);

  // Update timer tick every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Filter active kitchen orders
  const activeOrders = orders
    .filter((o) => o.status !== 'Completed' && o.status !== 'Void')
    .filter((o) => filter === 'All' || o.status === filter)
    .sort((a, b) => a.createdAt - b.createdAt); // Oldest first

  const getUrgency = (createdAt: number) => {
    const mins = Math.floor((now - createdAt) / 60000);
    if (mins >= 15) return 'critical';
    if (mins >= 10) return 'warning';
    return 'normal';
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#17191b] text-[#f3f1ec] overflow-hidden">
      {/* KDS Header */}
      <div className="p-4 sm:p-5 border-b border-[#272b2d] bg-[#1b1e20] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c93a2f] to-[#8f1d17] flex items-center justify-center text-white shadow-sm">
            <ChefHat className="w-5 h-5 text-[#d9b560]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-white leading-tight">
              Woodfire Oven & Kitchen Display (KDS)
            </h2>
            <p className="text-xs text-[#9a978f] mt-0.5">
              {activeOrders.length} active tickets queued · Priority by arrival time
            </p>
          </div>
        </div>

        {/* Filters & Sound controls */}
        <div className="flex items-center gap-3">
          {/* Status filter tabs */}
          <div className="flex p-1 bg-black/40 border border-[#272b2d] rounded-xl text-xs font-semibold">
            {(['All', 'New', 'Baking', 'Ready'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filter === st ? 'bg-white/15 text-white shadow-sm' : 'text-[#9a978f] hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => setSoundMuted(!soundMuted)}
            title={soundMuted ? 'Unmute kitchen alert chime' : 'Mute kitchen alert chime'}
            className="p-2 rounded-xl bg-white/5 border border-[#272b2d] hover:bg-white/10 text-[#f3f1ec] transition-colors"
          >
            {soundMuted ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#d9b560]" />
            )}
          </button>
        </div>
      </div>

      {/* Ticket Grid Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {activeOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
              ✨
            </div>
            <div className="font-display font-bold text-lg text-white">Kitchen All Clear</div>
            <p className="text-xs text-[#9a978f] max-w-sm">
              All pizza orders have been baked, plated and dispatched. New incoming orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeOrders.map((order) => {
              const urgency = getUrgency(order.createdAt);
              const elapsedMinutes = Math.floor((now - order.createdAt) / 60000);

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border flex flex-col justify-between shadow-lg transition-all ${
                    urgency === 'critical'
                      ? 'bg-[#211617] border-rose-600/70 shadow-rose-950/30'
                      : urgency === 'warning'
                      ? 'bg-[#221d15] border-amber-600/60 shadow-amber-950/20'
                      : 'bg-[#1e2225] border-[#2f3539]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3.5 border-b border-white/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-lg text-white">
                            #{order.orderNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              order.status === 'New'
                                ? 'bg-rose-500/20 text-rose-300'
                                : order.status === 'Baking'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#9a978f] font-medium mt-0.5">
                          {order.type} ·{' '}
                          {order.tableNumber ? `Table ${order.tableNumber}` : order.customerName}
                        </div>
                      </div>

                      {/* Time Alert Badge */}
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold tabular-nums ${
                          urgency === 'critical'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : urgency === 'warning'
                            ? 'bg-amber-600 text-white'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsedMinutes}m</span>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mt-2 p-1.5 bg-black/30 rounded-lg text-xs text-amber-300 font-medium italic">
                        Note: {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Card Line Items */}
                  <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-64 divide-y divide-white/5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="pt-2 first:pt-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-display font-bold text-sm text-white">
                            <span className="text-[#d9b560] font-black mr-1.5">
                              {item.quantity}x
                            </span>
                            {item.name}
                          </span>
                          {item.size && item.size !== 'Regular' && (
                            <span className="text-[11px] font-semibold text-slate-300 bg-white/10 px-1.5 py-0.2 rounded">
                              {item.size}
                            </span>
                          )}
                        </div>

                        {/* Modifiers / Dips */}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-[11px] text-slate-400 mt-1 pl-4 space-y-0.5">
                            {item.modifiers.map((mod, mIdx) => (
                              <div key={mIdx}>+ {mod}</div>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <div className="text-[11px] text-amber-400/90 italic pl-4 mt-0.5">
                            ★ {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Card Action Controls */}
                  <div className="p-3 bg-black/20 border-t border-white/10 flex gap-2">
                    {order.status === 'New' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(order.id, 'Baking')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-display font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Flame className="w-4 h-4" />
                        <span>In Oven / Baking</span>
                      </button>
                    )}

                    {order.status === 'Baking' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(order.id, 'Ready')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Ready to Serve</span>
                      </button>
                    )}

                    {order.status === 'Ready' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(order.id, 'Completed')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-display font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Complete & Dispatch</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
