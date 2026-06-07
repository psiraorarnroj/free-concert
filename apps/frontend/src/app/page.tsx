import Image from 'next/image';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

const ACCESS_LEVELS = [
  {
    role: 'User',
    description:
      'Discover free concerts, reserve your seat, and keep track of your reservation history.',
    cta: 'Enter Workspace',
    href: '/login?role=user',
    variant: 'light' as const,
    icon: '/user-icon.png',
  },
  {
    role: 'Administrator',
    description:
      'Create and manage concert listings, and review the full reservation audit trail.',
    cta: 'Enter Portal',
    href: '/login?role=admin',
    variant: 'dark' as const,
    icon: '/admin-icon.png',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white">
      <header className="border-b border-gray-200 px-6 py-4 sm:px-10">
        <BrandLogo />
      </header>

      <main className="flex flex-1 flex-col items-center bg-gray-50 px-6 py-16 sm:px-10">
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Select Access Level
          </h1>
          <p className="mt-3 text-base text-gray-600">
            Choose how you would like to enter Free Concert Tickets.
          </p>
        </div>

        <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          {ACCESS_LEVELS.map((level) => {
            const isDark = level.variant === 'dark';
            return (
              <div
                key={level.role}
                className={`flex flex-col justify-between rounded-xl border p-6 shadow-sm sm:p-8 ${
                  isDark ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-200 bg-white text-gray-900'
                }`}
              >
                <div>
                  <Image src={level.icon} alt="" width={56} height={56} className="h-14 w-14" />
                  <h2 className={`mt-5 text-xl font-semibold ${isDark ? 'text-white' : 'text-brand-blue'}`}>
                    {level.role}
                  </h2>
                  <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-brand-active' : 'text-gray-600'}`}>
                    {level.description}
                  </p>
                </div>
                <Link
                  href={level.href}
                  className={`mt-8 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors ${
                    isDark
                      ? 'bg-white text-brand-blue hover:bg-brand-active'
                      : 'bg-brand-blue text-white hover:bg-brand-blue-dark'
                  }`}
                >
                  {level.cta} <span aria-hidden className="ml-2">→</span>
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
