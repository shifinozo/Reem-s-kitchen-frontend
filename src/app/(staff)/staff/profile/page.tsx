'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Camera, Check, KeyRound, Loader2, LogOut, Save, Star, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useAuthStore } from '@/store/authStore';
import { apiPatch, toApiError } from '@/lib/api';
import {
  profileSchema,
  changePasswordSchema,
  type ProfileValues,
  type ChangePasswordValues,
} from '@/lib/validations';
import { SKILL_OPTIONS } from '@/lib/constants';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { User } from '@/types';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export default function StaffProfilePage() {
  const router = useRouter();
  const { user, setUser, refreshUser, logout } = useAuthStore();

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
      city: '',
      dateOfBirth: '',
      experienceYears: 0,
      experienceNote: '',
      skills: [],
      availabilityStatus: 'available',
    },
  });

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  // Seed the form once the user is loaded.
  useEffect(() => {
    if (!user) return;
    reset({
      fullName: user.fullName,
      phone: user.phone,
      address: user.address || '',
      city: user.city || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      experienceYears: user.experienceYears ?? 0,
      experienceNote: user.experienceNote || '',
      skills: user.skills || [],
      availabilityStatus: user.availabilityStatus || 'available',
    });
  }, [user, reset]);

  const selectedSkills = watch('skills') || [];

  const toggleSkill = (skill: string) => {
    const next = selectedSkills.includes(skill)
      ? selectedSkills.filter((item) => item !== skill)
      : [...selectedSkills, skill];
    setValue('skills', next, { shouldValidate: true, shouldDirty: true });
  };

  const onSaveProfile = async (values: ProfileValues) => {
    try {
      const response = await apiPatch<{ user: User }>('/auth/me', {
        ...values,
        // An empty date string would fail server-side coercion.
        dateOfBirth: values.dateOfBirth || undefined,
      });
      setUser(response.data.user);
      toast.success('Profile updated');
      reset(values);
    } catch (caught) {
      const apiError = toApiError(caught);
      toast.error(apiError.message);
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
      toast.success('Profile photo updated');
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
      // Every session was revoked server-side, so sign out locally too.
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
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">My profile</h1>

      {/* Identity card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start">
          <div className="relative">
            <UserAvatar
              user={user}
              className="h-20 w-20"
              ring={user.availabilityStatus === 'available' ? 'available' : 'none'}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onChangePhoto}
              className="hidden"
              id="avatar-upload"
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

            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              <StatusBadge kind="account" status={user.accountStatus} />
              <StatusBadge kind="availability" status={user.availabilityStatus} />
            </div>
          </div>

          <dl className="grid w-full grid-cols-3 gap-3 sm:w-auto">
            <div className="rounded-lg border border-border p-3 text-center">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Works</dt>
              <dd className="mt-0.5 text-lg font-semibold">{user.stats?.completedWorks ?? 0}</dd>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Rating</dt>
              <dd className="mt-0.5 flex items-center justify-center gap-1 text-lg font-semibold">
                {user.rating?.average ? (
                  <>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                    {user.rating.average}
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Earned</dt>
              <dd className="mt-0.5 text-lg font-semibold">
                {formatCurrency(user.stats?.totalEarnings)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Performance breakdown */}
      {(user.rating?.count ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
              Performance
            </CardTitle>
            <CardDescription>
              Averaged across {user.rating?.count} rated {user.rating?.count === 1 ? 'job' : 'jobs'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ['Attendance', user.rating?.breakdown.attendance],
                  ['Punctuality', user.rating?.breakdown.punctuality],
                  ['Performance', user.rating?.breakdown.performance],
                  ['Behaviour', user.rating?.breakdown.behaviour],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {value || '—'}
                    {value ? (
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">/ 5</span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Edit tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Edit details</TabsTrigger>
          <TabsTrigger value="security">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-5" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
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
                      inputMode="tel"
                      error={Boolean(errors.phone)}
                      {...register('phone')}
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" error={Boolean(errors.city)} {...register('city')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      {...register('dateOfBirth')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" rows={2} {...register('address')} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears" required>
                      Years of experience
                    </Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      min={0}
                      max={60}
                      error={Boolean(errors.experienceYears)}
                      {...register('experienceYears')}
                    />
                    {errors.experienceYears && (
                      <p className="text-xs text-destructive">{errors.experienceYears.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availabilityStatus" required>
                      Availability
                    </Label>
                    <Select
                      value={watch('availabilityStatus')}
                      onValueChange={(value) =>
                        setValue('availabilityStatus', value as ProfileValues['availabilityStatus'], {
                          shouldDirty: true,
                        })
                      }
                    >
                      <SelectTrigger id="availabilityStatus">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available for work</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="unavailable">Not available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">
                    Skills / preferred work type{' '}
                    <span className="text-destructive" aria-hidden>
                      *
                    </span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((skill) => {
                      const active = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          aria-pressed={active}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            active
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                          )}
                        >
                          {active && <Check className="mr-1 inline h-3 w-3" aria-hidden />}
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                  {errors.skills && (
                    <p className="text-xs text-destructive">{errors.skills.message}</p>
                  )}
                </fieldset>

                <div className="space-y-2">
                  <Label htmlFor="experienceNote">About your experience</Label>
                  <Textarea id="experienceNote" rows={3} {...register('experienceNote')} />
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                    {!isSubmitting && <Save />}
                    Save changes
                  </Button>
                  {isDirty && (
                    <p className="text-xs text-muted-foreground">You have unsaved changes</p>
                  )}
                </div>
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
                className="max-w-md space-y-4"
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

      {/* Meta + sign out */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Member since {formatDate(user.createdAt)}
            {user.approvedAt && ` · Approved ${formatDate(user.approvedAt)}`}
          </p>
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
