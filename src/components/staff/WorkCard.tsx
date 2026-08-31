'use client';

import Link from 'next/link';
import { CalendarDays, Clock, IndianRupee, Timer, Users } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LocationInline } from '@/components/shared/LocationLink';
import { cn, formatClockTime, formatCurrency, formatDate } from '@/lib/utils';
import type { Work } from '@/types';

interface WorkCardProps {
  work: Work;
  href?: string;
  className?: string;
}

/** Compact work summary used on the staff "Available Works" board. */
export function WorkCard({ work, href, className }: WorkCardProps) {
  const slots = Math.max(work.requiredStaff - work.bookedStaff, 0);
  const fillPercent = work.requiredStaff
    ? Math.round((work.bookedStaff / work.requiredStaff) * 100)
    : 0;
  const isFull = work.bookedStaff >= work.requiredStaff;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring',
        className,
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-[11px]">
                {work.eventType}
              </Badge>
              <StatusBadge kind="work" status={work.status} />
              {work.myBooking && (
                <StatusBadge kind="booking" status={work.myBooking.status} withDot />
              )}
            </div>

            <h3 className="mt-2 text-base font-semibold leading-snug tracking-tight">
              {/* Stretched link keeps the whole card clickable without nesting anchors. */}
              <Link
                href={href || `/staff/works/${work._id}`}
                className="after:absolute after:inset-0 focus-visible:outline-none"
              >
                {work.title}
              </Link>
            </h3>
          </div>

          <div className="shrink-0 text-right">
            <p className="flex items-center justify-end gap-0.5 text-lg font-semibold tracking-tight text-primary">
              <IndianRupee className="h-4 w-4" aria-hidden />
              {work.payment.amount.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {work.payment.basis === 'per_hour' ? 'per hour' : 'per shift'}
            </p>
          </div>
        </div>

        <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <dt className="sr-only">Event date</dt>
            <dd className="truncate">{formatDate(work.eventDate)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <dt className="sr-only">Reporting time</dt>
            <dd className="truncate">{formatClockTime(work.reportingTime)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <dt className="sr-only">Duration</dt>
            <dd className="truncate">{work.durationHours} hours</dd>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <dt className="sr-only">Location</dt>
            {/* Opens Google Maps; stops propagation so the card's stretched
                link does not also fire. */}
            <dd className="min-w-0">
              <LocationInline location={work.location} />
            </dd>
          </div>
        </dl>

        {/* Staffing progress */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {work.bookedStaff} of {work.requiredStaff} filled
            </span>
            <span
              className={cn(
                'font-semibold',
                isFull ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
              )}
            >
              {isFull ? 'Fully booked' : `${slots} slot${slots === 1 ? '' : 's'} left`}
            </span>
          </div>
          <Progress
            value={fillPercent}
            indicatorClassName={isFull ? 'bg-amber-500' : 'bg-emerald-500'}
            aria-label={`${fillPercent}% of positions filled`}
          />
        </div>
      </div>
    </Card>
  );
}

/** Loading placeholder matched to WorkCard's height. */
export function WorkCardSkeleton() {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="shimmer h-4 w-20 rounded-full" />
          <div className="shimmer h-5 w-3/4 rounded" />
        </div>
        <div className="shimmer h-6 w-16 rounded" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="shimmer h-3.5 rounded" />
        ))}
      </div>
      <div className="shimmer mt-5 h-2 rounded-full" />
    </Card>
  );
}
