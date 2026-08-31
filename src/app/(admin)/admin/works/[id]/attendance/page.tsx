'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Check, Clock, QrCode, UserX, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { QrCodeDialog } from '@/components/admin/QrCodeDialog';
import { useFetch } from '@/hooks/useApi';
import { apiPatch, toApiError } from '@/lib/api';
import { formatClockTime, formatDate, formatDateTime } from '@/lib/utils';
import type { AttendanceOverview, Booking, User, Work } from '@/types';

export default function WorkAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, loading, error, refetch } = useFetch<AttendanceOverview>(
    `/works/${id}/attendance`,
  );
  const { data: workData } = useFetch<{ work: Work }>(`/works/${id}`);

  const [qrOpen, setQrOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const markAttendance = async (booking: Booking, status: 'present' | 'late' | 'absent') => {
    setBusyId(booking._id);
    try {
      const response = await apiPatch(`/bookings/${booking._id}/attendance`, { status });
      toast.success(response.message);
      await refetch();
    } catch (caught) {
      toast.error(toApiError(caught).message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/works/${id}`}>
            <ArrowLeft />
            Back to work
          </Link>
        </Button>
        <ErrorState description={error?.message} onRetry={refetch} />
      </div>
    );
  }

  const renderRow = (booking: Booking, showActions = true) => {
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
          <UserAvatar user={staff} className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{staff?.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{staff?.phone}</p>
            {booking.attendance?.checkInAt && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Checked in {formatDateTime(booking.attendance.checkInAt, 'h:mm a')}
                {booking.attendance.minutesLate > 0 && (
                  <span className="ml-1 font-medium text-amber-600 dark:text-amber-400">
                    · {booking.attendance.minutesLate} min late
                  </span>
                )}
              </p>
            )}
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge kind="attendance" status={booking.attendance?.status} />

          {showActions && (
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => markAttendance(booking, 'present')}
                title="Mark present"
              >
                <Check />
                <span className="hidden sm:inline">Present</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => markAttendance(booking, 'late')}
                title="Mark late"
              >
                <Clock />
                <span className="hidden sm:inline">Late</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => markAttendance(booking, 'absent')}
                title="Mark absent"
                className="text-destructive hover:text-destructive"
              >
                <X />
                <span className="hidden sm:inline">Absent</span>
              </Button>
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/works/${id}`}>
            <ArrowLeft />
            Back to work
          </Link>
        </Button>
        <Button variant="outline" onClick={() => setQrOpen(true)}>
          <QrCode />
          Show QR code
        </Button>
      </div>

      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Attendance — {data.work.title}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatDate(data.work.eventDate)} · reporting at{' '}
          {formatClockTime(data.work.reportingTime)}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard label="Expected" value={data.summary.expected} tone="default" />
        <StatCard label="Checked in" value={data.summary.checkedIn} icon={Check} tone="success" />
        <StatCard label="On time" value={data.summary.onTime} tone="primary" />
        <StatCard label="Late" value={data.summary.late} icon={Clock} tone="warning" />
        <StatCard label="Missing" value={data.summary.missing} icon={UserX} tone="danger" />
      </div>

      {/* Checked in */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Checked in ({data.checkedIn.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.checkedIn.length === 0 ? (
            <EmptyState
              icon={QrCode}
              title="Nobody has checked in yet"
              description="Display the event QR code at the venue so staff can scan it on arrival."
              action={
                <Button onClick={() => setQrOpen(true)}>
                  <QrCode />
                  Show QR code
                </Button>
              }
              className="border-0"
            />
          ) : (
            <ul className="space-y-2.5">
              {data.checkedIn.map((booking) => renderRow(booking, false))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Not yet arrived */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Not yet arrived ({data.missing.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.missing.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Everyone confirmed has checked in.
            </p>
          ) : (
            <ul className="space-y-2.5">{data.missing.map((booking) => renderRow(booking))}</ul>
          )}
        </CardContent>
      </Card>

      {/* No-shows */}
      {data.noShow.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No-shows ({data.noShow.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {data.noShow.map((booking) => renderRow(booking, false))}
            </ul>
          </CardContent>
        </Card>
      )}

      {workData?.work && (
        <QrCodeDialog work={workData.work} open={qrOpen} onOpenChange={setQrOpen} />
      )}
    </div>
  );
}
