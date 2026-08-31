'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Star,
  Wallet,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ApproveStaffDialog } from '@/components/admin/ApproveStaffDialog';
import { STAFF_POSITIONS } from '@/lib/constants';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useFetch } from '@/hooks/useApi';
import { apiPatch, apiPost, toApiError } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { Booking, StaffPosition, User, Work } from '@/types';

interface StaffProfileResponse {
  staff: User;
  bookings: Booking[];
  attendance: Array<{
    bookingId: string;
    work?: string;
    eventDate?: string;
    status?: string;
    checkInAt?: string;
    minutesLate: number;
  }>;
  counts: Record<string, number>;
  earnings: { paid: number; pending: number };
}

export default function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error, refetch } = useFetch<StaffProfileResponse>(`/staff/${id}`);
  const [action, setAction] = useState<'suspend' | 'reject' | null>(null);
  const [busy, setBusy] = useState(false);

  const [approving, setApproving] = useState(false);

  const staff = data?.staff;

  const setStatus = async (status: string, reason?: string, position?: StaffPosition) => {
    setBusy(true);
    try {
      const response = await apiPatch(`/staff/${id}/status`, {
        accountStatus: status,
        reason,
        position,
      });
      toast.success(response.message);
      await refetch();
    } catch (caught) {
      toast.error(toApiError(caught).message);
      throw caught;
    } finally {
      setBusy(false);
    }
  };

  /** Promote or reassign an already-approved staff member. */
  const setPosition = async (position: StaffPosition) => {
    setBusy(true);
    try {
      const response = await apiPatch(`/staff/${id}/position`, { position });
      toast.success(response.message);
      await refetch();
    } catch (caught) {
      toast.error(toApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  const recalculate = async () => {
    setBusy(true);
    try {
      await apiPost(`/staff/${id}/recalculate`);
      toast.success('Performance recalculated');
      await refetch();
    } catch (caught) {
      toast.error(toApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/staff">
            <ArrowLeft />
            Back to staff
          </Link>
        </Button>
        <ErrorState title="Staff member not found" description={error?.message} onRetry={refetch} />
      </div>
    );
  }

  const upcoming = data.bookings.filter((booking) =>
    ['applied', 'approved', 'checked_in'].includes(booking.status),
  );
  const history = data.bookings.filter((booking) => booking.status === 'completed');
  const closed = data.bookings.filter((booking) =>
    ['cancelled', 'rejected', 'no_show'].includes(booking.status),
  );

  const renderBookingRow = (booking: Booking) => {
    const work = booking.work as Work;
    return (
      <li
        key={booking._id}
        className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/works/${work?._id}`}
            className="truncate text-sm font-medium hover:text-primary hover:underline"
          >
            {work?.title || 'Work removed'}
          </Link>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {formatDate(work?.eventDate)}
            </span>
            {work?.location?.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {work.location.venue}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <StatusBadge kind="booking" status={booking.status} />
          {booking.attendance?.status !== 'pending' && (
            <StatusBadge kind="attendance" status={booking.attendance.status} />
          )}
          {booking.status === 'completed' && (
            <>
              <StatusBadge kind="payment" status={booking.payment.status} />
              <span className="text-sm font-semibold">
                {formatCurrency(booking.payment.amount)}
              </span>
              {booking.rating?.overall && (
                <span className="flex items-center gap-0.5 text-xs font-medium">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                  {booking.rating.overall}
                </span>
              )}
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
          <Link href="/admin/staff">
            <ArrowLeft />
            Back to staff
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={recalculate} disabled={busy}>
            <RefreshCw />
            <span className="hidden sm:inline">Recalculate</span>
          </Button>

          {staff.accountStatus === 'pending' && (
            <>
              <Button
                variant="success"
                size="sm"
                loading={busy}
                onClick={() => setApproving(true)}
              >
                {!busy && <Check />}
                Approve
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAction('reject')}>
                Reject
              </Button>
            </>
          )}

          {staff.accountStatus === 'approved' && (
            <Button variant="destructive" size="sm" onClick={() => setAction('suspend')}>
              <Ban />
              Suspend
            </Button>
          )}

          {['suspended', 'rejected'].includes(staff.accountStatus) && (
            <Button
              variant="success"
              size="sm"
              loading={busy}
              onClick={() => setApproving(true)}
            >
              {!busy && <Check />}
              Reinstate
            </Button>
          )}
        </div>
      </div>

      {/* Identity */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
          <UserAvatar
            user={staff}
            className="h-20 w-20 shrink-0"
            ring={staff.availabilityStatus === 'available' ? 'available' : 'none'}
          />

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">{staff.fullName}</h1>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge kind="account" status={staff.accountStatus} />
              <StatusBadge kind="availability" status={staff.availabilityStatus} />
              {staff.position && <StatusBadge kind="position" status={staff.position} />}
              {staff.experienceYears ? (
                <Badge variant="outline">{staff.experienceYears} yrs experience</Badge>
              ) : null}
            </div>

            {staff.statusReason && (
              <p className="mt-2.5 rounded-lg bg-muted/60 p-2.5 text-sm text-muted-foreground">
                {staff.statusReason}
              </p>
            )}

            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <dt className="sr-only">Email</dt>
                <dd className="truncate">
                  <a href={`mailto:${staff.email}`} className="hover:text-primary hover:underline">
                    {staff.email}
                  </a>
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <dt className="sr-only">Phone</dt>
                <dd>
                  <a href={`tel:${staff.phone}`} className="hover:text-primary hover:underline">
                    {staff.phone}
                  </a>
                </dd>
              </div>
              {(staff.address || staff.city) && (
                <div className="flex items-start gap-2 sm:col-span-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <dt className="sr-only">Address</dt>
                  <dd className="text-muted-foreground">
                    {[staff.address, staff.city].filter(Boolean).join(', ')}
                  </dd>
                </div>
              )}
              {staff.dateOfBirth && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <dt className="sr-only">Date of birth</dt>
                  <dd className="text-muted-foreground">
                    {formatDate(staff.dateOfBirth)}
                    {staff.age ? ` (${staff.age} years)` : ''}
                  </dd>
                </div>
              )}
            </dl>

            {/*
              Position is admin-controlled, so it is editable here rather than
              on the staff member's own profile. Only meaningful once the
              account is approved — the API rejects it otherwise.
            */}
            {staff.accountStatus === 'approved' && (
              <div className="mt-4">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Position
                </p>
                <div className="flex flex-wrap gap-2">
                  {STAFF_POSITIONS.map((option) => {
                    const current = staff.position === option.value;
                    return (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={current ? 'default' : 'outline'}
                        disabled={busy || current}
                        onClick={() => setPosition(option.value)}
                      >
                        {current && <Check />}
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {staff.skills && staff.skills.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {staff.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {staff.experienceNote && (
              <p className="mt-3 text-sm text-muted-foreground">{staff.experienceNote}</p>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              Registered {formatDate(staff.createdAt)}
              {staff.approvedAt && ` · Approved ${formatDate(staff.approvedAt)}`}
              {staff.lastLoginAt && ` · Last seen ${formatDateTime(staff.lastLoginAt)}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Completed"
          value={staff.stats?.completedWorks ?? 0}
          icon={Check}
          tone="success"
          hint="Works finished"
        />
        <StatCard
          label="Rating"
          value={staff.rating?.average ? `${staff.rating.average} / 5` : '—'}
          icon={Star}
          tone="warning"
          hint={`${staff.rating?.count ?? 0} reviews`}
        />
        <StatCard
          label="No-shows"
          value={staff.stats?.noShows ?? 0}
          icon={Ban}
          tone={staff.stats?.noShows ? 'danger' : 'default'}
          hint={`${staff.stats?.cancellations ?? 0} cancellations`}
        />
        <StatCard
          label="Total earned"
          value={formatCurrency(staff.stats?.totalEarnings)}
          icon={Wallet}
          tone="primary"
          hint={`${formatCurrency(data.earnings.pending)} pending`}
        />
      </div>

      {/* Rating breakdown */}
      {(staff.rating?.count ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance breakdown</CardTitle>
            <CardDescription>
              Averaged across {staff.rating?.count} rated {staff.rating?.count === 1 ? 'job' : 'jobs'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ['Attendance', staff.rating?.breakdown.attendance],
                  ['Punctuality', staff.rating?.breakdown.punctuality],
                  ['Performance', staff.rating?.breakdown.performance],
                  ['Behaviour', staff.rating?.breakdown.behaviour],
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

      {/* Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bookings &amp; history</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList className="w-full">
              <TabsTrigger value="upcoming">
                Upcoming
                {upcoming.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted-foreground/15 px-1.5 text-[11px] font-semibold">
                    {upcoming.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">
                History
                {history.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted-foreground/15 px-1.5 text-[11px] font-semibold">
                    {history.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="closed">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {upcoming.length === 0 ? (
                <EmptyState title="No upcoming bookings" className="border-0 py-8" />
              ) : (
                <ul className="space-y-2.5">{upcoming.map(renderBookingRow)}</ul>
              )}
            </TabsContent>

            <TabsContent value="history">
              {history.length === 0 ? (
                <EmptyState title="No completed work yet" className="border-0 py-8" />
              ) : (
                <ul className="space-y-2.5">{history.map(renderBookingRow)}</ul>
              )}
            </TabsContent>

            <TabsContent value="attendance">
              {data.attendance.length === 0 ? (
                <EmptyState title="No attendance records yet" className="border-0 py-8" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr className="text-left">
                        <th scope="col" className="py-2 pr-3 font-medium text-muted-foreground">Work</th>
                        <th scope="col" className="px-3 py-2 font-medium text-muted-foreground">Date</th>
                        <th scope="col" className="px-3 py-2 font-medium text-muted-foreground">Status</th>
                        <th scope="col" className="px-3 py-2 font-medium text-muted-foreground">Checked in</th>
                        <th scope="col" className="py-2 pl-3 font-medium text-muted-foreground">Late by</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.attendance.map((record) => (
                        <tr key={record.bookingId}>
                          <td className="max-w-48 truncate py-2.5 pr-3">{record.work}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {formatDate(record.eventDate)}
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusBadge kind="attendance" status={record.status} />
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {record.checkInAt ? formatDateTime(record.checkInAt, 'h:mm a') : '—'}
                          </td>
                          <td className="py-2.5 pl-3">
                            {record.minutesLate > 0 ? (
                              <span className="font-medium text-amber-600 dark:text-amber-400">
                                {record.minutesLate} min
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="closed">
              {closed.length === 0 ? (
                <EmptyState title="Nothing cancelled or rejected" className="border-0 py-8" />
              ) : (
                <ul className="space-y-2.5">{closed.map(renderBookingRow)}</ul>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {action && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setAction(null)}
          title={action === 'suspend' ? `Suspend ${staff.fullName}?` : `Reject ${staff.fullName}?`}
          description={
            action === 'suspend'
              ? 'They will be signed out and blocked from booking any further work.'
              : 'They will be notified that their registration was not approved.'
          }
          confirmLabel={action === 'suspend' ? 'Suspend account' : 'Reject registration'}
          variant="destructive"
          reason={{
            label: 'Reason',
            placeholder: 'Shared with the staff member',
            required: true,
          }}
          onConfirm={(reason) =>
            setStatus(action === 'suspend' ? 'suspended' : 'rejected', reason)
          }
        />
      )}

      <ApproveStaffDialog
        staff={approving ? staff : null}
        onOpenChange={(open) => !open && setApproving(false)}
        onConfirm={(position) => setStatus('approved', undefined, position)}
      />
    </div>
  );
}
