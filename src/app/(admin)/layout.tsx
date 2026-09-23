'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
  X,
} from 'lucide-react';

import { AuthGuard } from '@/components/shared/AuthGuard';
import { Logo } from '@/components/shared/Logo';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/lib/api';
import { ROLE_LABELS, roleHasPermission } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * `permission` hides a destination a role cannot use, so nobody is sent to a
 * page that will only reject them. Items without one are open to every
 * admin-panel role. The server enforces the same matrix on each request.
 */
const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/admin/works',
    label: 'Works',
    icon: BriefcaseBusiness,
    permission: 'create_events' as const,
  },
  {
    href: '/admin/bookings',
    label: 'Bookings',
    icon: CalendarCheck,
    permission: 'assign_staff' as const,
  },
  { href: '/admin/staff', label: 'Staff', icon: Users, badgeKey: 'pending' },
  {
    href: '/admin/payments',
    label: 'Payments',
    icon: Wallet,
    permission: 'manage_payments' as const,
  },
  {
    href: '/admin/reports',
    label: 'Reports',
    icon: BarChart3,
    permission: 'view_reports' as const,
  },
  {
    href: '/admin/admins',
    label: 'Administrators',
    icon: ShieldCheck,
    permission: 'manage_admins' as const,
  },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Badge for pending staff approvals; refreshed on navigation.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiGet<{ count: number }>('/staff/pending');
        if (!cancelled) setPendingCount(response.data.count);
      } catch {
        // A missing badge is not worth surfacing.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setSidebarOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    router.replace('/login');
  };

  const navItems = NAV.filter(
    (item) => !item.permission || roleHasPermission(user?.role, item.permission),
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <Logo size={36} variant="on-dark" priority />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">Reem&apos;s Kitchen</p>
          <p className="text-[11px] text-sidebar-foreground/60">Admin Panel</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto text-sidebar-foreground hover:bg-white/10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin" aria-label="Admin">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const badge =
            'badgeKey' in item && item.badgeKey === 'pending' && pendingCount > 0
              ? pendingCount
              : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent',
                active
                  ? 'bg-sidebar-accent text-white'
                  : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground',
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
              <span className="flex-1 truncate">{item.label}</span>
              {badge && (
                <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <UserAvatar user={user} className="h-8 w-8" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.fullName}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">
              {user?.role ? ROLE_LABELS[user.role] : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-64">{sidebar}</div>
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          />
          <div className="animate-in-up absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </Button>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold">
                {navItems.find((item) => isActive(item.href))?.label || 'Admin'}
              </h2>
            </div>

            <div className="flex items-center gap-0.5">
              <ThemeToggle />
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Account menu"
                  >
                    <UserAvatar user={user} className="h-8 w-8" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-medium">{user?.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile">
                      <UserCog />
                      My account
                    </Link>
                  </DropdownMenuItem>
                  {roleHasPermission(user?.role, 'manage_admins') && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/admins">
                        <ShieldCheck />
                        Manage administrators
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allow={['event_manager', 'finance_manager', 'admin', 'super_admin']}>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
