'use client';

import type { ReactNode, SVGProps } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LogoutIcon, SwitchIcon } from './icons';

export interface NavItem {
  label: string;
  href: string;
  active: boolean;
  icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function DashboardShell({
  title,
  navItems,
  switchHref,
  switchLabel,
  children,
}: {
  title: string;
  navItems: NavItem[];
  switchHref: string;
  switchLabel: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const sidebarContent = (
    <>
      <div>
        <h1 className="hidden text-xl font-bold text-gray-900 lg:block">{title}</h1>
        <nav className="space-y-1 lg:mt-8">
          {navItems.map((item) => {
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-brand-active text-brand-blue'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ItemIcon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href={switchHref}
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <SwitchIcon className="h-5 w-5" />
            {switchLabel}
          </Link>
        </nav>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <LogoutIcon className="h-5 w-5" />
        Logout
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 lg:hidden">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </header>

      {isSidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col justify-between border-r border-gray-200 bg-white px-5 py-6 transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:w-60 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : ''
        }`}
      >
        <div className="flex items-center justify-between lg:hidden">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
