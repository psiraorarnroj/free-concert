import { XCircleIcon } from './icons';

export function ConfirmDialog({
  title,
  confirmLabel,
  isBusy,
  onCancel,
  onConfirm,
}: {
  title: string;
  confirmLabel: string;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-red/15 text-brand-red-dark">
          <XCircleIcon className="h-7 w-7" />
        </span>
        <p className="mt-4 text-base font-medium text-gray-900">{title}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className="flex-1 rounded-md bg-brand-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
