'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { AuthSplitLayout } from '@/components/auth-split-layout';
import { FormField } from '@/components/form-field';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import type { Role } from '@/lib/api';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const roleParam = searchParams.get('role');
  const role: Role = roleParam === 'admin' ? 'ADMIN' : 'USER';
  const loginHref = roleParam ? `/login?role=${roleParam}` : '/login';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { accessToken, user } = await api.register({ name, email, password, role });
      login(accessToken, user);
      toast.success(`Account created — welcome, ${user.name}!`);
      router.push(user.role === 'ADMIN' ? '/admin' : '/user');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          const fieldErrors: Record<string, string> = {};
          for (const message of err.details.length ? err.details : [err.message]) {
            const lower = message.toLowerCase();
            if (lower.includes('name')) fieldErrors.name = message;
            else if (lower.includes('email')) fieldErrors.email = message;
            else if (lower.includes('password')) fieldErrors.password = message;
            else fieldErrors.form = message;
          }
          setErrors(fieldErrors);
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      quote='"Powering the tools that power the team."'
      blurb="Create an account to start discovering and reserving free concert tickets in just a few clicks."
    >
      <h1 className="text-center text-2xl font-bold text-gray-900">Sign Up</h1>
      {role === 'ADMIN' ? (
        <p className="mt-2 text-center text-xs font-medium uppercase tracking-wide text-brand-blue">
          Administrator account
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <FormField
          label="Full name"
          name="name"
          type="text"
          placeholder="Enter your Full Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your Email Address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          placeholder="Create a Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <FormField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter your Password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Create an account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href={loginHref} className="font-medium text-brand-blue hover:underline">
          Login
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
