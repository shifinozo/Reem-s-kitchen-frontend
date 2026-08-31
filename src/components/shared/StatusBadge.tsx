import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  WORK_STATUS_META,
  BOOKING_STATUS_META,
  ACCOUNT_STATUS_META,
  AVAILABILITY_META,
  ATTENDANCE_META,
  PAYMENT_STATUS_META,
} from '@/lib/constants';
import type {
  AccountStatus,
  AttendanceStatus,
  AvailabilityStatus,
  BookingStatus,
  PaymentStatus,
  WorkStatus,
} from '@/types';

type Kind = 'work' | 'booking' | 'account' | 'availability' | 'attendance' | 'payment';

const MAPS = {
  work: WORK_STATUS_META,
  booking: BOOKING_STATUS_META,
  account: ACCOUNT_STATUS_META,
  availability: AVAILABILITY_META,
  attendance: ATTENDANCE_META,
  payment: PAYMENT_STATUS_META,
} as const;

interface StatusBadgeProps {
  kind: Kind;
  status?:
    | WorkStatus
    | BookingStatus
    | AccountStatus
    | AvailabilityStatus
    | AttendanceStatus
    | PaymentStatus
    | string
    | null;
  className?: string;
  /** Renders a small dot before the label — useful in dense tables. */
  withDot?: boolean;
}

/**
 * One badge for every status vocabulary in the app.
 * Each status always carries its text label, so meaning never rests on colour.
 */
export function StatusBadge({ kind, status, className, withDot }: StatusBadgeProps) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;

  const map = MAPS[kind] as Record<string, { label: string; className: string }>;
  const meta = map[status];

  if (!meta) {
    return (
      <Badge variant="outline" className={className}>
        {String(status)}
      </Badge>
    );
  }

  return (
    <Badge variant="tone" className={cn(meta.className, className)}>
      {withDot && (
        <span className="mr-0.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      )}
      {meta.label}
    </Badge>
  );
}
