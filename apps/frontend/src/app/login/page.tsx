'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { AuthSplitLayout } from '@/components/auth-split-layout';
import { FormField } from '@/components/form-field';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const role = searchParams.get('role');
  const signupHref = role ? `/signup?role=${role}` : '/signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const { accessToken, user } = await api.login({ email, password });
      login(accessToken, user);
      toast.success(`Welcome back, ${user.name}!`);
      router.push(user.role === 'ADMIN' ? '/admin' : '/user');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setErrors({ email: err.message, password: err.message });
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
      quote='"Your digital workspace, simplified."'
      blurb="Sign in to discover free concerts, reserve your seat, and manage your bookings — all in one place."
    >
      <h1 className="text-center text-2xl font-bold text-gray-900">Login</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
          placeholder="Enter your Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&rsquo;t have an account?{' '}
        <Link href={signupHref} className="font-medium text-blue-700 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
