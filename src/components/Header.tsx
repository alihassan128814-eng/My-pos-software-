import React from 'react';
import { ChefHat, Flame, ShoppingBag, UtensilsCrossed, PackageOpen, Users, BarChart3, Keyboard, Bell } from 'lucide-react';
import { POSSettings } from '../types/pos';

export type ActiveTab = 'terminal' | 'kitchen' | 'orders' | 'menu' | 'inventory' | 'customers' | 'reports';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: POSSettings;
  activeKitchenCount: number;
  lowStockCount: number;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  activeKitchenCount,
  lowStockCount,
  onOpenShortcuts,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#17191b] text-[#f3f1ec] border-b border-[#272b2d] shadow-sm select-none">
      {/* Zone 1: Brand wordmark (single text element / brand lockup) */}
      <div
        onClick={() => setActiveTab('terminal')}
        className="flex items-center gap-2.5 cursor-pointer group whitespace-nowrap shrink-0"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c93a2f] to-[#8f1d17] flex items-center justify-center text-white shadow-inner">
          <Flame className="w-4 h-4 text-[#d9b560]" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight text-white group-hover:text-[#d9b560] transition-colors">
          {settings.restaurantName}
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'terminal'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-[#9a978f] hover:text-white hover:bg-white/5'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Counter POS</span>
        </button>

        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 relative ${
            activeTab === 'kitchen'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-[#9a978f] hover:text-white hover:bg-white/5'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5 text-[#d9b560]" />
          <span>Kitchen KDS</span>
          {activeKitchenCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#c93a2f] text-white">
              {activeKitchenCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'orders'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-[#9a978f] hover:text-white hover:bg-white/5'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Orders & Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'menu'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-[#9a978f] hover:text-white hover:bg-white/5'
          }`}
        >
          <span>Menu & Pricing</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'inventory'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-[#9a978f] hover:text-white hover:bg-white/5'
          }`}
        >
          <PackageOpen className="w-3.5 h-3.5" />
          <span>Stock & Waste</span>
          {lowStockCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/90 text-white">
              {lowStockCount} low
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'customers'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-[#9a978f] hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Customers CRM</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'reports'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-[#9a978f] hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Daily Reports</span>
        </button>
      </nav>

      {/* Zone 3: Quick Terminal Status / Keyboard Shortcuts Trigger */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex flex-col text-right text-xs">
          <span className="font-medium text-white">{settings.currentCashier}</span>
          <span className="text-[#9a978f]">{settings.branchName}</span>
        </div>

        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (Press ? or Ctrl+/)"
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#f3f1ec] transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <Keyboard className="w-4 h-4 text-[#d9b560]" />
          <span className="hidden md:inline">Shortcuts</span>
        </button>
      </div>
    </header>
  );
};
