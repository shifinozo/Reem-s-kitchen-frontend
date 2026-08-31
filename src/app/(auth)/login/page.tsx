'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { loginSchema, type LoginValues } from '@/lib/validations';
import { homeRouteForRole } from '@/lib/utils';
import type { ApiErrorShape } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, initialising, bootstrap } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const nextPath = searchParams.get('next');
  const expired = searchParams.get('expired');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Already signed in — skip the form.
  useEffect(() => {
    if (!initialising && user) {
      router.replace(nextPath || homeRouteForRole(user.role));
    }
  }, [user, initialising, router, nextPath]);

  useEffect(() => {
    if (expired) toast.info('Your session expired. Please log in again.');
  }, [expired]);

  const onSubmit = async (values: LoginValues) => {
    setFormError('');
    try {
      const loggedIn = await login(values.email, values.password);
      toast.success(`Welcome back, ${loggedIn.fullName.split(' ')[0]}`);

      // A pending staff member lands on their dashboard, which explains the hold.
      router.replace(nextPath || homeRouteForRole(loggedIn.role));
    } catch (error) {
      const apiError = error as ApiErrorShape;
      setFormError(apiError.message);
    }
  };

  if (initialising) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Log in to your staff or admin account.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" required>
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" required>
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-10"
                error={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting}>
            {!isSubmitting && <LogIn />}
            Log in
          </Button>
        </form>

        <div className="mt-6 space-y-3 border-t border-border pt-5 text-center">
          <p className="text-sm text-muted-foreground">
            New catering staff?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Admin accounts are invitation-only — ask a super admin to invite you.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
