'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  GraduationCap,
  LogOut,
  LogIn,
  User,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  FolderLock,
  Users,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';
import { clearToken, getAuthUser, getToken, hasRole } from '@/lib/auth';

const allNavLinks = [
  { href: '/', label: 'Catalog', icon: BookOpen },
  { href: '/dashboard', label: 'My Learning', icon: LayoutDashboard, requiresAuth: true },
  { href: '/purchases', label: 'My Access', icon: FolderLock, requiresStudent: true },
  { href: '/admin/package-builder', label: 'Content Studio', icon: ShieldCheck, requiresStaff: true },
  { href: '/admin/crm', label: 'Student CRM', icon: Users, requiresStaff: true },
  { href: '/admin/assign-package', label: 'Assign Access', icon: UserCheck, requiresAdmin: true },
  { href: '/login', label: 'Sign In', icon: LogIn, guestOnly: true },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState({
    hasToken: false,
    role: null,
    name: '',
  });

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    const user = getAuthUser();

    setSession({
      hasToken: Boolean(token),
      role: user?.role || null,
      name: user?.name || '',
    });
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearToken();
    setSession({ hasToken: false, role: null, name: '' });
    setMobileMenuOpen(false);
    router.push('/');
  };

  const isNavActive = (href) => {
    if (href === '/') {
      return (
        pathname === '/' ||
        pathname.startsWith('/catalog') ||
        pathname.startsWith('/package') ||
        pathname.startsWith('/section')
      );
    }
    return pathname.startsWith(href);
  };

  // Determine links based on role
  const visibleLinks = allNavLinks.filter((link) => {
    if (!mounted) {
      // During SSR and initial mount, render public/guest links
      return link.href === '/' || link.href === '/login';
    }

    if (link.guestOnly) {
      return !session.hasToken;
    }

    if (!session.hasToken) {
      return false;
    }

    if (link.requiresAdmin) {
      return hasRole({ role: session.role }, 'admin');
    }

    if (link.requiresStaff) {
      return hasRole({ role: session.role }, 'admin', 'teacher');
    }

    if (link.requiresStudent) {
      // Show My Access to students
      return session.role === 'student';
    }

    if (link.requiresAuth) {
      return true;
    }

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm shadow-indigo-500/25 transition-transform group-hover:scale-105">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                    VidyaSetu <span className="text-indigo-600">LMS</span>
                  </span>
                  <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                    PRO
                  </span>
                </div>
                <span className="hidden text-[11px] text-slate-500 md:block">
                  India&apos;s premier competitive &amp; NISM exam prep platform
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Segmented Navigation Pill Bar (Desktop) */}
          <nav className="hidden md:flex items-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/90 p-1 text-xs shadow-inner">
              {visibleLinks.map((link) => {
                const active = isNavActive(link.href);
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition-all ${
                      active
                        ? 'bg-white text-indigo-600 shadow-sm font-semibold ring-1 ring-slate-900/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right: User Profile & Actions (Desktop) */}
          <div className="hidden items-center gap-3 md:flex">
            {mounted && session.hasToken ? (
              <>
                <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                    <User className="h-3 w-3" />
                  </div>
                  <span className="font-semibold text-slate-900 max-w-[120px] truncate">
                    {session.name}
                  </span>
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium capitalize text-indigo-700">
                    {session.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50/70 hover:text-red-600"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            {mounted && session.hasToken ? (
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-xs text-slate-700">
                <span className="max-w-[80px] truncate font-medium">{session.name}</span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200/80 bg-white px-4 py-3 shadow-lg md:hidden">
            <div className="flex flex-col gap-1">
              {visibleLinks.map((link) => {
                const active = isNavActive(link.href);
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-indigo-50 font-semibold text-indigo-600'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {mounted && session.hasToken && (
                <div className="mt-2 border-t border-slate-100 pt-2">
                  <div className="mb-2 px-3 py-1 text-xs text-slate-500">
                    Signed in as <span className="font-semibold text-slate-700">{session.name}</span> (
                    <span className="capitalize">{session.role}</span>)
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/70 py-6 text-xs text-slate-500 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} VidyaSetu LMS. High-fidelity exam simulations with real-time analytics.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Adaptive Test Engine</span>
            <span>•</span>
            <span>Sectional Drills</span>
            <span>•</span>
            <span>Step-by-Step Solutions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
