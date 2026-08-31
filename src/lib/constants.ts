import type {
  AccountStatus,
  AvailabilityStatus,
  AttendanceStatus,
  BookingStatus,
  PaymentStatus,
  WorkStatus,
} from '@/types';

export const EVENT_TYPES = [
  'Wedding',
  'Reception',
  'Engagement',
  'Birthday Party',
  'Corporate Event',
  'Conference',
  'Buffet',
  'House Party',
  'Festival',
  'Religious Function',
  'Other',
] as const;

export const SKILL_OPTIONS = [
  'Waiter / Service',
  'Head Waiter',
  'Buffet Service',
  'Kitchen Helper',
  'Cook / Chef Assistant',
  'Dishwashing',
  'Cleaning',
  'Setup & Decoration',
  'Bartender',
  'Barista',
  'Delivery',
  'Supervisor',
] as const;

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
] as const;

/**
 * Badge styling per status.
 * Colours carry meaning, so each is paired with its own text label in the UI
 * rather than relying on hue alone.
 */
type BadgeTone = { label: string; className: string };

export const WORK_STATUS_META: Record<WorkStatus, BadgeTone> = {
  draft: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  published: {
    label: 'Open',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  fully_booked: {
    label: 'Fully Booked',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  completed: {
    label: 'Completed',
    className: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
};

export const BOOKING_STATUS_META: Record<BookingStatus, BadgeTone> = {
  applied: {
    label: 'Applied',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  approved: {
    label: 'Confirmed',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  checked_in: {
    label: 'Checked In',
    className: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  },
  completed: {
    label: 'Completed',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  },
  no_show: {
    label: 'No Show',
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  },
};

export const ACCOUNT_STATUS_META: Record<AccountStatus, BadgeTone> = {
  pending: {
    label: 'Pending Approval',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
};

export const AVAILABILITY_META: Record<AvailabilityStatus, BadgeTone> = {
  available: {
    label: 'Available',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  busy: {
    label: 'Busy',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  unavailable: {
    label: 'Unavailable',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
};

export const ATTENDANCE_META: Record<AttendanceStatus, BadgeTone> = {
  pending: {
    label: 'Pending',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
  present: {
    label: 'Present',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  late: {
    label: 'Late',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  absent: {
    label: 'Absent',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, BadgeTone> = {
  pending: {
    label: 'Pending',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
};

/**
 * Chart palette — brand teal first, then hues chosen to stay distinguishable
 * in both themes and for the most common colour-vision deficiencies.
 */
export const CHART_COLORS = [
  '#0d9488', // teal-600
  '#6366f1', // indigo-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#14b8a6', // teal-500
  '#ef4444', // red-500
  '#3b82f6', // blue-500
];

export const STATUS_CHART_COLORS: Record<string, string> = {
  applied: '#3b82f6',
  approved: '#10b981',
  checked_in: '#14b8a6',
  completed: '#64748b',
  rejected: '#f43f5e',
  cancelled: '#f97316',
  no_show: '#ef4444',
};

/** Tabs on the staff "My Bookings" screen. */
export const BOOKING_TABS = [
  { value: 'applied', label: 'Applied' },
  { value: 'approved,checked_in', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled,rejected,no_show', label: 'Cancelled' },
] as const;
