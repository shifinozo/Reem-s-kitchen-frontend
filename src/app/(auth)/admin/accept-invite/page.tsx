'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { apiGet, toApiError, type ApiErrorShape } from '@/lib/api';
import { acceptInviteSchema, type AcceptInviteValues } from '@/lib/validations';

interface InvitePreview {
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
}

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { acceptAdminInvite } = useAuthStore();

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Validate the token before showing the password form.
  useEffect(() => {
    if (!token) {
      setVerifyError('No invitation token was provided.');
      setVerifying(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await apiGet<InvitePreview>(
          `/auth/admin/invites/verify?token=${encodeURIComponent(token)}`,
        );
        if (!cancelled) setInvite(response.data);
      } catch (error) {
        if (!cancelled) setVerifyError(toApiError(error).message);
      } finally {
        if (!cancelled) setVerifying(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (values: AcceptInviteValues) => {
    setFormError('');
    try {
      await acceptAdminInvite(token, values.password, values.confirmPassword);
      toast.success('Your administrator account is ready');
      router.replace('/admin/dashboard');
    } catch (error) {
      const apiError = error as ApiErrorShape;
      setFormError(apiError.message);
      toast.error(apiError.message);
    }
  };

  if (verifying) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">Checking your invitation…</p>
        </CardContent>
      </Card>
    );
  }

  if (verifyError || !invite) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
          </div>
          <h2 className="mt-4 text-base font-semibold">Invitation not valid</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {verifyError || 'This invitation is invalid, expired or has already been used.'}
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-xl">Set your password</CardTitle>
          <CardDescription>
            You&apos;ve been invited to administer Reem&apos;s Kitchen. Choose a
            password to activate your account.
          </CardDescription>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-sm font-medium">{invite.name}</p>
          <p className="text-xs text-muted-foreground">{invite.email}</p>
          <Badge variant="secondary" className="mt-2">
            {invite.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </Badge>
        </div>
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
            <Label htmlFor="password" required>
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="pr-10"
                error={Boolean(errors.password)}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Use upper and lowercase letters plus a number.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" required>
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              error={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Activate my account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
