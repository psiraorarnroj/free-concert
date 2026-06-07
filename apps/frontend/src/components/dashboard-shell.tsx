'use client';

import type { ReactNode, SVGProps } from 'react';
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

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen flex-1 bg-gray-50">
      <aside className="flex w-60 shrink-0 flex-col justify-between border-r border-gray-200 bg-white px-5 py-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
      </aside>

      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
