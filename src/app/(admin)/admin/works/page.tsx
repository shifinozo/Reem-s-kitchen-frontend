'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, Plus, Search, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { useDebounced, useFetch } from '@/hooks/useApi';
import { formatClockTime, formatCurrency, formatDate, toQueryString } from '@/lib/utils';
import { EVENT_TYPES } from '@/lib/constants';
import type { Work } from '@/types';

export default function AdminWorksPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounced(search);

  const url = useMemo(
    () =>
      `/works${toQueryString({
        page,
        limit: 10,
        search: debouncedSearch,
        status,
        eventType,
        dateFrom,
        sort: '-eventDate',
      })}`,
    [page, debouncedSearch, status, eventType, dateFrom],
  );

  const { data, meta, loading, error, refetch } = useFetch<{ works: Work[] }>(url);

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Works</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create, publish and manage catering jobs.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/works/new">
            <Plus />
            Create work
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="work-search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="work-search"
                value={search}
                onChange={(event) => resetPage(setSearch)(event.target.value)}
                placeholder="Title, venue or city…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="work-status">Status</Label>
            <Select value={status} onValueChange={resetPage(setStatus)}>
              <SelectTrigger id="work-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Open</SelectItem>
                <SelectItem value="fully_booked">Fully booked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="work-type">Event type</Label>
            <Select value={eventType} onValueChange={resetPage(setEventType)}>
              <SelectTrigger id="work-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="work-from">From date</Label>
            <Input
              id="work-from"
              type="date"
              value={dateFrom}
              onChange={(event) => resetPage(setDateFrom)(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {error ? (
        <ErrorState description={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !data?.works.length ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title="No works found"
          description="Adjust your filters, or create a new work opportunity."
          action={
            <Button asChild>
              <Link href="/admin/works/new">Create work</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr className="text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">Work</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">Date &amp; time</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">Venue</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">Staffing</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">Pay</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.works.map((work) => {
                    const isFull = work.bookedStaff >= work.requiredStaff;
                    const fillPercent = work.requiredStaff
                      ? Math.round((work.bookedStaff / work.requiredStaff) * 100)
                      : 0;

                    return (
                      <tr key={work._id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/works/${work._id}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {work.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">{work.eventType}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p>{formatDate(work.eventDate)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatClockTime(work.reportingTime)} · {work.durationHours}h
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-48 truncate">{work.location.venue}</p>
                          <p className="text-xs text-muted-foreground">{work.location.city}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-32 space-y-1">
                            <p className="flex items-center gap-1 text-xs">
                              <Users className="h-3 w-3 text-muted-foreground" aria-hidden />
                              {work.bookedStaff} / {work.requiredStaff}
                              {work.appliedCount > 0 && (
                                <span className="ml-1 text-blue-600 dark:text-blue-400">
                                  +{work.appliedCount} applied
                                </span>
                              )}
                            </p>
                            <Progress
                              value={fillPercent}
                              className="h-1.5"
                              indicatorClassName={isFull ? 'bg-amber-500' : 'bg-emerald-500'}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(work.payment.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge kind="work" status={work.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <ul className="space-y-3 lg:hidden">
            {data.works.map((work) => {
              const isFull = work.bookedStaff >= work.requiredStaff;
              const fillPercent = work.requiredStaff
                ? Math.round((work.bookedStaff / work.requiredStaff) * 100)
                : 0;

              return (
                <li key={work._id}>
                  <Card>
                    <CardContent className="p-4">
                      <Link href={`/admin/works/${work._id}`} className="block">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{work.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatDate(work.eventDate)} · {formatClockTime(work.reportingTime)}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {work.location.venue}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <StatusBadge kind="work" status={work.status} />
                            <p className="mt-1.5 text-sm font-semibold">
                              {formatCurrency(work.payment.amount)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <p className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {work.bookedStaff} / {work.requiredStaff} staff
                            </span>
                            {work.appliedCount > 0 && (
                              <span className="text-blue-600 dark:text-blue-400">
                                {work.appliedCount} applied
                              </span>
                            )}
                          </p>
                          <Progress
                            value={fillPercent}
                            className="h-1.5"
                            indicatorClassName={isFull ? 'bg-amber-500' : 'bg-emerald-500'}
                          />
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
