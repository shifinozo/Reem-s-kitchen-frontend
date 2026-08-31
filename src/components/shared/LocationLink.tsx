'use client';

import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { buildMapsUrl, buildDirectionsUrl, formatAddress } from '@/lib/maps';
import { cn } from '@/lib/utils';
import type { WorkLocation } from '@/types';

interface LocationLinkProps {
  location?: Partial<WorkLocation> | null;
  /** Show the venue name above the address. */
  showVenue?: boolean;
  /** Adds a "Get directions" action — used once a booking is confirmed. */
  showDirections?: boolean;
  className?: string;
}

/**
 * Renders a work location as a link that opens Google Maps.
 *
 * A pasted map link (or coordinates extracted from one) gives an exact pin;
 * otherwise the venue and address are used as a search query, which still
 * lands on a named venue reliably.
 */
export function LocationLink({
  location,
  showVenue = false,
  showDirections = false,
  className,
}: LocationLinkProps) {
  if (!location) return <span className="text-muted-foreground">—</span>;

  const mapsUrl = buildMapsUrl(location);
  const directionsUrl = showDirections ? buildDirectionsUrl(location) : null;
  const address = formatAddress(location);

  // Nothing to link to — render plain text rather than a dead link.
  if (!mapsUrl) {
    return (
      <span className={className}>
        {showVenue && location.venue}
        {address && <span className="block text-muted-foreground">{address}</span>}
      </span>
    );
  }

  const label = [location.venue, address].filter(Boolean).join(', ');

  return (
    <span className={cn('block', className)}>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Open ${label} in Google Maps`}
        className="group inline-flex items-start gap-1 rounded text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0">
          {showVenue && <span className="block font-medium">{location.venue}</span>}
          <span className={cn('inline', showVenue && 'text-muted-foreground')}>
            {address || location.venue}
          </span>
          <ExternalLink
            className="ml-1 inline h-3 w-3 shrink-0 align-baseline opacity-50 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </span>
        <span className="sr-only">(opens Google Maps in a new tab)</span>
      </a>

      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Navigation className="h-3 w-3" aria-hidden />
          Get directions
        </a>
      )}
    </span>
  );
}

/**
 * Compact inline variant for cards and table rows: a pin icon plus the
 * city or venue, linking to the same map.
 */
export function LocationInline({
  location,
  className,
}: {
  location?: Partial<WorkLocation> | null;
  className?: string;
}) {
  if (!location) return null;

  const mapsUrl = buildMapsUrl(location);
  const text = location.city || location.venue || '';
  if (!text) return null;

  const content = (
    <>
      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">{text}</span>
    </>
  );

  if (!mapsUrl) {
    return <span className={cn('inline-flex items-center gap-1', className)}>{content}</span>;
  }

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      // Cards wrap the whole tile in a stretched link; stopping propagation
      // keeps a tap on the address from also triggering that navigation.
      onClick={(event) => event.stopPropagation()}
      title={`Open ${text} in Google Maps`}
      className={cn(
        'relative z-10 inline-flex items-center gap-1 rounded transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {content}
    </a>
  );
}
