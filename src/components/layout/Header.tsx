import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearch } from "@/contexts/SearchContext";
import { useNavigate } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HeaderProps {
  title: string;
  isMobile?: boolean;
  onMenuClick?: () => void;
}

export function Header({ title, isMobile = false, onMenuClick }: HeaderProps) {
  const { query, setQuery } = useSearch();
  const navigate = useNavigate();

  // Handle navigation based on search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Navigation shortcuts
    if (value.toLowerCase() === "inventory") {
      navigate("/inventory");
      setQuery(""); // Clear search after navigation
    } else if (value.toLowerCase() === "categories") {
      navigate("/categories");
      setQuery(""); // Clear search after navigation
    } else if (value.toLowerCase() === "users") {
      navigate("/users");
      setQuery(""); // Clear search after navigation
    } else if (value.toLowerCase() === "dashboard") {
      navigate("/dashboard");
      setQuery(""); // Clear search after navigation
    } else if (value.toLowerCase() === "sold") {
      navigate("/sold");
      setQuery(""); // Clear search after navigation
    }
  };

  const { user, logout } = useAuth();

  const initials = user?.username
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold text-foreground tracking-tight truncate max-w-[200px] sm:max-w-md">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
  placeholder="Search app (inventory, users, dashboard, etc.)"
  value={query}
  onChange={handleSearchChange}
  className="w-48 sm:w-64 lg:w-80 pl-9 bg-muted/50 border-border focus:bg-background"
/>

          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-secondary" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">
                  {user?.username}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="truncate">{user?.username}</span>
                  <span className="text-xs font-normal text-muted-foreground truncate">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
