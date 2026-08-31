'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Check, MapPin, Save, Search, Send } from 'lucide-react';

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
import { apiPost, apiPatch, toApiError } from '@/lib/api';
import { workSchema, workValuesToPayload, type WorkValues } from '@/lib/validations';
import { EVENT_TYPES, SKILL_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { buildEmbedUrl, parseCoordsFromUrl } from '@/lib/maps';
import type { Work } from '@/types';

interface WorkFormProps {
  /** Omitted when creating. */
  work?: Work;
}

/** Maps an existing work into the flat form shape. */
function toFormValues(work?: Work): WorkValues {
  if (!work) {
    return {
      title: '',
      eventType: '',
      description: '',
      eventDate: '',
      reportingTime: '09:00',
      durationHours: 6,
      venue: '',
      address: '',
      city: '',
      mapUrl: '',
      requiredStaff: 5,
      preferredSkills: [],
      paymentAmount: 1000,
      paymentBasis: 'per_shift',
      paymentNote: '',
      contactName: '',
      contactPhone: '',
      status: 'draft',
    };
  }

  return {
    title: work.title,
    eventType: work.eventType,
    description: work.description || '',
    eventDate: work.eventDate ? work.eventDate.split('T')[0] : '',
    reportingTime: work.reportingTime,
    durationHours: work.durationHours,
    venue: work.location.venue,
    address: work.location.address || '',
    city: work.location.city || '',
    mapUrl: work.location.mapUrl || '',
    requiredStaff: work.requiredStaff,
    preferredSkills: work.preferredSkills || [],
    paymentAmount: work.payment.amount,
    paymentBasis: work.payment.basis,
    paymentNote: work.payment.note || '',
    contactName: work.contactPerson?.name || '',
    contactPhone: work.contactPerson?.phone || '',
    // Editing never silently republishes a draft; the buttons drive this.
    status: work.status === 'draft' ? 'draft' : 'published',
  };
}

export function WorkForm({ work }: WorkFormProps) {
  const router = useRouter();
  const isEditing = Boolean(work);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WorkValues>({
    resolver: zodResolver(workSchema),
    defaultValues: toFormValues(work),
  });

  const selectedSkills = watch('preferredSkills') || [];

  // Watched so the map preview and "Find on Maps" stay in step with typing.
  const mapUrl = watch('mapUrl');
  const venue = watch('venue');
  const address = watch('address');
  const city = watch('city');

  const searchQuery = [venue, address, city].filter(Boolean).join(', ');

  // A pasted link often carries a pin; surface it so the admin sees the
  // location was captured exactly rather than as a name search.
  const detectedCoords = useMemo(() => parseCoordsFromUrl(mapUrl || ''), [mapUrl]);

  const previewUrl = useMemo(
    () =>
      buildEmbedUrl({
        venue,
        address,
        city,
        mapUrl,
        lat: detectedCoords?.lat ?? null,
        lng: detectedCoords?.lng ?? null,
      }),
    [venue, address, city, mapUrl, detectedCoords],
  );

  const toggleSkill = (skill: string) => {
    const next = selectedSkills.includes(skill)
      ? selectedSkills.filter((item) => item !== skill)
      : [...selectedSkills, skill];
    setValue('preferredSkills', next, { shouldDirty: true });
  };

  const submit = async (values: WorkValues, publish: boolean) => {
    const payload = { ...workValuesToPayload(values), status: publish ? 'published' : 'draft' };

    try {
      if (isEditing) {
        const response = await apiPatch<{ work: Work }>(`/works/${work!._id}`, payload);
        toast.success(response.message);
        router.push(`/admin/works/${work!._id}`);
      } else {
        const response = await apiPost<{ work: Work }>('/works', payload);
        toast.success(response.message);
        router.push(`/admin/works/${response.data.work._id}`);
      }
      router.refresh();
    } catch (caught) {
      const apiError = toApiError(caught);
      toast.error(apiError.message);

      // Surface server-side field errors, mapping nested paths to form fields.
      if (apiError.errors) {
        const fieldMap: Record<string, keyof WorkValues> = {
          'location.venue': 'venue',
          'location.address': 'address',
          'location.city': 'city',
          'location.mapUrl': 'mapUrl',
          'payment.amount': 'paymentAmount',
          'payment.basis': 'paymentBasis',
          'payment.note': 'paymentNote',
        };
        for (const [path, message] of Object.entries(apiError.errors)) {
          const field = fieldMap[path] || (path as keyof WorkValues);
          setError(field, { message });
        }
      }
    }
  };

  return (
    <form className="space-y-5" noValidate>
      {/* Basics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work details</CardTitle>
          <CardDescription>What the job is and what staff should expect.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" required>
              Work title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Wedding Reception — Le Meridien"
              error={Boolean(errors.title)}
              {...register('title')}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventType" required>
              Event type
            </Label>
            <Select
              value={watch('eventType')}
              onValueChange={(value) => setValue('eventType', value, { shouldValidate: true })}
            >
              <SelectTrigger id="eventType" className={errors.eventType ? 'border-destructive' : ''}>
                <SelectValue placeholder="Choose an event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.eventType && (
              <p className="text-xs text-destructive">{errors.eventType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Uniform, duties, meals, transport, anything staff should know before applying."
              error={Boolean(errors.description)}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule</CardTitle>
          <CardDescription>
            Used to detect clashes, so staff cannot double-book themselves.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="eventDate" required>
              Event date
            </Label>
            <Input
              id="eventDate"
              type="date"
              error={Boolean(errors.eventDate)}
              {...register('eventDate')}
            />
            {errors.eventDate && (
              <p className="text-xs text-destructive">{errors.eventDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportingTime" required>
              Reporting time
            </Label>
            <Input
              id="reportingTime"
              type="time"
              error={Boolean(errors.reportingTime)}
              {...register('reportingTime')}
            />
            {errors.reportingTime && (
              <p className="text-xs text-destructive">{errors.reportingTime.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationHours" required>
              Duration (hours)
            </Label>
            <Input
              id="durationHours"
              type="number"
              min={1}
              max={24}
              step={0.5}
              error={Boolean(errors.durationHours)}
              {...register('durationHours')}
            />
            {errors.durationHours && (
              <p className="text-xs text-destructive">{errors.durationHours.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location</CardTitle>
          <CardDescription>
            Staff tap the address to open Google Maps, so make it precise.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="venue" required>
              Venue
            </Label>
            <Input
              id="venue"
              placeholder="e.g. Crowne Plaza Banquet Hall"
              error={Boolean(errors.venue)}
              {...register('venue')}
            />
            {errors.venue && <p className="text-xs text-destructive">{errors.venue.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Full address</Label>
            <Input
              id="address"
              placeholder="Street, area, landmark"
              error={Boolean(errors.address)}
              {...register('address')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Kochi" error={Boolean(errors.city)} {...register('city')} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="mapUrl">Google Maps link</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="mapUrl"
                type="url"
                placeholder="https://maps.app.goo.gl/… or https://www.google.com/maps/…"
                className="flex-1"
                error={Boolean(errors.mapUrl)}
                {...register('mapUrl')}
              />
              {/* Pre-fills a Maps search from what has been typed so far, so
                  the admin can grab the exact link without leaving the form. */}
              <Button
                type="button"
                variant="outline"
                disabled={!searchQuery}
                onClick={() => {
                  if (!searchQuery) return;
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`,
                    '_blank',
                    'noopener,noreferrer',
                  );
                }}
              >
                <Search />
                Find on Maps
              </Button>
            </div>

            {errors.mapUrl ? (
              <p className="text-xs text-destructive">{errors.mapUrl.message}</p>
            ) : detectedCoords ? (
              <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                Exact pin detected — {detectedCoords.lat.toFixed(5)},{' '}
                {detectedCoords.lng.toFixed(5)}
              </p>
            ) : mapUrl ? (
              <p className="text-xs text-muted-foreground">
                Link saved. It has no coordinates, so staff will land on a
                search for the venue name.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Optional. Without a link, staff still get a Maps search for
                &ldquo;{searchQuery || 'the venue'}&rdquo;.
              </p>
            )}
          </div>

          {/* Live preview of exactly what staff will see. */}
          {previewUrl && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Preview</Label>
              <div className="overflow-hidden rounded-lg border border-border">
                <iframe
                  key={previewUrl}
                  src={previewUrl}
                  title="Map preview of the venue"
                  className="h-56 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This is the location staff will open from the work details.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staffing & pay */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staffing &amp; payment</CardTitle>
          <CardDescription>
            The work is marked fully booked automatically once the required
            number of staff is confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="requiredStaff" required>
                Staff required
              </Label>
              <Input
                id="requiredStaff"
                type="number"
                min={1}
                max={500}
                error={Boolean(errors.requiredStaff)}
                {...register('requiredStaff')}
              />
              {errors.requiredStaff && (
                <p className="text-xs text-destructive">{errors.requiredStaff.message}</p>
              )}
              {isEditing && work && work.bookedStaff > 0 && (
                <p className="text-xs text-muted-foreground">
                  {work.bookedStaff} already confirmed — cannot go below this.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentAmount" required>
                Payment amount (₹)
              </Label>
              <Input
                id="paymentAmount"
                type="number"
                min={0}
                error={Boolean(errors.paymentAmount)}
                {...register('paymentAmount')}
              />
              {errors.paymentAmount && (
                <p className="text-xs text-destructive">{errors.paymentAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentBasis" required>
                Payment basis
              </Label>
              <Select
                value={watch('paymentBasis')}
                onValueChange={(value) =>
                  setValue('paymentBasis', value as WorkValues['paymentBasis'])
                }
              >
                <SelectTrigger id="paymentBasis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_shift">Per shift</SelectItem>
                  <SelectItem value="per_hour">Per hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentNote">Payment note</Label>
            <Input
              id="paymentNote"
              placeholder="e.g. Paid within 7 days of the event"
              {...register('paymentNote')}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Preferred skills</legend>
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
          </fieldset>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">On-site contact</CardTitle>
          <CardDescription>
            Shared with staff only once their booking is confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact name</Label>
            <Input id="contactName" {...register('contactName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input id="contactPhone" type="tel" {...register('contactPhone')} />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="sticky bottom-4 z-30">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Drafts stay hidden from staff. Publishing notifies every approved,
            available staff member.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={isSubmitting}
              onClick={handleSubmit((values) => submit(values, false))}
            >
              <Save />
              Save as draft
            </Button>
            <Button
              type="button"
              loading={isSubmitting}
              onClick={handleSubmit((values) => submit(values, true))}
            >
              <Send />
              {isEditing ? 'Save & publish' : 'Publish now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
