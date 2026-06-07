'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { DashboardShell, type NavItem } from '@/components/dashboard-shell';
import { HistoryIcon, HomeIcon } from '@/components/icons';
import { api, type ReservationLogEntry } from '@/lib/api';
import { useRequireRole } from '@/lib/use-require-role';

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/admin', active: false, icon: HomeIcon },
  { label: 'History', href: '/admin/history', active: true, icon: HistoryIcon },
];

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function AdminHistoryPage() {
  const { token, isReady } = useRequireRole('ADMIN');
  const [entries, setEntries] = useState<ReservationLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isReady || !token) return;
    let cancelled = false;
    setIsLoading(true);
    api
      .getAllHistory(token)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load history.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isReady, token]);

  if (!isReady) return null;

  return (
    <DashboardShell title="Admin" navItems={NAV_ITEMS} switchHref="/login?role=user" switchLabel="Switch to user">
      <h2 className="text-xl font-bold text-gray-900">History</h2>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Date time</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Username</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Concert name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  Loading history…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No reservation activity yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 text-gray-700">{formatDateTime(entry.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-700">{entry.username}</td>
                  <td className="px-4 py-3 text-gray-700">{entry.concertName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        entry.action === 'RESERVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {entry.action === 'RESERVE' ? 'Reserve' : 'Cancel'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
