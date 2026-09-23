'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, KeyRound, Loader2, LogOut, Save, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useAuthStore } from '@/store/authStore';
import { apiPatch, toApiError } from '@/lib/api';
import { changePasswordSchema, type ChangePasswordValues } from '@/lib/validations';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';
import type { User } from '@/types';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Admins hold only identity fields — no skills or availability. */
const adminProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(80),
  phone: z
    .string()
    .min(7, 'Phone number is too short')
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, 'Only digits, spaces, +, - and ( ) allowed'),
});
type AdminProfileValues = z.infer<typeof adminProfileSchema>;

export default function AdminProfilePage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminProfileValues>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: { fullName: '', phone: '' },
  });

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!user) return;
    reset({ fullName: user.fullName, phone: user.phone });
  }, [user, reset]);

  const onSave = async (values: AdminProfileValues) => {
    try {
      const response = await apiPatch<{ user: User }>('/auth/me', values);
      setUser(response.data.user);
      toast.success('Profile updated');
      reset(values);
    } catch (caught) {
      toast.error(toApiError(caught).message);
    }
  };

  const onChangePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Choose a JPG, PNG, WEBP or GIF image');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Image must be 5 MB or smaller');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await apiPatch<{ user: User }>('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(response.data.user);
      toast.success('Photo updated');
    } catch (caught) {
      toast.error(toApiError(caught).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onChangePassword = async (values: ChangePasswordValues) => {
    try {
      await apiPatch('/auth/me/password', values);
      toast.success('Password changed. Please log in again.');
      await logout();
      router.replace('/login');
    } catch (caught) {
      const apiError = toApiError(caught);
      toast.error(apiError.message);
      if (apiError.errors) {
        for (const [field, message] of Object.entries(apiError.errors)) {
          passwordForm.setError(field as keyof ChangePasswordValues, { message });
        }
      }
    }
  };

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">My account</h1>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start">
          <div className="relative">
            <UserAvatar user={user} className="h-20 w-20" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onChangePhoto}
              className="hidden"
              id="admin-avatar"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Change profile photo"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Camera className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold tracking-tight">{user.fullName}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground">{user.phone}</p>

            <Badge variant="secondary" className="mt-2.5">
              <ShieldCheck className="mr-1 h-3 w-3" aria-hidden />
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>

            <p className="mt-3 text-xs text-muted-foreground">
              Account created {formatDate(user.createdAt)}
              {user.lastLoginAt && ` · Last login ${formatDateTime(user.lastLoginAt)}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="security">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="fullName" required>
                    Full name
                  </Label>
                  <Input id="fullName" error={Boolean(errors.fullName)} {...register('fullName')} />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" required>
                    Phone number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    error={Boolean(errors.phone)}
                    {...register('phone')}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" value={user.email} disabled readOnly />
                  <p className="text-xs text-muted-foreground">
                    Your email address cannot be changed here.
                  </p>
                </div>

                <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                  {!isSubmitting && <Save />}
                  Save changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4" aria-hidden />
                Change password
              </CardTitle>
              <CardDescription>
                Changing your password signs you out of every device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit(onChangePassword)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" required>
                    Current password
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    error={Boolean(passwordForm.formState.errors.currentPassword)}
                    {...passwordForm.register('currentPassword')}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" required>
                    New password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    error={Boolean(passwordForm.formState.errors.newPassword)}
                    {...passwordForm.register('newPassword')}
                  />
                  {passwordForm.formState.errors.newPassword ? (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      At least 8 characters with upper and lowercase letters and a number.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" required>
                    Confirm new password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    error={Boolean(passwordForm.formState.errors.confirmPassword)}
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" loading={passwordForm.formState.isSubmitting}>
                  Change password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <p className="text-sm text-muted-foreground">Sign out of this device</p>
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              toast.success('Signed out');
              router.replace('/login');
            }}
          >
            <LogOut />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
