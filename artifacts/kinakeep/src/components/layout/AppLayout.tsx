import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ListOrdered, 
  Receipt, 
  Users, 
  Truck, 
  BarChart3, 
  FolderOpen, 
  Settings, 
  Menu,
  LogOut,
  X,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@workspace/replit-auth-web';
import { useBusiness } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Money In', path: '/app/money-in', icon: ArrowDownToLine },
  { name: 'Money Out', path: '/app/money-out', icon: ArrowUpFromLine },
  { name: 'Transactions', path: '/app/transactions', icon: ListOrdered },
  { name: 'Receipts', path: '/app/receipts', icon: Receipt },
  { name: 'Customers', path: '/app/customers', icon: Users },
  { name: 'Suppliers', path: '/app/suppliers', icon: Truck },
  { name: 'Reports', path: '/app/reports', icon: BarChart3 },
  { name: 'Documents', path: '/app/documents', icon: FolderOpen },
  { name: 'Settings', path: '/app/settings', icon: Settings },
];

const BOTTOM_NAV_ITEMS = [
  { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Money In', path: '/app/money-in', icon: ArrowDownToLine },
  { name: 'Money Out', path: '/app/money-out', icon: ArrowUpFromLine },
  { name: 'More', path: '#', icon: Menu },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { activeBusiness, businesses, setActiveBusiness } = useBusiness();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : 'K';

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold text-xl">
              K
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">KinaKeep</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-3 py-6 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground border border-sidebar-border">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground shrink-0">
                    {getInitials(activeBusiness?.name || '')}
                  </div>
                  <div className="flex flex-col items-start truncate">
                    <span className="text-sm font-semibold truncate">{activeBusiness?.name || 'Setup Business'}</span>
                    <span className="text-xs text-sidebar-foreground/70 truncate">{user?.firstName} {user?.lastName}</span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Your Businesses</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {businesses.map(b => (
                <DropdownMenuItem key={b.id} onClick={() => setActiveBusiness(b)}>
                  {b.name} {activeBusiness?.id === b.id && " (Active)"}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/setup">Add New Business</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.name} href={item.path} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}>
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" onClick={logout} className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <LogOut className="mr-2 h-5 w-5" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-primary text-primary-foreground border-b border-primary-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xl">
              K
            </div>
            <span className="font-display font-bold text-xl tracking-tight">KinaKeep</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2 text-primary-foreground hover:bg-primary-foreground/10">
                <span className="max-w-[100px] truncate">{activeBusiness?.name}</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Businesses</DropdownMenuLabel>
              {businesses.map(b => (
                <DropdownMenuItem key={b.id} onClick={() => setActiveBusiness(b)}>
                  {b.name} {activeBusiness?.id === b.id && " (Active)"}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around items-center p-2 pb-safe z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.name === 'More' && mobileMenuOpen);
          
          if (item.name === 'More') {
            return (
              <button 
                key={item.name}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-14 gap-1 rounded-lg transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                <span className="text-[10px] font-medium">{item.name}</span>
              </button>
            )
          }

          return (
            <Link 
              key={item.name} 
              href={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-14 gap-1 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "fill-primary/20")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Full Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] bottom-[72px] bg-background z-30 overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-muted-foreground px-4 mb-2 text-sm uppercase tracking-wider">All Pages</h3>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link 
                  key={item.name} 
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-4 rounded-xl text-base font-medium transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
            <div className="mt-8 px-4">
              <Button variant="outline" className="w-full h-12 text-base" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                <LogOut className="mr-2 h-5 w-5" />
                Log out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
