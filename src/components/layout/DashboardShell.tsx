'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  FileCheck,
  QrCode,
  ScanLine,
  Wallet,
  LogOut,
  User as UserIcon,
  Shield,
  Menu,
  X,
  UserGroup,
} from 'lucide-react';
import { User, UserRole } from '@/types';
import { cn, formatRoleName } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DashboardShellProps {
  user: User;
  children: React.ReactNode;
}

export default function DashboardShell({ user: initialUser, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState<User>(initialUser);

  // Sync state if initialUser changes
  React.useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const isAdminOrPembina = user.role === 'admin_inventaris' || user.role === 'pembina';
  const isBendahara = user.role === 'bendahara';

  // Navigation Items according to User Role
  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['member', 'admin_inventaris', 'bendahara', 'pembina'],
    },
    {
      title: 'Inventaris Barang',
      href: '/inventory',
      icon: Boxes,
      roles: ['member', 'admin_inventaris', 'bendahara', 'pembina'],
    },
    {
      title: 'Persetujuan Surpin',
      href: '/surpin-approval',
      icon: FileCheck,
      badge: 'Admin',
      roles: ['admin_inventaris', 'pembina'],
    },
    {
      title: 'Sesi Presensi QR',
      href: '/attendance/session',
      icon: ScanLine,
      badge: 'Pengurus',
      roles: ['admin_inventaris', 'pembina'],
    },
    {
      title: 'Presensi Kehadiran',
      href: '/attendance',
      icon: QrCode,
      roles: ['member', 'admin_inventaris', 'bendahara', 'pembina'],
    },
    {
      title: 'Buku Kas Digital',
      href: '/finance',
      icon: Wallet,
      roles: ['member', 'admin_inventaris', 'bendahara', 'pembina'],
    },
  ];

  const allowedNavItems = navItems.filter((item) => item.roles.includes(user.role));

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const roleBadgeVariants: Record<UserRole, "secondary" | "success" | "warning" | "danger" | "neutral"> = {
    member: "secondary",
    admin_inventaris: "warning",
    bendahara: "success",
    pembina: "danger",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* ======================================================== */}
      {/* 1. DESKTOP SIDEBAR (Collapsible/Full Shell on >= md screen) */}
      {/* ======================================================== */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 z-30">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
            <UserGroup className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">ExtraKita</span>
            <span className="block text-[11px] text-slate-500 font-medium -mt-1">Manajemen Ekskul</span>
          </div>
        </div>

        {/* User Info & Role Badge */}
        <div className="p-4 mx-3 my-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
            <div className="mt-0.5">
              <Badge variant={roleBadgeVariants[user.role]} className="text-[10px] px-2 py-0">
                {formatRoleName(user.role)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('h-5 w-5', isActive ? 'text-blue-400' : 'text-slate-400')} />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-semibold',
                      isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer & Logout */}
        <div className="p-3 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Keluar Akun
          </Button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MOBILE TOP BAR (Sticky Header on Mobile) */}
      {/* ======================================================== */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <UserGroup className="h-4 w-4 text-blue-400" />
          </div>
          <span className="font-bold text-base text-slate-900">ExtraKita</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={roleBadgeVariants[user.role]} className="text-[10px]">
            {formatRoleName(user.role)}
          </Badge>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu (When hamburger clicked) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-4/5 max-w-xs bg-white h-full p-4 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                  <UserGroup className="h-4 w-4 text-blue-400" />
                </div>
                <span className="font-bold text-base text-slate-900">ExtraKita</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Profile in Drawer */}
            <div className="py-4 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
              <div className="mt-2">
                <Badge variant={roleBadgeVariants[user.role]} className="text-[10px]">
                  {formatRoleName(user.role)}
                </Badge>
              </div>
            </div>

            {/* Menu List */}
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {allowedNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium min-h-[44px]',
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn('h-5 w-5', isActive ? 'text-blue-400' : 'text-slate-400')} />
                      <span>{item.title}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Logout */}
            <div className="pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Keluar Akun
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN CONTENT CONTAINER */}
      {/* ======================================================== */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* ======================================================== */}
      {/* 4. MOBILE BOTTOM NAVIGATION (4 Tabs for Member / Mobile)  */}
      {/* Thumb Zone Optimized: min 44x44px touch targets           */}
      {/* ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 h-16 px-4 flex items-center justify-around shadow-lg">
        {/* Tab 1: Home */}
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] transition-colors',
            pathname === '/dashboard' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[11px] mt-1">Home</span>
        </Link>

        {/* Tab 2: Inventory */}
        <Link
          href="/inventory"
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] transition-colors',
            pathname.startsWith('/inventory') ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Boxes className="h-5 w-5" />
          <span className="text-[11px] mt-1">Inventory</span>
        </Link>

        {/* Tab 3: Scan QR (Elevated Thumb Zone Action) */}
        <Link
          href="/attendance"
          className="flex flex-col items-center justify-center flex-1 -mt-5"
        >
          <div className={cn(
            'h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95',
            pathname.startsWith('/attendance')
              ? 'bg-blue-600 text-white ring-4 ring-blue-100'
              : 'bg-slate-900 text-white'
          )}>
            <QrCode className="h-6 w-6" />
          </div>
          <span className={cn(
            'text-[10px] mt-1 font-medium',
            pathname.startsWith('/attendance') ? 'text-blue-600' : 'text-slate-600'
          )}>
            Scan QR
          </span>
        </Link>

        {/* Tab 4: Finance or Admin Approval depending on Role */}
        {isAdminOrPembina ? (
          <Link
            href="/surpin-approval"
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] transition-colors',
              pathname.startsWith('/surpin-approval') ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <FileCheck className="h-5 w-5" />
            <span className="text-[11px] mt-1">Surpin</span>
          </Link>
        ) : (
          <Link
            href="/finance"
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] transition-colors',
              pathname.startsWith('/finance') ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Wallet className="h-5 w-5" />
            <span className="text-[11px] mt-1">Kas</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
