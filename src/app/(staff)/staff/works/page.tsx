'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, Filter, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { WorkCard, WorkCardSkeleton } from '@/components/staff/WorkCard';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { useDebounced, useFetch } from '@/hooks/useApi';
import { toQueryString } from '@/lib/utils';
import { EVENT_TYPES } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import type { Work } from '@/types';

const INITIAL_FILTERS = {
  search: '',
  eventType: 'all',
  skill: 'all',
  city: '',
  dateFrom: '',
  dateTo: '',
  availableOnly: 'true',
};

export default function AvailableWorksPage() {
  // Listings are restricted server-side to these, so the skill filter only
  // narrows within them.
  const mySkills = useAuthStore((state) => state.user?.skills) ?? [];

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounced(filters.search);
  const debouncedCity = useDebounced(filters.city);

  const url = useMemo(
    () =>
      `/works${toQueryString({
        page,
        limit: 9,
        search: debouncedSearch,
        eventType: filters.eventType,
        skill: filters.skill,
        city: debouncedCity,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        availableOnly: filters.availableOnly === 'true' ? 'true' : undefined,
        sort: 'eventDate',
      })}`,
    [page, debouncedSearch, debouncedCity, filters.eventType, filters.skill, filters.dateFrom, filters.dateTo, filters.availableOnly],
  );

  const { data, meta, loading, error, refetch } = useFetch<{ works: Work[] }>(url);

  const setFilter = (key: keyof typeof INITIAL_FILTERS, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const activeFilterCount = [
    filters.eventType !== 'all',
    filters.skill !== 'all',
    Boolean(filters.city),
    Boolean(filters.dateFrom),
    Boolean(filters.dateTo),
    filters.availableOnly !== 'true',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Available works</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {mySkills.length ? (
            <>
              Jobs matching your skills ({mySkills.join(', ')}). Update them in{' '}
              <Link href="/staff/profile" className="font-medium text-primary hover:underline">
                your profile
              </Link>{' '}
              to see different work.
            </>
          ) : (
            <>
              Add your skills in{' '}
              <Link href="/staff/profile" className="font-medium text-primary hover:underline">
                your profile
              </Link>{' '}
              to see the jobs you can take on.
            </>
          )}
        </p>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={filters.search}
            onChange={(event) => setFilter('search', event.target.value)}
            placeholder="Search by title, venue or city…"
            className="pl-9"
            aria-label="Search available works"
          />
        </div>
        <Button
          variant={showFilters || activeFilterCount ? 'default' : 'outline'}
          onClick={() => setShowFilters((prev) => !prev)}
          aria-expanded={showFilters}
        >
          <Filter />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-0.5 rounded-full bg-primary-foreground/20 px-1.5 text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="filter-event">Event type</Label>
              <Select value={filters.eventType} onValueChange={(value) => setFilter('eventType', value)}>
                <SelectTrigger id="filter-event">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All event types</SelectItem>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/*
              Listings are already restricted to the viewer's own skills by the
              API, so this only narrows within them. Offering the full list
              would imply work is available that the server will never return.
            */}
            <div className="space-y-1.5">
              <Label htmlFor="filter-skill">Skill required</Label>
              <Select value={filters.skill} onValueChange={(value) => setFilter('skill', value)}>
                <SelectTrigger id="filter-skill">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All my skills</SelectItem>
                  {mySkills.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-city">City</Label>
              <Input
                id="filter-city"
                value={filters.city}
                onChange={(event) => setFilter('city', event.target.value)}
                placeholder="e.g. Kochi"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-from">From date</Label>
              <Input
                id="filter-from"
                type="date"
                value={filters.dateFrom}
                onChange={(event) => setFilter('dateFrom', event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-to">To date</Label>
              <Input
                id="filter-to"
                type="date"
                value={filters.dateTo}
                onChange={(event) => setFilter('dateTo', event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-slots">Availability</Label>
              <Select
                value={filters.availableOnly}
                onValueChange={(value) => setFilter('availableOnly', value)}
              >
                <SelectTrigger id="filter-slots">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Only jobs with open slots</SelectItem>
                  <SelectItem value="false">Show all, including full</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFilterCount > 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X />
                  Clear all filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {error ? (
        <ErrorState description={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <WorkCardSkeleton key={index} />
          ))}
        </div>
      ) : !data?.works.length ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title="No work matches your filters"
          description={
            activeFilterCount || filters.search
              ? 'Try widening your search or clearing some filters.'
              : 'There are no open jobs right now. Check back soon — you will be notified when new work is posted.'
          }
          action={
            (activeFilterCount > 0 || filters.search) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.works.map((work) => (
              <WorkCard key={work._id} work={work} />
            ))}
          </div>
          <Pagination meta={meta ?? undefined} onPageChange={setPage} className="pt-2" />
        </>
      )}
    </div>
  );
}
