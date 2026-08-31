'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  Star,
  Wallet,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { useFetch } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import { formatClockTime, formatCurrency, formatDate } from '@/lib/utils';
import type { Booking, StaffDashboardData, Work } from '@/types';

export default function StaffDashboardPage() {
  const { user, updateAvailability } = useAuthStore();
  const { data, loading, error, refetch } = useFetch<StaffDashboardData>('/dashboard/staff', {
    // A pending account has no work data to show.
    skip: user?.accountStatus !== 'approved',
  });

  const firstName = user?.fullName?.split(' ')[0] || 'there';

  const toggleAvailability = async (checked: boolean) => {
    try {
      await updateAvailability(checked ? 'available' : 'unavailable');
      toast.success(checked ? 'You are now marked as available' : 'You are now marked as unavailable');
    } catch {
      toast.error('Could not update your availability');
    }
  };

  // ── Account not yet approved ────────────────────────────────
  if (user && user.accountStatus !== 'approved') {
    const isRejected = user.accountStatus === 'rejected';
    const isSuspended = user.accountStatus === 'suspended';

    return (
      <div className="mx-auto max-w-lg py-10">
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div
              className={
                isRejected || isSuspended
                  ? 'flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10'
                  : 'flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950'
              }
            >
              {isRejected || isSuspended ? (
                <AlertCircle className="h-7 w-7 text-destructive" aria-hidden />
              ) : (
                <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" aria-hidden />
              )}
            </div>

            <h1 className="mt-5 text-lg font-semibold">
              {isRejected && 'Registration not approved'}
              {isSuspended && 'Account deactivated'}
              {user.accountStatus === 'pending' && 'Awaiting approval'}
            </h1>

            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {user.statusReason ||
                (user.accountStatus === 'pending'
                  ? 'An administrator is reviewing your registration. You will be notified by email once your account is approved, and work listings will appear here.'
                  : 'Please contact an administrator for more information.')}
            </p>

            <div className="mt-6 flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/staff/profile">View my profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error.message} onRetry={refetch} />;
  }

  const stats = data?.stats;
  const isAvailable = user?.availabilityStatus === 'available';

  return (
    <div className="space-y-6">
      {/* Greeting + availability */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Hello, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {stats?.availableWorks
              ? `${stats.availableWorks} work${stats.availableWorks === 1 ? '' : 's'} open for applications`
              : 'Here is your work at a glance'}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5">
          <Switch
            id="availability"
            checked={isAvailable}
            onCheckedChange={toggleAvailability}
            aria-describedby="availability-hint"
          />
          <div>
            <Label htmlFor="availability" className="cursor-pointer text-sm">
              {isAvailable ? 'Available for work' : 'Not available'}
            </Label>
            <p id="availability-hint" className="text-[11px] text-muted-foreground">
              Admins see this when assigning staff
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Applied"
          value={stats?.applied ?? 0}
          icon={Clock}
          tone="info"
          loading={loading}
          hint="Awaiting approval"
        />
        <StatCard
          label="Confirmed"
          value={(stats?.confirmed ?? 0) + (stats?.checkedIn ?? 0)}
          icon={CalendarCheck}
          tone="success"
          loading={loading}
          hint="Upcoming work"
        />
        <StatCard
          label="Completed"
          value={stats?.completed ?? 0}
          icon={CheckCircle2}
          tone="primary"
          loading={loading}
          hint="All time"
        />
        <StatCard
          label="Rating"
          value={stats?.rating ? `${stats.rating} / 5` : '—'}
          icon={Star}
          tone="warning"
          loading={loading}
          hint={stats?.ratingCount ? `From ${stats.ratingCount} reviews` : 'No ratings yet'}
        />
      </div>

      {/* Earnings */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <StatCard
          label="Paid out"
          value={formatCurrency(data?.earnings.paid)}
          icon={Wallet}
          tone="success"
          loading={loading}
          hint="Received to date"
        />
        <StatCard
          label="Payment pending"
          value={formatCurrency(data?.earnings.pending)}
          icon={Clock}
          tone="warning"
          loading={loading}
          hint="For completed work"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Upcoming work */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Your upcoming work</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/staff/bookings">
                View all
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : !data?.upcoming.length ? (
              <EmptyState
                icon={BriefcaseBusiness}
                title="No confirmed work yet"
                description="Browse the available works board and apply for jobs that suit you."
                action={
                  <Button asChild>
                    <Link href="/staff/works">Browse available work</Link>
                  </Button>
                }
                className="border-0 py-8"
              />
            ) : (
              <ul className="space-y-3">
                {data.upcoming.map((booking: Booking) => {
                  const work = booking.work as Work;
                  return (
                    <li key={booking._id}>
                      <Link
                        href={`/staff/bookings/${booking._id}`}
                        className="block rounded-lg border border-border p-3.5 transition-colors hover:border-primary/40 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{work?.title}</p>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
                                {formatDate(work?.eventDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" aria-hidden />
                                {formatClockTime(work?.reportingTime)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" aria-hidden />
                                {work?.location?.venue}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <StatusBadge kind="booking" status={booking.status} />
                            <p className="mt-1.5 text-sm font-semibold text-primary">
                              {formatCurrency(booking.payment.amount)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Trend + QR shortcut */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Work &amp; earnings</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.trend || []} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0d9488" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#0d9488" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        width={52}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 10,
                          fontSize: 12,
                          color: 'hsl(var(--popover-foreground))',
                        }}
                        formatter={(value) => [formatCurrency(Number(value)), 'Earnings']}
                      />
                      <Area
                        type="monotone"
                        dataKey="earnings"
                        stroke="#0d9488"
                        strokeWidth={2}
                        fill="url(#earningsFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <QrCode className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">At the venue?</p>
                <p className="mt-0.5 text-xs text-primary-foreground/80">
                  Scan the event QR code to mark your attendance.
                </p>
              </div>
              <Button size="sm" variant="secondary" asChild>
                <Link href="/staff/scan">Scan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
