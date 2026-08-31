'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CalendarCheck, Check, MoreVertical, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useDebounced, useFetch } from '@/hooks/useApi';
import { apiPatch, toApiError } from '@/lib/api';
import { formatClockTime, formatCurrency, formatDate, toQueryString } from '@/lib/utils';
import type { Booking, User, Work } from '@/types';

export default function AdminBookingsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('applied');
  const [dateFrom, setDateFrom] = useState('');
  const [page, setPage] = useState(1);

  const [pendingAction, setPendingAction] = useState<{
    booking: Booking;
    status: 'rejected' | 'cancelled';
  } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const debouncedSearch = useDebounced(search);

  const url = useMemo(
    () =>
      `/bookings${toQueryString({
        page,
        limit: 15,
        search: debouncedSearch,
        status,
        dateFrom,
      })}`,
    [page, debouncedSearch, status, dateFrom],
  );

  const { data, meta, loading, error, refetch } = useFetch<{ bookings: Booking[] }>(url);

  const changeStatus = async (booking: Booking, next: string, note?: string) => {
    setBusyId(booking._id);
    try {
      const response = await apiPatch(`/bookings/${booking._id}/status`, { status: next, note });
      toast.success(response.message);
      await refetch();
    } catch (caught) {
      toast.error(toApiError(caught).message);
      throw caught;
    } finally {
      setBusyId(null);
    }
  };

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Bookings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Review applications, confirm staff and manage every booking.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="booking-search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="booking-search"
                value={search}
                onChange={(event) => resetPage(setSearch)(event.target.value)}
                placeholder="Staff name, work or venue…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="booking-status">Status</Label>
            <Select value={status} onValueChange={resetPage(setStatus)}>
              <SelectTrigger id="booking-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applied">Awaiting review</SelectItem>
                <SelectItem value="approved,checked_in">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled,rejected,no_show">Cancelled / rejected</SelectItem>
                <SelectItem value="all">All bookings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="booking-from">Event from</Label>
            <Input
              id="booking-from"
              type="date"
              value={dateFrom}
              onChange={(event) => resetPage(setDateFrom)(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState description={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !data?.bookings.length ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings found"
          description={
            status === 'applied'
              ? 'There are no applications awaiting your review right now.'
              : 'Adjust your filters to see other bookings.'
          }
        />
      ) : (
        <>
          <ul className="space-y-2.5">
            {data.bookings.map((booking) => {
              const staff = booking.staff as User;
              const work = booking.work as Work;
              const busy = busyId === booking._id;

              return (
                <li key={booking._id}>
                  <Card>
                    <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                      <Link
                        href={`/admin/staff/${staff?._id}`}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <UserAvatar user={staff} className="h-10 w-10 shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{staff?.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">{staff?.phone}</p>
                        </div>
                      </Link>

                      <Link
                        href={`/admin/works/${work?._id}`}
                        className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <p className="truncate text-sm font-medium hover:text-primary hover:underline">
                          {work?.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDate(work?.eventDate)} · {formatClockTime(work?.reportingTime)} ·{' '}
                          {work?.location?.venue}
                        </p>
                      </Link>

                      <div className="flex flex-wrap items-center gap-1.5 lg:shrink-0">
                        <StatusBadge kind="booking" status={booking.status} />
                        {booking.status === 'completed' && (
                          <StatusBadge kind="payment" status={booking.payment.status} />
                        )}
                        <span className="text-sm font-semibold">
                          {formatCurrency(booking.payment.amount)}
                        </span>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        {booking.status === 'applied' && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              loading={busy}
                              onClick={() => changeStatus(booking, 'approved').catch(() => null)}
                            >
                              {!busy && <Check />}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => setPendingAction({ booking, status: 'rejected' })}
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
                                onClick={() =>
                                  changeStatus(booking, 'completed').catch(() => null)
                                }
                              >
                                Mark completed
                              </DropdownMenuItem>
                              {booking.status === 'approved' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    changeStatus(booking, 'no_show').catch(() => null)
                                  }
                                >
                                  Mark no-show
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  setPendingAction({ booking, status: 'cancelled' })
                                }
                              >
                                Cancel booking
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        {['completed', 'cancelled', 'rejected', 'no_show'].includes(
                          booking.status,
                        ) && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/works/${work?._id}`}>View work</Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>

          <Pagination meta={meta ?? undefined} onPageChange={setPage} className="pt-2" />
        </>
      )}

      {pendingAction && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setPendingAction(null)}
          title={
            pendingAction.status === 'rejected'
              ? `Reject ${(pendingAction.booking.staff as User)?.fullName}?`
              : `Cancel ${(pendingAction.booking.staff as User)?.fullName}'s booking?`
          }
          description={
            pendingAction.status === 'rejected'
              ? 'They will be notified that their application was not accepted.'
              : 'Their slot will be released and they will be notified.'
          }
          confirmLabel={pendingAction.status === 'rejected' ? 'Reject' : 'Cancel booking'}
          variant="destructive"
          reason={{ label: 'Reason (optional)', placeholder: 'Shared with the staff member' }}
          onConfirm={(reason) =>
            changeStatus(pendingAction.booking, pendingAction.status, reason)
          }
        />
      )}
    </div>
  );
}
