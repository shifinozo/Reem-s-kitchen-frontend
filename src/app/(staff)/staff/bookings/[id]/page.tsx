'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock,
  IndianRupee,
  Phone,
  QrCode,
  Star,
  Timer,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LocationLink } from '@/components/shared/LocationLink';
import { useFetch } from '@/hooks/useApi';
import { apiPatch, toApiError } from '@/lib/api';
import {
  cn,
  formatClockTime,
  formatCurrency,
  formatDate,
  formatDateTime,
  humanise,
} from '@/lib/utils';
import type { Booking, Work } from '@/types';

const RATING_CRITERIA = [
  { key: 'attendance', label: 'Attendance' },
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'performance', label: 'Performance' },
  { key: 'behaviour', label: 'Behaviour' },
] as const;

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data, loading, error, refetch } = useFetch<{ booking: Booking }>(`/bookings/${id}`);
  const booking = data?.booking;
  const work = booking?.work as Work | undefined;

  const cancelBooking = async (reason?: string) => {
    try {
      await apiPatch(`/bookings/${id}/cancel`, { reason: reason || '' });
      toast.success('Your booking has been cancelled');
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
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !booking || !work) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft />
          Back
        </Button>
        <ErrorState title="Booking not found" description={error?.message} onRetry={refetch} />
      </div>
    );
  }

  const canCancel =
    ['applied', 'approved'].includes(booking.status) && new Date(booking.startAt) > new Date();
  const canCheckIn = booking.status === 'approved';

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft />
        Back
      </Button>

      {/* Summary */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge kind="booking" status={booking.status} />
            <Badge variant="secondary">{work.eventType}</Badge>
            {booking.assignedByAdmin && <Badge variant="outline">Assigned by admin</Badge>}
          </div>

          <h1 className="mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
            {work.title}
          </h1>

          {booking.statusNote && (
            <p className="mt-2 rounded-lg bg-muted/60 p-2.5 text-sm text-muted-foreground">
              {booking.statusNote}
            </p>
          )}

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
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Venue</dt>
                  <dd className="font-medium">
                    {/* Tap to open in Google Maps; confirmed staff also get
                        turn-by-turn directions to the venue. */}
                    <LocationLink
                      location={work.location}
                      showVenue
                      showDirections={['approved', 'checked_in'].includes(booking.status)}
                    />
                  </dd>
                </div>
              </div>
              <div className="flex gap-2.5">
                <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">Payment</dt>
                  <dd className="flex items-center gap-2 font-medium">
                    {formatCurrency(booking.payment.amount)}
                    <StatusBadge kind="payment" status={booking.payment.status} />
                  </dd>
                  {booking.payment.paidAt && (
                    <dd className="mt-0.5 text-xs text-muted-foreground">
                      Paid on {formatDate(booking.payment.paidAt)} via{' '}
                      {humanise(booking.payment.method)}
                    </dd>
                  )}
                </div>
              </div>

              {/* Venue contact is only useful once confirmed. */}
              {work.contactPerson?.phone && ['approved', 'checked_in'].includes(booking.status) && (
                <div className="flex gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div>
                    <dt className="text-xs text-muted-foreground">On-site contact</dt>
                    <dd className="font-medium">
                      <a href={`tel:${work.contactPerson.phone}`} className="text-primary hover:underline">
                        {work.contactPerson.phone}
                      </a>
                      {work.contactPerson.name && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          ({work.contactPerson.name})
                        </span>
                      )}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {(canCheckIn || canCancel) && (
            <>
              <Separator className="my-5" />
              <div className="flex flex-wrap gap-2">
                {canCheckIn && (
                  <Button asChild>
                    <Link href="/staff/scan">
                      <QrCode />
                      Scan to check in
                    </Link>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link href={`/staff/works/${work._id}`}>View work details</Link>
                </Button>
                {canCancel && (
                  <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                    Cancel booking
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Attendance */}
      {booking.attendance?.status !== 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="mt-1">
                <StatusBadge kind="attendance" status={booking.attendance.status} />
              </div>
            </div>
            {booking.attendance.checkInAt && (
              <div>
                <p className="text-xs text-muted-foreground">Checked in</p>
                <p className="mt-1 font-medium">{formatDateTime(booking.attendance.checkInAt)}</p>
              </div>
            )}
            {booking.attendance.minutesLate > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Late by</p>
                <p className="mt-1 font-medium text-amber-600 dark:text-amber-400">
                  {booking.attendance.minutesLate} minutes
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Method</p>
              <p className="mt-1 font-medium">
                {booking.attendance.method === 'qr' ? 'QR scan' : 'Marked by admin'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating */}
      {booking.rating?.overall && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your rating for this work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-semibold tracking-tight">
                {booking.rating.overall}
              </span>
              <div>
                <div className="flex gap-0.5" role="img" aria-label={`${booking.rating.overall} out of 5`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        'h-4 w-4',
                        index < Math.round(booking.rating!.overall)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30',
                      )}
                      aria-hidden
                    />
                  ))}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">out of 5</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RATING_CRITERIA.map((criterion) => (
                <div key={criterion.key} className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{criterion.label}</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {booking.rating?.[criterion.key] ?? '—'}
                    <span className="ml-0.5 text-xs font-normal text-muted-foreground">/ 5</span>
                  </dd>
                </div>
              ))}
            </dl>

            {booking.rating.feedback && (
              <blockquote className="rounded-lg border-l-2 border-primary bg-muted/50 p-3 text-sm italic text-muted-foreground">
                “{booking.rating.feedback}”
              </blockquote>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {booking.history?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {booking.history.map((entry, index) => (
                <li key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                    {index < booking.history.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
                    )}
                  </div>
                  <div className="-mt-1 flex-1 pb-1">
                    <p className="text-sm font-medium">
                      {entry.from ? `${humanise(entry.from)} → ` : ''}
                      {humanise(entry.to)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</p>
                    {entry.note && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{entry.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this booking?"
        description="Your slot will be released so another staff member can take it."
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep my booking"
        variant="destructive"
        reason={{ label: 'Reason (optional)', placeholder: 'Let the admin know why' }}
        onConfirm={cancelBooking}
      />
    </div>
  );
}
