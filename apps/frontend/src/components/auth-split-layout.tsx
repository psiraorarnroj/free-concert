import type { ReactNode } from 'react';
import { BrandLogo } from './brand-logo';

export function AuthSplitLayout({
  quote,
  blurb,
  children,
}: {
  quote: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white sm:flex-row">
      <div className="flex flex-col justify-between bg-blue-700 px-8 py-10 text-white sm:w-1/2 sm:px-12 sm:py-16">
        <BrandLogo light />
        <div>
          <h2 className="text-2xl font-bold leading-snug sm:text-3xl">{quote}</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-blue-50">{blurb}</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:w-1/2 sm:px-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
