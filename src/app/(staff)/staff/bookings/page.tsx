'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, CalendarDays, Clock, MapPin, Star } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { useFetch } from '@/hooks/useApi';
import { formatClockTime, formatCurrency, formatDate, toQueryString } from '@/lib/utils';
import { BOOKING_TABS } from '@/lib/constants';
import type { Booking, Work } from '@/types';

export default function MyBookingsPage() {
  const [tab, setTab] = useState<string>(BOOKING_TABS[0].value);
  const [page, setPage] = useState(1);

  const url = useMemo(
    () => `/bookings${toQueryString({ page, limit: 10, status: tab })}`,
    [page, tab],
  );

  const { data, meta, loading, error, refetch } = useFetch<{ bookings: Booking[] }>(url);
  const { data: summary } = useFetch<{
    counts: Record<string, number>;
    upcoming: number;
    earnings: { paid: number; pending: number };
  }>('/bookings/summary');

  const countFor = (value: string) =>
    value
      .split(',')
      .reduce((total, status) => total + (summary?.counts?.[status] ?? 0), 0);

  const onTabChange = (value: string) => {
    setTab(value);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">My bookings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Track every job you have applied for, confirmed or completed.
        </p>
      </div>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList className="w-full">
          {BOOKING_TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
              {summary && countFor(item.value) > 0 && (
                <span className="ml-1 rounded-full bg-muted-foreground/15 px-1.5 text-[11px] font-semibold">
                  {countFor(item.value)}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? (
        <ErrorState description={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : !data?.bookings.length ? (
        <EmptyState
          icon={CalendarCheck}
          title="Nothing here yet"
          description={
            tab === 'applied'
              ? 'You have no pending applications. Browse the available works board to apply.'
              : tab === 'completed'
                ? 'Once you finish a job it will appear here with its rating and payment.'
                : 'No bookings in this category.'
          }
          action={
            <Button asChild>
              <Link href="/staff/works">Browse available work</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {data.bookings.map((booking) => {
              const work = booking.work as Work;
              return (
                <li key={booking._id}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <Link
                        href={`/staff/bookings/${booking._id}`}
                        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <StatusBadge kind="booking" status={booking.status} />
                              {booking.assignedByAdmin && (
                                <span className="text-[11px] text-muted-foreground">
                                  Assigned by admin
                                </span>
                              )}
                            </div>

                            <p className="mt-2 truncate text-sm font-semibold">{work?.title}</p>

                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
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

                            {/* Completed jobs show payment + rating inline. */}
                            {booking.status === 'completed' && (
                              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                <StatusBadge kind="payment" status={booking.payment.status} />
                                {booking.rating?.overall ? (
                                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                    <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                                    {booking.rating.overall} / 5
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Not yet rated</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold text-primary">
                              {formatCurrency(booking.payment.amount)}
                            </p>
                            {booking.attendance?.status !== 'pending' && (
                              <div className="mt-1.5">
                                <StatusBadge kind="attendance" status={booking.attendance.status} />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>

          <Pagination meta={meta ?? undefined} onPageChange={setPage} className="pt-2" />
        </>
      )}
    </div>
  );
}
