'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCheck, IndianRupee, Search, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PaymentDialog } from '@/components/admin/PaymentDialog';
import { useDebounced, useFetch } from '@/hooks/useApi';
import { apiPatch, toApiError } from '@/lib/api';
import { formatCurrency, formatDate, toQueryString } from '@/lib/utils';
import type { Booking, User, Work } from '@/types';

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const debouncedSearch = useDebounced(search);

  const url = useMemo(
    () =>
      `/bookings${toQueryString({
        page,
        limit: 15,
        status: 'completed',
        paymentStatus,
        search: debouncedSearch,
      })}`,
    [page, paymentStatus, debouncedSearch],
  );

  const { data, meta, loading, error, refetch } = useFetch<{ bookings: Booking[] }>(url);

  const bookings = data?.bookings || [];
  const selectedTotal = bookings
    .filter((booking) => selected.includes(booking._id))
    .reduce((sum, booking) => sum + (booking.payment.amount || 0), 0);

  const toggleAll = () => {
    setSelected((prev) =>
      prev.length === bookings.length ? [] : bookings.map((booking) => booking._id),
    );
  };

  const markSelectedPaid = async () => {
    try {
      const response = await apiPatch('/bookings/payments/bulk', {
        bookingIds: selected,
        status: 'paid',
        method: 'bank_transfer',
        paidAt: new Date().toISOString(),
      });
      toast.success(response.message);
      setSelected([]);
      await refetch();
    } catch (caught) {
      toast.error(toApiError(caught).message);
      throw caught;
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Payments</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Record payments for completed work, individually or in bulk.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="payment-search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="payment-search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Staff name or work…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-status-filter">Payment status</Label>
            <Select
              value={paymentStatus}
              onValueChange={(value) => {
                setPaymentStatus(value);
                setSelected([]);
                setPage(1);
              }}
            >
              <SelectTrigger id="payment-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              <span className="font-semibold">{selected.length}</span> selected ·{' '}
              <span className="font-semibold">{formatCurrency(selectedTotal)}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected([])}>
                Clear
              </Button>
              <Button size="sm" onClick={() => setBulkOpen(true)}>
                <CheckCheck />
                Mark as paid
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error ? (
        <ErrorState description={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !bookings.length ? (
        <EmptyState
          icon={Wallet}
          title="No payments to show"
          description={
            paymentStatus === 'pending'
              ? 'Every completed work has been paid. Nothing outstanding.'
              : 'Adjust your filters to see other payments.'
          }
        />
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
              <Checkbox
                checked={selected.length === bookings.length && bookings.length > 0}
                onCheckedChange={toggleAll}
                aria-label="Select all payments on this page"
              />
              <span className="text-xs font-medium text-muted-foreground">
                Select all on this page
              </span>
            </div>

            <ul className="divide-y divide-border">
              {bookings.map((booking) => {
                const staff = booking.staff as User;
                const work = booking.work as Work;
                const isSelected = selected.includes(booking._id);

                return (
                  <li
                    key={booking._id}
                    className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() =>
                        setSelected((prev) =>
                          prev.includes(booking._id)
                            ? prev.filter((id) => id !== booking._id)
                            : [...prev, booking._id],
                        )
                      }
                      aria-label={`Select payment for ${staff?.fullName}`}
                    />

                    <Link
                      href={`/admin/staff/${staff?._id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <UserAvatar user={staff} className="h-9 w-9 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{staff?.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{staff?.phone}</p>
                      </div>
                    </Link>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{work?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(work?.eventDate)}
                        {booking.payment.paidAt && ` · paid ${formatDate(booking.payment.paidAt)}`}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge kind="payment" status={booking.payment.status} />
                      <span className="w-24 text-right text-sm font-semibold">
                        {formatCurrency(booking.payment.amount)}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => setEditing(booking)}>
                        <IndianRupee />
                        Record
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Pagination meta={meta ?? undefined} onPageChange={setPage} className="pt-2" />
        </>
      )}

      {editing && (
        <PaymentDialog
          booking={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          onUpdated={refetch}
        />
      )}

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Mark ${selected.length} payment${selected.length === 1 ? '' : 's'} as paid?`}
        description={`A total of ${formatCurrency(selectedTotal)} will be recorded as paid today by bank transfer. Each staff member will be notified.`}
        confirmLabel="Mark as paid"
        onConfirm={markSelectedPaid}
      />
    </div>
  );
}
