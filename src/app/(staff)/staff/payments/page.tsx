'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, MapPin, Wallet } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { useFetch } from '@/hooks/useApi';
import { formatCurrency, formatDate, humanise, toQueryString } from '@/lib/utils';
import type { Booking, Work } from '@/types';

interface PaymentsResponse {
  payments: Booking[];
  totals: { paid: number; processing: number; pending: number };
}

export default function StaffPaymentsPage() {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const url = useMemo(
    () => `/bookings/my/payments${toQueryString({ page, limit: 10, paymentStatus: status })}`,
    [page, status],
  );

  const { data, meta, loading, error, refetch } = useFetch<PaymentsResponse>(url);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Payments</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your earnings from completed work.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Paid"
          value={formatCurrency(data?.totals.paid)}
          icon={Wallet}
          tone="success"
          loading={loading}
          hint="Received"
        />
        <StatCard
          label="Processing"
          value={formatCurrency(data?.totals.processing)}
          icon={Clock}
          tone="info"
          loading={loading}
          hint="On the way"
        />
        <StatCard
          label="Pending"
          value={formatCurrency(data?.totals.pending)}
          icon={Clock}
          tone="warning"
          loading={loading}
          hint="Not yet processed"
        />
      </div>

      <div className="flex items-end gap-3">
        <div className="w-full max-w-56 space-y-1.5">
          <Label htmlFor="payment-filter">Filter by status</Label>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger id="payment-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <ErrorState description={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !data?.payments.length ? (
        <EmptyState
          icon={Wallet}
          title="No payments yet"
          description="Once you complete a job, its payment will appear here with its current status."
        />
      ) : (
        <>
          <ul className="space-y-3">
            {data.payments.map((booking) => {
              const work = booking.work as Work;
              return (
                <li key={booking._id}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <Link
                        href={`/staff/bookings/${booking._id}`}
                        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{work?.title}</p>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                                {formatDate(work?.eventDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" aria-hidden />
                                {work?.location?.venue}
                              </span>
                            </div>

                            {booking.payment.paidAt && (
                              <p className="mt-1.5 text-xs text-muted-foreground">
                                Paid on {formatDate(booking.payment.paidAt)} via{' '}
                                {humanise(booking.payment.method)}
                                {booking.payment.reference && ` · ${booking.payment.reference}`}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-base font-semibold">
                              {formatCurrency(booking.payment.amount)}
                            </p>
                            <div className="mt-1.5">
                              <StatusBadge kind="payment" status={booking.payment.status} />
                            </div>
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
