import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Network, LayoutDashboard, User, ShieldCheck, LogOut, ShoppingBag, Receipt, IdCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SidebarLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';

  const userLinks = [
    { label: 'Profile', path: '/profile', icon: User },
    /* Placeholders for Phase 3 */
    { label: 'Shop', path: '/shop', icon: ShoppingBag, disabled: true },
    { label: 'My Bills', path: '/my-bills', icon: Receipt, disabled: true },
  ];

  const adminLinks = [
    { label: 'User Management', path: '/admin/users', icon: LayoutDashboard },
    { label: 'Network Hierarchy', path: '/admin/hierarchy', icon: Network },
    { label: 'Membership Programs', path: '/admin/memberships', icon: IdCard },
  ];

  const renderLinks = (links) => {
    return links.map((link) => {
      const isActive = location.pathname.startsWith(link.path);
      const Icon = link.icon;

      return (
        <Button
          key={link.path}
          variant={isActive ? 'secondary' : 'ghost'}
          disabled={link.disabled}
          className={`w-full justify-start mb-1 ${isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
          onClick={() => navigate(link.path)}
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
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <ShieldCheck className="w-6 h-6 text-emerald-500 mr-2" />
          <span className="text-xl tracking-wider font-semibold">PEJUANG</span>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6">
          
          <div>
            <div className="text-xs font-semibold text-zinc-600 tracking-wider uppercase mb-3 px-2">Account</div>
            {renderLinks(userLinks)}
          </div>

          {isAdmin && (
            <div>
              <div className="text-xs font-semibold text-zinc-600 tracking-wider uppercase mb-3 px-2">Administration</div>
              {renderLinks(adminLinks)}
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
      <main className="flex-1 min-w-0 overflow-y-auto bg-background custom-scrollbar relative">
        <Outlet />
      </main>

    </div>
  );
}
