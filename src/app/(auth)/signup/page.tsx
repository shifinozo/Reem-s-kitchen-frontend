'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  UserPlus,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { staffSignupSchema, type StaffSignupValues } from '@/lib/validations';
import { SKILL_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ApiErrorShape } from '@/lib/api';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Fields validated at each step, so "Next" only advances when they pass. */
const STEP_FIELDS: Record<number, (keyof StaffSignupValues)[]> = {
  1: ['fullName', 'email', 'phone', 'password', 'confirmPassword'],
  2: ['dateOfBirth', 'address', 'city'],
  3: ['skills', 'experienceYears', 'experienceNote', 'availabilityStatus'],
};

const STEPS = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Personal' },
  { id: 3, label: 'Experience' },
];

export default function StaffSignupPage() {
  const router = useRouter();
  const { signupStaff } = useAuthStore();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StaffSignupValues>({
    resolver: zodResolver(staffSignupSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      address: '',
      city: '',
      dateOfBirth: '',
      experienceYears: 0,
      experienceNote: '',
      skills: [],
      availabilityStatus: 'available',
    },
  });

  const selectedSkills = watch('skills') || [];

  const toggleSkill = (skill: string) => {
    const next = selectedSkills.includes(skill)
      ? selectedSkills.filter((item) => item !== skill)
      : [...selectedSkills, skill];
    setValue('skills', next, { shouldValidate: true });
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPhotoError('');
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setPhotoError('Choose a JPG, PNG, WEBP or GIF image');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('Image must be 5 MB or smaller');
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((current) => Math.min(current + 1, 3));
  };

  const onSubmit = async (values: StaffSignupValues) => {
    setFormError('');

    const formData = new FormData();
    formData.append('fullName', values.fullName);
    formData.append('email', values.email);
    formData.append('phone', values.phone);
    formData.append('password', values.password);
    formData.append('address', values.address || '');
    formData.append('city', values.city || '');
    formData.append('dateOfBirth', values.dateOfBirth);
    formData.append('experienceYears', String(values.experienceYears));
    formData.append('experienceNote', values.experienceNote || '');
    formData.append('availabilityStatus', values.availabilityStatus);
    // The server accepts a JSON array or a comma-separated list for skills.
    formData.append('skills', JSON.stringify(values.skills));
    if (photo) formData.append('avatar', photo);

    try {
      await signupStaff(formData);
      setSubmitted(true);
    } catch (error) {
      const apiError = error as ApiErrorShape;

      // Map server-side field errors back onto the form.
      if (apiError.errors) {
        for (const [field, message] of Object.entries(apiError.errors)) {
          setError(field as keyof StaffSignupValues, { message });
        }
        // Jump back to the step holding the first failing field.
        const failing = Object.keys(apiError.errors)[0] as keyof StaffSignupValues;
        const owningStep = Object.entries(STEP_FIELDS).find(([, fields]) =>
          fields.includes(failing),
        )?.[0];
        if (owningStep) setStep(Number(owningStep));
      }

      setFormError(apiError.message);
      toast.error(apiError.message);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" aria-hidden />
            </div>
            <h2 className="mt-5 text-lg font-semibold">Registration submitted</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Your account is awaiting review by an administrator. You&apos;ll be
              notified by email once it&apos;s approved — after that you can log in
              and start applying for work.
            </p>
            <Button className="mt-6" onClick={() => router.push('/login')}>
              Go to login
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="space-y-4">
        <div className="space-y-1.5">
          <CardTitle className="text-xl">Join as catering staff</CardTitle>
          <CardDescription>
            Create your account. An administrator will review it before you can
            browse available work.
          </CardDescription>
        </div>

        {/* Step indicator */}
        <ol className="flex items-center gap-2">
          {STEPS.map((item, index) => (
            <li key={item.id} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    step > item.id && 'bg-primary text-primary-foreground',
                    step === item.id && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    step < item.id && 'bg-muted text-muted-foreground',
                  )}
                >
                  {step > item.id ? <Check className="h-3.5 w-3.5" /> : item.id}
                </span>
                <span
                  className={cn(
                    'hidden text-xs font-medium sm:block',
                    step >= item.id ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <span
                  className={cn(
                    'h-px flex-1 transition-colors',
                    step > item.id ? 'bg-primary' : 'bg-border',
                  )}
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{formError}</span>
            </div>
          )}

          {/* ── Step 1: account ──────────────────────────────── */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="fullName" required>
                  Full name
                </Label>
                <Input
                  id="fullName"
                  placeholder="Arun Kumar"
                  autoComplete="name"
                  error={Boolean(errors.fullName)}
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" required>
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={Boolean(errors.email)}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
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
                    placeholder="9847012345"
                    autoComplete="tel"
                    error={Boolean(errors.phone)}
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              </div>

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
                    Use at least 8 characters with upper and lowercase letters and a number.
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
            </motion.div>
          )}

          {/* ── Step 2: personal ─────────────────────────────── */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Profile photo */}
              <div className="space-y-2">
                <Label htmlFor="avatar">Profile photo</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                    {photoPreview ? (
                      <Image
                        src={photoPreview}
                        alt="Profile preview"
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Camera className="h-6 w-6 text-muted-foreground" aria-hidden />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      id="avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera />
                        {photo ? 'Change photo' : 'Upload photo'}
                      </Button>
                      {photo && (
                        <Button type="button" variant="ghost" size="sm" onClick={clearPhoto}>
                          <X />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Optional. JPG, PNG, WEBP or GIF, up to 5 MB.
                    </p>
                    {photoError && <p className="text-xs text-destructive">{photoError}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" required>
                  Date of birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  error={Boolean(errors.dateOfBirth)}
                  {...register('dateOfBirth')}
                />
                {errors.dateOfBirth && (
                  <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  rows={2}
                  placeholder="House / street, area"
                  error={Boolean(errors.address)}
                  {...register('address')}
                />
                {errors.address && (
                  <p className="text-xs text-destructive">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Kochi"
                  error={Boolean(errors.city)}
                  {...register('city')}
                />
                {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
              </div>
            </motion.div>
          )}

          {/* ── Step 3: experience ───────────────────────────── */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
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
                    defaultValue="available"
                    onValueChange={(value) =>
                      setValue('availabilityStatus', value as StaffSignupValues['availabilityStatus'])
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

              <div className="space-y-2">
                <Label htmlFor="experienceNote">Tell us about your experience</Label>
                <Textarea
                  id="experienceNote"
                  rows={3}
                  placeholder="e.g. 3 years of banquet service at hotels and wedding halls."
                  error={Boolean(errors.experienceNote)}
                  {...register('experienceNote')}
                />
                {errors.experienceNote && (
                  <p className="text-xs text-destructive">{errors.experienceNote.message}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => current - 1)}
                disabled={isSubmitting}
              >
                <ArrowLeft />
                Back
              </Button>
            ) : (
              <span />
            )}

            {step < 3 ? (
              <Button type="button" onClick={goNext}>
                Continue
                <ArrowRight />
              </Button>
            ) : (
              <Button type="submit" loading={isSubmitting}>
                {!isSubmitting && <UserPlus />}
                Create account
              </Button>
            )}
          </div>
        </form>

        <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
          Already registered?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
