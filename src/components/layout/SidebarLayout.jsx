import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Network, ShieldCheck, LayoutDashboard, TrendingUp, Building2, Briefcase, User, LogOut, ShoppingBag, Receipt, IdCard, Menu, X, Layers, DollarSign, Calendar, Award, ClipboardCheck, Trophy, Weight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SidebarLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
  const isBranchAdmin = user?.isBranchAdmin === true;

  const userLinks = [
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'MACAT Portal', path: '/tournaments', icon: Trophy },
    { label: 'Gelanggang', path: '/gelanggang', icon: Layers },
    { label: 'Shop', path: '/shop', icon: ShoppingBag },
    { label: 'My Bills & History', path: '/orders', icon: Receipt },
    { label: 'My Commissions', path: '/commissions', icon: DollarSign },
  ];

  const gayongLinks = [
    { label: 'User Management', path: '/admin/users', icon: LayoutDashboard },
    { label: 'Calendar (Takwim)', path: '/admin/calendar', icon: Calendar },
    { label: 'Cawangan Management', path: '/admin/cawangan', icon: Building2 },
    { label: 'MACAT Tournaments', path: '/admin/tournaments', icon: Trophy },
    { label: 'Weight Classes', path: '/admin/weight-classes', icon: Weight },
    { label: 'Position Management', path: '/admin/positions', icon: Briefcase },
    { label: 'Gelanggang Management', path: '/admin/gelanggang', icon: Layers },
    { label: 'Bengkung & Silibus', path: '/admin/bengkung', icon: Award },
    { label: 'Sesi Ujian', path: '/admin/ujian-events', icon: ClipboardCheck },
    { label: 'Pending Rewards', path: '/admin/pending-rewards', icon: Award },
    { label: 'Membership Programs', path: '/admin/memberships', icon: IdCard },
  ];

  const pejuangLinks = [
    { label: 'Financial Hub', path: '/admin/finance', icon: TrendingUp },
    { label: 'Billing & Orders', path: '/orders', icon: Receipt },
    { label: 'Introducer Payouts', path: '/admin/commissions', icon: Layers },
    { label: 'Network Hierarchy', path: '/admin/hierarchy', icon: Network },
    { label: 'Product Catalog', path: '/admin/products', icon: ShoppingBag },
    { label: 'Product Categories', path: '/admin/categories', icon: LayoutDashboard },
    { label: 'Order Tiers', path: '/admin/tiers', icon: Layers },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  const renderLinks = (links) => {
    return links.map((link) => {
      const isActive = location.pathname.startsWith(link.path);
      const Icon = link.icon;

      return (
        <Button
          key={link.path}
          variant={isActive ? 'secondary' : 'ghost'}
          disabled={link.disabled}
          className={cn(
            "w-full justify-start mb-1",
            isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
          onClick={() => handleNavigate(link.path)}
        >
          <Icon className="w-5 h-5 mr-3" />
          {link.label}
          {link.disabled && <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>}
        </Button>
      );
    });
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card flex flex-col shrink-0 transition-transform duration-300 lg:static lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>

        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
          <div className="flex items-center">
            <ShieldCheck className="w-6 h-6 text-emerald-500 mr-2" />
            <span className="text-xl tracking-wider font-semibold">PEJUANG GM</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-0 h-8 w-8 absolute right-4"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6">

          <div>
            <div className="text-xs font-semibold text-zinc-600 tracking-wider uppercase mb-3 px-2">Account</div>
            {renderLinks(userLinks)}
          </div>

          {(isAdmin || isBranchAdmin) && (
            <div>
              <div className="text-xs font-semibold text-zinc-600 tracking-wider uppercase mb-3 px-2">Gayong Maarifat</div>
              {renderLinks(isAdmin ? gayongLinks : [{ label: 'User Management', path: '/admin/users', icon: LayoutDashboard }])}
            </div>
          )}

          {isAdmin && (
            <div>
              <div className="text-xs font-semibold text-zinc-600 tracking-wider uppercase mb-3 px-2">Pejuang313</div>
              {renderLinks(pejuangLinks)}
            </div>
          )}

        </div>

        {/* Footer Area */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3 px-2 mb-4">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}`} alt="Avatar" className="w-9 h-9 rounded-full ring-1 ring-border bg-muted" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>

          <Button variant="ghost" onClick={logout} className="w-full justify-start text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10">
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Mobile Navbar */}
        <header className="h-16 flex items-center px-4 border-b border-border bg-card lg:hidden shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="mr-3"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center">
            <ShieldCheck className="w-5 h-5 text-emerald-500 mr-2" />
            <span className="text-lg tracking-wider font-semibold">PEJUANG GM</span>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-y-auto bg-background custom-scrollbar relative">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
