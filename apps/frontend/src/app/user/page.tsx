'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ConcertCard } from '@/components/concert-card';
import { DashboardShell, type NavItem } from '@/components/dashboard-shell';
import { HomeIcon } from '@/components/icons';
import { api, ApiError, type Concert } from '@/lib/api';
import { useRequireRole } from '@/lib/use-require-role';

const NAV_ITEMS: NavItem[] = [{ label: 'Home', href: '/user', active: true, icon: HomeIcon }];

export default function UserHomePage() {
  const { token, isReady } = useRequireRole('USER');
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !token) return;
    let cancelled = false;
    setIsLoading(true);
    api
      .getConcerts(token)
      .then((data) => {
        if (!cancelled) setConcerts(data);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load concerts.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isReady, token]);

  async function handleReserve(concert: Concert) {
    if (!token) return;
    setPendingId(concert.id);
    try {
      await api.reserve(token, concert.id);
      toast.success(`Reserved a seat for "${concert.name}"`);
      setConcerts((prev) =>
        prev.map((c) =>
          c.id === concert.id
            ? { ...c, isReservedByMe: true, reservedCount: c.reservedCount + 1, availableSeats: c.availableSeats - 1 }
            : c,
        ),
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to reserve. Please try again.');
    } finally {
      setPendingId(null);
    }
  }

  async function handleCancel(concert: Concert) {
    if (!token) return;
    setPendingId(concert.id);
    try {
      await api.cancel(token, concert.id);
      toast.success(`Cancelled your reservation for "${concert.name}"`);
      setConcerts((prev) =>
        prev.map((c) =>
          c.id === concert.id
            ? { ...c, isReservedByMe: false, reservedCount: c.reservedCount - 1, availableSeats: c.availableSeats + 1 }
            : c,
        ),
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to cancel. Please try again.');
    } finally {
      setPendingId(null);
    }
  }

  if (!isReady) return null;

  return (
    <DashboardShell title="User" navItems={NAV_ITEMS} switchHref="/login?role=admin" switchLabel="Switch to Admin">
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading concerts…</p>
      ) : concerts.length === 0 ? (
        <p className="text-sm text-gray-500">No concerts available right now.</p>
      ) : (
        <div className="space-y-5">
          {concerts.map((concert) => (
            <ConcertCard
              key={concert.id}
              name={concert.name}
              description={concert.description}
              seatCount={concert.availableSeats}
              action={
                concert.isReservedByMe ? (
                  <button
                    type="button"
                    onClick={() => handleCancel(concert)}
                    disabled={pendingId === concert.id}
                    className="rounded-md bg-brand-red px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingId === concert.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleReserve(concert)}
                    disabled={pendingId === concert.id || concert.availableSeats <= 0}
                    className="rounded-md bg-brand-cyan px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingId === concert.id
                      ? 'Reserving…'
                      : concert.availableSeats <= 0
                        ? 'Fully booked'
                        : 'Reserve'}
                  </button>
                )
              }
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
