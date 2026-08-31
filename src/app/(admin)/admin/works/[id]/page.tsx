'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock,
  Eye,
  EyeOff,
  IndianRupee,
  MapPin,
  MoreVertical,
  Pencil,
  QrCode,
  Star,
  Timer,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LocationLink } from '@/components/shared/LocationLink';
import { AssignStaffDialog } from '@/components/admin/AssignStaffDialog';
import { QrCodeDialog } from '@/components/admin/QrCodeDialog';
import { RatingDialog } from '@/components/admin/RatingDialog';
import { PaymentDialog } from '@/components/admin/PaymentDialog';
import { useFetch } from '@/hooks/useApi';
import { apiPatch, apiPost, apiDelete, toApiError } from '@/lib/api';
import {
  formatClockTime,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/lib/utils';
import type { Booking, User, Work } from '@/types';

type DialogState =
  | { kind: 'none' }
  | { kind: 'assign' }
  | { kind: 'qr' }
  | { kind: 'cancelWork' }
  | { kind: 'deleteWork' }
  | { kind: 'rate'; booking: Booking }
  | { kind: 'payment'; booking: Booking }
  | { kind: 'rejectBooking'; booking: Booking }
  | { kind: 'cancelBooking'; booking: Booking };

export default function AdminWorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, loading, error, refetch } = useFetch<{ work: Work }>(`/works/${id}`);
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });
  const [busyId, setBusyId] = useState<string | null>(null);

  const work = data?.work;
  const applicants = work?.applicants || [];

  const applied = applicants.filter((booking) => booking.status === 'applied');
  const confirmed = applicants.filter((booking) =>
    ['approved', 'checked_in'].includes(booking.status),
  );
  const completed = applicants.filter((booking) => booking.status === 'completed');
  const closed = applicants.filter((booking) =>
    ['rejected', 'cancelled', 'no_show'].includes(booking.status),
  );

  const changeBookingStatus = async (booking: Booking, status: string, note?: string) => {
    setBusyId(booking._id);
    try {
      const response = await apiPatch(`/bookings/${booking._id}/status`, { status, note });
      toast.success(response.message);
      await refetch();
    } catch (caught) {
      const apiError = toApiError(caught);
      toast.error(apiError.message);
      throw caught;
    } finally {
      setBusyId(null);
    }
  };

  const togglePublish = async () => {
    try {
      const response = await apiPatch(`/works/${id}/publish`);
      toast.success(response.message);
      await refetch();
    } catch (caught) {
      toast.error(toApiError(caught).message);
    }
  };

  const cancelWork = async (reason?: string) => {
    try {
      const response = await apiPost(`/works/${id}/cancel`, { reason });
      toast.success(response.message);
      await refetch();
    } catch (caught) {
      toast.error(toApiError(caught).message);
      throw caught;
    }
  };

  const deleteWork = async () => {
    try {
      await apiDelete(`/works/${id}`);
      toast.success('Work deleted');
      router.push('/admin/works');
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
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/works">
            <ArrowLeft />
            Back to works
          </Link>
        </Button>
        <ErrorState title="Work not found" description={error?.message} onRetry={refetch} />
      </div>
    );
  }

  const isFull = work.bookedStaff >= work.requiredStaff;
  const fillPercent = work.requiredStaff
    ? Math.round((work.bookedStaff / work.requiredStaff) * 100)
    : 0;
  const isClosed = ['cancelled', 'completed'].includes(work.status);

  const renderApplicant = (booking: Booking) => {
    const staff = booking.staff as User;
    const busy = busyId === booking._id;

    return (
      <li
        key={booking._id}
        className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
      >
        <Link
          href={`/admin/staff/${staff?._id}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserAvatar user={staff} className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{staff?.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {staff?.phone}
              {staff?.city && ` · ${staff.city}`}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <StatusBadge kind="booking" status={booking.status} />
              {booking.assignedByAdmin && (
                <Badge variant="outline" className="text-[10px]">
                  Assigned
                </Badge>
              )}
              {booking.attendance?.status !== 'pending' && (
                <StatusBadge kind="attendance" status={booking.attendance.status} />
              )}
              {booking.status === 'completed' && (
                <StatusBadge kind="payment" status={booking.payment.status} />
              )}
              {(staff?.rating?.average ?? 0) > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                  {staff.rating?.average}
                </span>
              )}
            </div>
            {booking.attendance?.checkInAt && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Checked in {formatDateTime(booking.attendance.checkInAt, 'h:mm a')}
                {booking.attendance.minutesLate > 0 &&
                  ` · ${booking.attendance.minutesLate} min late`}
              </p>
            )}
          </div>
        </Link>

        <div className="flex shrink-0 flex-wrap gap-2">
          {booking.status === 'applied' && (
            <>
              <Button
                size="sm"
                variant="success"
                loading={busy}
                onClick={() => changeBookingStatus(booking, 'approved').catch(() => null)}
                disabled={isFull}
                title={isFull ? 'All positions are filled' : undefined}
              >
                <Check />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setDialog({ kind: 'rejectBooking', booking })}
              >
                <X />
                Reject
              </Button>
            </>
          )}

          {['approved', 'checked_in'].includes(booking.status) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={busy}>
                  Actions
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => changeBookingStatus(booking, 'completed').catch(() => null)}
                >
                  <Check />
                  Mark completed
                </DropdownMenuItem>
                {booking.status === 'approved' && (
                  <DropdownMenuItem
                    onClick={() => changeBookingStatus(booking, 'no_show').catch(() => null)}
                  >
                    <Ban />
                    Mark no-show
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDialog({ kind: 'cancelBooking', booking })}
                >
                  <X />
                  Cancel booking
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {booking.status === 'completed' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialog({ kind: 'rate', booking })}
              >
                <Star />
                {booking.rating?.overall ? `Rated ${booking.rating.overall}` : 'Rate'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialog({ kind: 'payment', booking })}
              >
                <IndianRupee />
                Payment
              </Button>
            </>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/works">
            <ArrowLeft />
            Back to works
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setDialog({ kind: 'qr' })}>
            <QrCode />
            <span className="hidden sm:inline">QR code</span>
          </Button>

          <Button variant="outline" asChild>
            <Link href={`/admin/works/${id}/attendance`}>
              <ClipboardCheck />
              <span className="hidden sm:inline">Attendance</span>
            </Link>
          </Button>

          {!isClosed && (
            <Button
              variant="outline"
              onClick={() => setDialog({ kind: 'assign' })}
              disabled={isFull}
              title={isFull ? 'All positions are filled' : undefined}
            >
              <UserPlus />
              <span className="hidden sm:inline">Assign staff</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More actions">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {work.status !== 'completed' && (
                <DropdownMenuItem asChild>
                  <Link href={`/admin/works/${id}/edit`}>
                    <Pencil />
                    Edit work
                  </Link>
                </DropdownMenuItem>
              )}

              {['draft', 'published'].includes(work.status) && (
                <DropdownMenuItem onClick={togglePublish}>
                  {work.status === 'draft' ? <Eye /> : <EyeOff />}
                  {work.status === 'draft' ? 'Publish' : 'Unpublish'}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {!isClosed && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDialog({ kind: 'cancelWork' })}
                >
                  <Ban />
                  Cancel work
                </DropdownMenuItem>
              )}

              {applicants.length === 0 && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDialog({ kind: 'deleteWork' })}
                >
                  <Trash2 />
                  Delete work
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{work.eventType}</Badge>
            <StatusBadge kind="work" status={work.status} />
          </div>

          <h1 className="mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
            {work.title}
          </h1>

          {work.cancellationReason && (
            <p className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-sm text-destructive">
              Cancelled: {work.cancellationReason}
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex gap-2.5">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-xs text-muted-foreground">Event date</p>
                <p className="text-sm font-medium">{formatDate(work.eventDate)}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-xs text-muted-foreground">Reporting</p>
                <p className="text-sm font-medium">{formatClockTime(work.reportingTime)}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <Timer className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">{work.durationHours} hours</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="text-sm font-medium">
                  {formatCurrency(work.payment.amount)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {work.payment.basis === 'per_hour' ? '/hr' : '/shift'}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 sm:col-span-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Location</p>
                {/* Same map link staff see, so an admin can sanity-check it. */}
                <LocationLink location={work.location} showVenue className="text-sm" />
              </div>
            </div>
          </div>

          <Separator className="my-5" />

          {/* Staffing summary */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                Staffing
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{work.bookedStaff}</span> of{' '}
                {work.requiredStaff} confirmed
                {applied.length > 0 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    · {applied.length} awaiting review
                  </span>
                )}
                {!isFull && (
                  <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">
                    · {work.requiredStaff - work.bookedStaff} needed
                  </span>
                )}
              </span>
            </div>
            <Progress
              value={fillPercent}
              indicatorClassName={isFull ? 'bg-amber-500' : 'bg-emerald-500'}
            />
          </div>

          {work.description && (
            <>
              <Separator className="my-5" />
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {work.description}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Applicants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Applicants &amp; assigned staff ({applicants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applicants.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No applications yet"
              description={
                work.status === 'draft'
                  ? 'Publish this work so staff can see and apply for it.'
                  : 'Staff have not applied yet. You can assign people directly.'
              }
              action={
                work.status === 'draft' ? (
                  <Button onClick={togglePublish}>
                    <Eye />
                    Publish work
                  </Button>
                ) : (
                  <Button onClick={() => setDialog({ kind: 'assign' })} disabled={isFull}>
                    <UserPlus />
                    Assign staff
                  </Button>
                )
              }
              className="border-0"
            />
          ) : (
            <Tabs defaultValue={applied.length > 0 ? 'applied' : 'confirmed'}>
              <TabsList className="w-full">
                <TabsTrigger value="applied">
                  Applied
                  {applied.length > 0 && (
                    <span className="ml-1 rounded-full bg-blue-500/15 px-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      {applied.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  Confirmed
                  {confirmed.length > 0 && (
                    <span className="ml-1 rounded-full bg-emerald-500/15 px-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {confirmed.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed
                  {completed.length > 0 && (
                    <span className="ml-1 rounded-full bg-muted-foreground/15 px-1.5 text-[11px] font-semibold">
                      {completed.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>

              <TabsContent value="applied">
                {applied.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No pending applications.
                  </p>
                ) : (
                  <ul className="space-y-2.5">{applied.map(renderApplicant)}</ul>
                )}
              </TabsContent>

              <TabsContent value="confirmed">
                {confirmed.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No confirmed staff yet.
                  </p>
                ) : (
                  <ul className="space-y-2.5">{confirmed.map(renderApplicant)}</ul>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completed.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No completed bookings yet.
                  </p>
                ) : (
                  <ul className="space-y-2.5">{completed.map(renderApplicant)}</ul>
                )}
              </TabsContent>

              <TabsContent value="closed">
                {closed.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nothing rejected or cancelled.
                  </p>
                ) : (
                  <ul className="space-y-2.5">{closed.map(renderApplicant)}</ul>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AssignStaffDialog
        work={work}
        open={dialog.kind === 'assign'}
        onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
        onAssigned={refetch}
      />

      <QrCodeDialog
        work={work}
        open={dialog.kind === 'qr'}
        onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
      />

      {dialog.kind === 'rate' && (
        <RatingDialog
          booking={dialog.booking}
          open
          onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
          onRated={refetch}
        />
      )}

      {dialog.kind === 'payment' && (
        <PaymentDialog
          booking={dialog.booking}
          open
          onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
          onUpdated={refetch}
        />
      )}

      <ConfirmDialog
        open={dialog.kind === 'cancelWork'}
        onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
        title="Cancel this work?"
        description="Every confirmed and pending booking will be cancelled, and the staff involved will be notified."
        confirmLabel="Cancel work"
        cancelLabel="Keep it"
        variant="destructive"
        reason={{
          label: 'Reason for cancelling',
          placeholder: 'Shown to affected staff',
          required: true,
        }}
        onConfirm={cancelWork}
      />

      <ConfirmDialog
        open={dialog.kind === 'deleteWork'}
        onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
        title="Delete this work permanently?"
        description="This cannot be undone. Only works with no bookings can be deleted."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={deleteWork}
      />

      {dialog.kind === 'rejectBooking' && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
          title={`Reject ${(dialog.booking.staff as User)?.fullName}?`}
          description="They will be notified that their application was not accepted."
          confirmLabel="Reject application"
          variant="destructive"
          reason={{ label: 'Reason (optional)', placeholder: 'Shared with the staff member' }}
          onConfirm={(reason) => changeBookingStatus(dialog.booking, 'rejected', reason)}
        />
      )}

      {dialog.kind === 'cancelBooking' && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
          title={`Cancel ${(dialog.booking.staff as User)?.fullName}'s booking?`}
          description="Their slot will be released and they will be notified."
          confirmLabel="Cancel booking"
          variant="destructive"
          reason={{ label: 'Reason (optional)', placeholder: 'Shared with the staff member' }}
          onConfirm={(reason) => changeBookingStatus(dialog.booking, 'cancelled', reason)}
        />
      )}
    </div>
  );
}
