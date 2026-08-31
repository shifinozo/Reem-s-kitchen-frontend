'use client';

import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { useFetch } from '@/hooks/useApi';
import { formatCurrency, formatDate, humanise, timeAgo } from '@/lib/utils';
import { CHART_COLORS, STATUS_CHART_COLORS } from '@/lib/constants';
import type { AdminDashboardData, Booking, User, Work } from '@/types';

const TOOLTIP_STYLE = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 10,
  fontSize: 12,
  color: 'hsl(var(--popover-foreground))',
};

export default function AdminDashboardPage() {
  const { data, loading, error, refetch } = useFetch<AdminDashboardData>('/dashboard/admin');

  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            An overview of staff, works and bookings.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/works/new">
            <BriefcaseBusiness />
            Create work
          </Link>
        </Button>
      </div>

      {/* Pending approvals callout */}
      {!loading && (stats?.pendingApprovals ?? 0) > 0 && (
        <Link
          href="/admin/staff?accountStatus=pending"
          className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-950/60"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900">
            <UserPlus className="h-5 w-5 text-amber-700 dark:text-amber-300" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {stats?.pendingApprovals} staff registration
              {stats?.pendingApprovals === 1 ? '' : 's'} awaiting approval
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
              Review and approve them so they can start applying for work.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
        </Link>
      )}

      {/* Primary stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total staff"
          value={stats?.totalStaff ?? 0}
          icon={Users}
          tone="primary"
          loading={loading}
          hint={`${stats?.activeStaff ?? 0} approved`}
        />
        <StatCard
          label="Active now"
          value={stats?.availableStaff ?? 0}
          icon={UserCheck}
          tone="success"
          loading={loading}
          hint="Marked available"
        />
        <StatCard
          label="Open works"
          value={stats?.availableWorks ?? 0}
          icon={BriefcaseBusiness}
          tone="info"
          loading={loading}
          hint={`${stats?.fullyBookedWorks ?? 0} fully booked`}
        />
        <StatCard
          label="Upcoming events"
          value={stats?.upcomingEvents ?? 0}
          icon={CalendarCheck}
          tone="warning"
          loading={loading}
          hint="Next 5 shown below"
        />
      </div>

      {/* Booking + money stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Confirmed bookings"
          value={stats?.confirmedBookings ?? 0}
          icon={CheckCircle2}
          tone="success"
          loading={loading}
          hint={`${stats?.appliedBookings ?? 0} awaiting review`}
        />
        <StatCard
          label="Completed works"
          value={stats?.completedBookings ?? 0}
          icon={CheckCircle2}
          tone="primary"
          loading={loading}
          hint="All time"
        />
        <StatCard
          label="Cancelled"
          value={(stats?.cancelledBookings ?? 0) + (stats?.noShowBookings ?? 0)}
          icon={XCircle}
          tone="danger"
          loading={loading}
          hint={`${stats?.noShowBookings ?? 0} no-shows`}
        />
        <StatCard
          label="Outstanding pay"
          value={formatCurrency(stats?.pendingAmount)}
          icon={Wallet}
          tone="warning"
          loading={loading}
          hint={`${formatCurrency(stats?.paidAmount)} paid out`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Booking activity</CardTitle>
            <CardDescription>Applications and outcomes over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.charts.bookingTrend || []}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  >
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
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={(value) => humanise(String(value))}
                    />
                    <Bar dataKey="applied" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="completed" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="cancelled" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking status</CardTitle>
            <CardDescription>Distribution over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : !data?.charts.bookingStatus.length ? (
              <EmptyState title="No bookings yet" className="border-0 py-14" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.charts.bookingStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {data.charts.bookingStatus.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_CHART_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, name) => [value, humanise(String(name))]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value) => humanise(String(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming events */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Upcoming events</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/works">
                All works
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
            ) : !data?.upcomingEvents.length ? (
              <EmptyState
                icon={CalendarCheck}
                title="No upcoming events"
                description="Create and publish a work to start taking applications."
                action={
                  <Button asChild>
                    <Link href="/admin/works/new">Create work</Link>
                  </Button>
                }
                className="border-0 py-8"
              />
            ) : (
              <ul className="space-y-3">
                {data.upcomingEvents.map((work: Work) => {
                  const fillPercent = work.requiredStaff
                    ? Math.round((work.bookedStaff / work.requiredStaff) * 100)
                    : 0;
                  const isFull = work.bookedStaff >= work.requiredStaff;

                  return (
                    <li key={work._id}>
                      <Link
                        href={`/admin/works/${work._id}`}
                        className="block rounded-lg border border-border p-3.5 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{work.title}</p>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
                                {formatDate(work.eventDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" aria-hidden />
                                {work.location.venue}
                              </span>
                            </div>
                          </div>
                          <StatusBadge kind="work" status={work.status} />
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {work.bookedStaff} / {work.requiredStaff} staff
                            </span>
                            <span
                              className={
                                isFull
                                  ? 'font-semibold text-amber-600 dark:text-amber-400'
                                  : 'font-semibold text-emerald-600 dark:text-emerald-400'
                              }
                            >
                              {isFull
                                ? 'Fully booked'
                                : `${work.requiredStaff - work.bookedStaff} needed`}
                            </span>
                          </div>
                          <Progress
                            value={fillPercent}
                            indicatorClassName={isFull ? 'bg-amber-500' : 'bg-emerald-500'}
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top staff + activity */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top performers</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-11 w-full rounded-lg" />
                  ))}
                </div>
              ) : !data?.topStaff.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No rated staff yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.topStaff.map((staff: User, index) => (
                    <li key={staff._id}>
                      <Link
                        href={`/admin/staff/${staff._id}`}
                        className="flex items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="w-4 text-xs font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                        <UserAvatar user={staff} className="h-8 w-8" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{staff.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {staff.stats?.completedWorks} works
                          </p>
                        </div>
                        <span className="flex items-center gap-1 text-sm font-semibold">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                          {staff.rating?.average}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-9 w-full rounded" />
                  ))}
                </div>
              ) : !data?.recentActivity.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.recentActivity.map((booking: Booking) => {
                    const staff = booking.staff as User;
                    const work = booking.work as Work;
                    return (
                      <li key={booking._id} className="flex items-start gap-2.5">
                        <UserAvatar user={staff} className="h-7 w-7 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs leading-snug">
                            <span className="font-medium">{staff?.fullName}</span>{' '}
                            <span className="text-muted-foreground">
                              — {humanise(booking.status).toLowerCase()} for
                            </span>{' '}
                            <span className="font-medium">{work?.title}</span>
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" aria-hidden />
                            {timeAgo(booking.updatedAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
