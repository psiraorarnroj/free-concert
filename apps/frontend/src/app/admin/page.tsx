'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { ConcertCard } from '@/components/concert-card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DashboardShell, type NavItem } from '@/components/dashboard-shell';
import { FormField } from '@/components/form-field';
import { AwardIcon, HistoryIcon, HomeIcon, PersonIcon, SaveIcon, XCircleIcon } from '@/components/icons';
import { api, ApiError, type Concert, type ReservationLogEntry } from '@/lib/api';
import { useRequireRole } from '@/lib/use-require-role';

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/admin', active: true, icon: HomeIcon },
  { label: 'History', href: '/admin/history', active: false, icon: HistoryIcon },
];

type Tab = 'overview' | 'create';

const STAT_CARDS: Array<{
  key: 'totalSeats' | 'reserve' | 'cancel';
  label: string;
  icon: typeof PersonIcon;
  className: string;
}> = [
  { key: 'totalSeats', label: 'Total of seats', icon: PersonIcon, className: 'bg-brand-blue' },
  { key: 'reserve', label: 'Reserve', icon: AwardIcon, className: 'bg-brand-green' },
  { key: 'cancel', label: 'Cancel', icon: XCircleIcon, className: 'bg-brand-red' },
];

export default function AdminHomePage() {
  const { token, isReady } = useRequireRole('ADMIN');
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [history, setHistory] = useState<ReservationLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [pendingDelete, setPendingDelete] = useState<Concert | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  function loadData(authToken: string) {
    setIsLoading(true);
    return Promise.all([api.getConcerts(authToken), api.getAllHistory(authToken)])
      .then(([concertData, historyData]) => {
        setConcerts(concertData);
        setHistory(historyData);
      })
      .catch(() => toast.error('Failed to load dashboard data.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    if (!isReady || !token) return;
    loadData(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, token]);

  const stats = useMemo(
    () => ({
      totalSeats: concerts.reduce((sum, c) => sum + c.totalSeats, 0),
      reserve: history.filter((entry) => entry.action === 'RESERVE').length,
      cancel: history.filter((entry) => entry.action === 'CANCEL').length,
    }),
    [concerts, history],
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const seats = Number(totalSeats);
    if (!name.trim()) {
      setErrors({ name: 'Concert name is required' });
      return;
    }
    if (!totalSeats || !Number.isInteger(seats) || seats <= 0) {
      setErrors({ totalSeats: 'Total of seat must be a positive whole number' });
      return;
    }
    if (!description.trim()) {
      setErrors({ description: 'Description is required' });
      return;
    }

    setIsSaving(true);
    try {
      await api.createConcert(token!, { name: name.trim(), description: description.trim(), totalSeats: seats });
      toast.success('Create successfully');
      setName('');
      setTotalSeats('');
      setDescription('');
      setTab('overview');
      await loadData(token!);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const fieldErrors: Record<string, string> = {};
        for (const message of err.details.length ? err.details : [err.message]) {
          const lower = message.toLowerCase();
          if (lower.includes('name')) fieldErrors.name = message;
          else if (lower.includes('description')) fieldErrors.description = message;
          else if (lower.includes('seat')) fieldErrors.totalSeats = message;
          else fieldErrors.form = message;
        }
        setErrors(fieldErrors);
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Failed to create concert.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete || !token) return;
    setIsDeleting(true);
    try {
      await api.deleteConcert(token, pendingDelete.id);
      toast.success(`Deleted "${pendingDelete.name}"`);
      setPendingDelete(null);
      await loadData(token);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete concert.');
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isReady) return null;

  return (
    <DashboardShell title="Admin" navItems={NAV_ITEMS} switchHref="/login?role=user" switchLabel="Switch to user">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STAT_CARDS.map(({ key, label, icon: StatIcon, className }) => (
          <div key={key} className={`rounded-lg ${className} px-6 py-5 text-center text-white shadow-sm`}>
            <StatIcon className="mx-auto h-6 w-6 text-white/80" />
            <p className="mt-1 text-sm text-white/80">{label}</p>
            <p className="mt-1 text-3xl font-bold">{stats[key].toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-6 border-b border-gray-200">
        {(['overview', 'create'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold capitalize transition-colors ${
              tab === value ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' ? (
          isLoading ? (
            <p className="text-sm text-gray-500">Loading concerts…</p>
          ) : concerts.length === 0 ? (
            <p className="text-sm text-gray-500">No concerts yet. Create one to get started.</p>
          ) : (
            <div className="space-y-5">
              {concerts.map((concert) => (
                <ConcertCard
                  key={concert.id}
                  name={concert.name}
                  description={concert.description}
                  seatCount={concert.totalSeats}
                  action={
                    <button
                      type="button"
                      onClick={() => setPendingDelete(concert)}
                      className="rounded-md bg-brand-red px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark"
                    >
                      Delete
                    </button>
                  }
                />
              ))}
            </div>
          )
        ) : (
          <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-cyan">Create</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-5 border-t border-gray-100 pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Concert Name"
                  name="name"
                  type="text"
                  placeholder="Please input concert name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />
                <FormField
                  label="Total of seat"
                  name="totalSeats"
                  type="number"
                  min={1}
                  placeholder="500"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(e.target.value)}
                  error={errors.totalSeats}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Please input description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
                    errors.description ? 'border-brand-red' : 'border-gray-300'
                  }`}
                />
                {errors.description ? <p className="mt-1 text-xs text-brand-red-dark">{errors.description}</p> : null}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-md bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SaveIcon className="h-4 w-4" />
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {pendingDelete ? (
        <ConfirmDialog
          title={`Are you sure to delete "${pendingDelete.name}"?`}
          confirmLabel="Yes, Delete"
          isBusy={isDeleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </DashboardShell>
  );
}
