import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Gem, 
  FolderOpen, 
  ShoppingCart, 
  Users, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Gem },
  { name: 'Categories', href: '/categories', icon: FolderOpen },
  { name: 'Sold Items', href: '/sold', icon: ShoppingCart },
  { name: 'Users', href: '/users', icon: Users, adminOnly: true },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavigation = navigation.filter(
    item => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Gem className="h-7 w-7 text-sidebar-primary" />
            <span className="font-serif text-lg font-semibold text-sidebar-foreground">
              GemStock
            </span>
          </div>
        )}
        {collapsed && (
          <Gem className="h-7 w-7 text-sidebar-primary mx-auto" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto scrollbar-thin">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "sidebar-link",
                isActive && "sidebar-link-active"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed && user && (
          <div className="mb-3 px-3 py-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.username}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {user.role}
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className="sidebar-link w-full text-sidebar-foreground/70 hover:text-destructive"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
