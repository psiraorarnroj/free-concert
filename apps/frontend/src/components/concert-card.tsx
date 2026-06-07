import type { ReactNode } from 'react';
import { PersonIcon } from './icons';

export function ConcertCard({
  name,
  description,
  seatCount,
  action,
}: {
  name: string;
  description: string;
  seatCount: number;
  action: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-brand-cyan">{name}</h3>
      <p className="mt-3 border-t border-gray-100 pt-3 text-sm leading-6 text-gray-600">
        {description}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm text-gray-700">
          <PersonIcon className="h-5 w-5 text-gray-500" />
          {seatCount.toLocaleString()}
        </span>
        {action}
      </div>
    </div>
  );
}
