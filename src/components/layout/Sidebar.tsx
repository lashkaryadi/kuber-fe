import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Gem,
  FolderOpen,
  ShoppingCart,
  Users,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Gem },
  { name: 'Categories', href: '/categories', icon: FolderOpen },
  { name: 'Sold Items', href: '/sold', icon: ShoppingCart },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, adminOnly: true },
  { name: 'Audit Logs', href: '/audit-logs', icon: Shield, adminOnly: true },
  { name: 'Users', href: '/users', icon: Users, adminOnly: true },
  { name: 'Settings', href: '/settings/company', icon: Settings, adminOnly: true },
];

interface SidebarProps {
  isMobile?: boolean;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Sidebar({ isMobile = false, mobileMenuOpen = false, setMobileMenuOpen, }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(isMobile ? true : false);

  // Update collapsed state based on screen size
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [isMobile]);

  const filteredNavigation = navigation.filter(
    item => !item.adminOnly || user?.role === 'admin'
  );

  // Close mobile menu when navigating
  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen?.(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col",
          isMobile
  ? `transform ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} w-64`
  : collapsed
    ? "w-16"
    : "w-64"

        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && !isMobile && (
            <div className="flex items-center gap-2">
              <Gem className="h-7 w-7 text-sidebar-primary" />
              <span className="font-serif text-lg font-semibold text-sidebar-foreground">
                Kuber
              </span>
            </div>
          )}
          {(collapsed || isMobile) && (
            <div className="flex items-center gap-2">
              <Gem className="h-7 w-7 text-sidebar-primary" />
              {!isMobile && <span className="sr-only">Kuber</span>}
            </div>
          )}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
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
                title={collapsed || isMobile ? item.name : undefined}
                onClick={() => isMobile && setMobileMenuOpen?.(false)}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
                {!(collapsed || isMobile) && <span className="font-medium">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          {!(collapsed || isMobile) && user && (
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
            title={collapsed || isMobile ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!(collapsed || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
