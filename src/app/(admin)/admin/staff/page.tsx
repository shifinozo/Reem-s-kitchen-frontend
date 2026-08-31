'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Check, Loader2, Search, Star, Users, X } from 'lucide-react';

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
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useDebounced, useFetch } from '@/hooks/useApi';
import { apiPatch, toApiError } from '@/lib/api';
import { formatCurrency, formatDate, toQueryString } from '@/lib/utils';
import { SKILL_OPTIONS } from '@/lib/constants';
import type { User } from '@/types';

function StaffList() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [accountStatus, setAccountStatus] = useState(
    searchParams.get('accountStatus') || 'all',
  );
  const [availability, setAvailability] = useState('all');
  const [skill, setSkill] = useState('all');
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState<User | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const debouncedSearch = useDebounced(search);

  const url = useMemo(
    () =>
      `/staff${toQueryString({
        page,
        limit: 12,
        search: debouncedSearch,
        accountStatus,
        availabilityStatus: availability,
        skill,
        sort: accountStatus === 'pending' ? 'createdAt' : '-createdAt',
      })}`,
    [page, debouncedSearch, accountStatus, availability, skill],
  );

  const { data, meta, loading, error, refetch } = useFetch<{ staff: User[] }>(url);

  const setStatus = async (staff: User, status: string, reason?: string) => {
    setBusyId(staff._id);
    try {
      const response = await apiPatch(`/staff/${staff._id}/status`, {
        accountStatus: status,
        reason,
      });
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
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Staff</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Approve registrations, manage accounts and review performance.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="staff-search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="staff-search"
                value={search}
                onChange={(event) => resetPage(setSearch)(event.target.value)}
                placeholder="Name, email, phone or city…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-status">Account status</Label>
            <Select value={accountStatus} onValueChange={resetPage(setAccountStatus)}>
              <SelectTrigger id="staff-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                <SelectItem value="pending">Pending approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-availability">Availability</Label>
            <Select value={availability} onValueChange={resetPage(setAvailability)}>
              <SelectTrigger id="staff-availability">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-skill">Skill</Label>
            <Select value={skill} onValueChange={resetPage(setSkill)}>
              <SelectTrigger id="staff-skill">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any skill</SelectItem>
                {SKILL_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState description={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : !data?.staff.length ? (
        <EmptyState
          icon={Users}
          title="No staff found"
          description="Adjust your filters, or wait for new registrations to come in."
        />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.staff.map((staff) => {
              const busy = busyId === staff._id;
              return (
                <li key={staff._id}>
                  <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-1 flex-col p-4">
                      <Link
                        href={`/admin/staff/${staff._id}`}
                        className="flex items-start gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <UserAvatar
                          user={staff}
                          className="h-11 w-11"
                          ring={staff.availabilityStatus === 'available' ? 'available' : 'none'}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{staff.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">{staff.phone}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {staff.city || 'No city'}
                          </p>
                        </div>
                        {(staff.rating?.average ?? 0) > 0 && (
                          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                            {staff.rating?.average}
                          </span>
                        )}
                      </Link>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <StatusBadge kind="account" status={staff.accountStatus} />
                        <StatusBadge kind="availability" status={staff.availabilityStatus} />
                      </div>

                      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-muted/50 p-2">
                          <dt className="text-[10px] uppercase text-muted-foreground">Works</dt>
                          <dd className="text-sm font-semibold">
                            {staff.stats?.completedWorks ?? 0}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-2">
                          <dt className="text-[10px] uppercase text-muted-foreground">No-shows</dt>
                          <dd className="text-sm font-semibold">{staff.stats?.noShows ?? 0}</dd>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-2">
                          <dt className="text-[10px] uppercase text-muted-foreground">Earned</dt>
                          <dd className="truncate text-sm font-semibold">
                            {formatCurrency(staff.stats?.totalEarnings)}
                          </dd>
                        </div>
                      </dl>

                      <p className="mt-3 text-[11px] text-muted-foreground">
                        Registered {formatDate(staff.createdAt)}
                      </p>

                      {/* Quick actions */}
                      <div className="mt-3 flex gap-2 border-t border-border pt-3">
                        {staff.accountStatus === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              className="flex-1"
                              loading={busy}
                              onClick={() => setStatus(staff, 'approved').catch(() => null)}
                            >
                              {!busy && <Check />}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              disabled={busy}
                              onClick={() => setRejecting(staff)}
                            >
                              <X />
                              Reject
                            </Button>
                          </>
                        )}

                        {staff.accountStatus === 'approved' && (
                          <>
                            <Button size="sm" variant="outline" className="flex-1" asChild>
                              <Link href={`/admin/staff/${staff._id}`}>View profile</Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => setRejecting({ ...staff, accountStatus: 'approved' })}
                            >
                              Suspend
                            </Button>
                          </>
                        )}

                        {['suspended', 'rejected'].includes(staff.accountStatus) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            loading={busy}
                            onClick={() => setStatus(staff, 'approved').catch(() => null)}
                          >
                            Reinstate
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

      {rejecting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setRejecting(null)}
          title={
            rejecting.accountStatus === 'approved'
              ? `Suspend ${rejecting.fullName}?`
              : `Reject ${rejecting.fullName}?`
          }
          description={
            rejecting.accountStatus === 'approved'
              ? 'They will be signed out and blocked from booking any further work.'
              : 'They will be notified that their registration was not approved.'
          }
          confirmLabel={rejecting.accountStatus === 'approved' ? 'Suspend account' : 'Reject'}
          variant="destructive"
          reason={{
            label: 'Reason',
            placeholder: 'Shared with the staff member',
            required: true,
          }}
          onConfirm={(reason) =>
            setStatus(
              rejecting,
              rejecting.accountStatus === 'approved' ? 'suspended' : 'rejected',
              reason,
            )
          }
        />
      )}
    </div>
  );
}

export default function AdminStaffPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        </div>
      }
    >
      <StaffList />
    </Suspense>
  );
}
