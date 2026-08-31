'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Phone,
  Timer,
  Users,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LocationLink } from '@/components/shared/LocationLink';
import { useFetch } from '@/hooks/useApi';
import { apiPost, apiPatch, toApiError } from '@/lib/api';
import { formatClockTime, formatCurrency, formatDate } from '@/lib/utils';
import type { Work } from '@/types';

export default function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, loading, error, refetch } = useFetch<{ work: Work }>(`/works/${id}`);
  const [applying, setApplying] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const work = data?.work;

  const apply = async () => {
    setApplying(true);
    try {
      await apiPost('/bookings', { workId: id });
      toast.success('Application submitted. You will be notified once it is reviewed.');
      await refetch();
    } catch (caught) {
      const apiError = toApiError(caught);
      toast.error(apiError.message, {
        description:
          apiError.status === 409 && apiError.errors
            ? 'Cancel the clashing booking first if you would rather take this job.'
            : undefined,
      });
    } finally {
      setApplying(false);
    }
  };

  const cancelApplication = async () => {
    if (!work?.myBooking) return;
    try {
      await apiPatch(`/bookings/${work.myBooking.id}/cancel`, {
        reason: 'Cancelled from work details',
      });
      toast.success('Your application has been cancelled');
      await refetch();
    } catch (caught) {
      toast.error(toApiError(caught).message);
      throw caught;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft />
          Back
        </Button>
        <ErrorState
          title="Work not found"
          description={error?.message || 'This work may have been removed or is not available to you.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const slots = Math.max(work.requiredStaff - work.bookedStaff, 0);
  const fillPercent = work.requiredStaff
    ? Math.round((work.bookedStaff / work.requiredStaff) * 100)
    : 0;
  const isFull = work.bookedStaff >= work.requiredStaff;
  const isPast = new Date(work.startAt) < new Date();
  const booking = work.myBooking;

  // Which action the footer should offer.
  const canApply =
    !booking &&
    !isFull &&
    !isPast &&
    ['published', 'in_progress'].includes(work.status);
  const canCancel = booking && ['applied', 'approved'].includes(booking.status) && !isPast;

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft />
        Back
      </Button>

      {/* Conflict warning */}
      {work.scheduleConflict && !booking && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-sm dark:border-amber-900 dark:bg-amber-950/50"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-200">
              This clashes with another booking
            </p>
            <p className="mt-0.5 text-amber-800 dark:text-amber-300">
              You are already booked for{' '}
              {work.scheduleConflict.conflicts.map((conflict, index) => (
                <span key={index}>
                  {index > 0 && ', '}
                  <span className="font-medium">{conflict.title}</span> on{' '}
                  {formatDate(conflict.eventDate)}
                </span>
              ))}
              . You will not be able to apply for this one.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{work.eventType}</Badge>
            <StatusBadge kind="work" status={work.status} />
            {booking && <StatusBadge kind="booking" status={booking.status} withDot />}
          </div>

          <h1 className="mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
            {work.title}
          </h1>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <dl className="space-y-3 text-sm">
              <div className="flex gap-2.5">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">Event date</dt>
                  <dd className="font-medium">{formatDate(work.eventDate, 'EEEE, dd MMMM yyyy')}</dd>
                </div>
              </div>
              <div className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">Reporting time</dt>
                  <dd className="font-medium">{formatClockTime(work.reportingTime)}</dd>
                </div>
              </div>
              <div className="flex gap-2.5">
                <Timer className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">Duration</dt>
                  <dd className="font-medium">{work.durationHours} hours</dd>
                </div>
              </div>
            </dl>

            <dl className="space-y-3 text-sm">
              <div className="flex gap-2.5">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">Venue</dt>
                  <dd className="font-medium">{work.location.venue}</dd>
                </div>
              </div>
              {(work.location.address || work.location.city) && (
                <div className="flex gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Address</dt>
                    <dd className="font-medium">
                      {/* Tapping the address opens the venue in Google Maps.
                          Directions are offered once the booking is confirmed. */}
                      <LocationLink
                        location={work.location}
                        showDirections={booking?.status === 'approved' || booking?.status === 'checked_in'}
                      />
                    </dd>
                  </div>
                </div>
              )}
              <div className="flex gap-2.5">
                <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">Payment</dt>
                  <dd className="font-medium">
                    {formatCurrency(work.payment.amount)}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      {work.payment.basis === 'per_hour' ? 'per hour' : 'per shift'}
                    </span>
                  </dd>
                  {work.payment.note && (
                    <dd className="mt-0.5 text-xs text-muted-foreground">{work.payment.note}</dd>
                  )}
                </div>
              </div>
            </dl>
          </div>

          <Separator className="my-5" />

          {/* Staffing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                Staffing
              </span>
              <span className="text-muted-foreground">
                {work.bookedStaff} of {work.requiredStaff} filled
                {!isFull && (
                  <span className="ml-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    · {slots} slot{slots === 1 ? '' : 's'} left
                  </span>
                )}
              </span>
            </div>
            <Progress
              value={fillPercent}
              indicatorClassName={isFull ? 'bg-amber-500' : 'bg-emerald-500'}
            />
            {isFull && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                All positions for this work are filled.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description & skills */}
      {(work.description || work.preferredSkills.length > 0 || work.contactPerson?.phone) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {work.description && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {work.description}
              </p>
            )}

            {work.preferredSkills.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Preferred skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {work.preferredSkills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Contact details only matter once the booking is confirmed. */}
            {work.contactPerson?.phone && booking?.status === 'approved' && (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  On-site contact
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="font-medium">{work.contactPerson.name || 'Event coordinator'}</span>
                  <a href={`tel:${work.contactPerson.phone}`} className="text-primary hover:underline">
                    {work.contactPerson.phone}
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action bar */}
      <Card className="sticky bottom-20 z-30 md:bottom-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            {booking ? (
              <p className="flex items-center gap-2">
                {booking.status === 'approved' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                ) : booking.status === 'applied' ? (
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" aria-hidden />
                )}
                <span className="text-muted-foreground">
                  {booking.status === 'applied' && 'Your application is awaiting review.'}
                  {booking.status === 'approved' && 'You are confirmed for this work.'}
                  {booking.status === 'checked_in' && 'You have checked in for this work.'}
                  {booking.status === 'completed' && 'You completed this work.'}
                  {booking.status === 'rejected' && 'Your application was not accepted.'}
                  {booking.status === 'cancelled' && 'This booking was cancelled.'}
                  {booking.status === 'no_show' && 'You were marked as a no-show.'}
                </span>
              </p>
            ) : isPast ? (
              <p className="text-muted-foreground">This event has already started.</p>
            ) : isFull ? (
              <p className="text-muted-foreground">All positions are filled.</p>
            ) : (
              <p className="text-muted-foreground">
                {slots} position{slots === 1 ? '' : 's'} still open.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {booking && (
              <Button variant="outline" asChild>
                <Link href={`/staff/bookings/${booking.id}`}>View booking</Link>
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                Cancel application
              </Button>
            )}
            {canApply && (
              <Button
                onClick={apply}
                loading={applying}
                disabled={Boolean(work.scheduleConflict)}
                className="min-w-32"
              >
                Apply for this work
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this booking?"
        description="Your slot will be released so another staff member can take it. You can re-apply later if positions are still open."
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep my booking"
        variant="destructive"
        onConfirm={cancelApplication}
      />
    </div>
  );
}
