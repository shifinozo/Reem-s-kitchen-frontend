import type {
  AccountStatus,
  AdminRole,
  AvailabilityStatus,
  AttendanceStatus,
  BookingStatus,
  PaymentStatus,
  Permission,
  Role,
  WorkStatus,
} from '@/types';

/**
 * Admin-panel roles offered in the invite dialog, ordered least to most
 * privileged. Must stay in sync with INVITABLE_ROLES on the server.
 */
export const ADMIN_ROLE_OPTIONS = [
  {
    value: 'event_manager',
    label: 'Event Manager',
    description: 'Creates events, assigns staff and views reports. Cannot approve staff or handle payments.',
  },
  {
    value: 'finance_manager',
    label: 'Finance Manager',
    description: 'Handles payments and views reports. Cannot create events or manage staff.',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manages staff, events, bookings, payments and reports.',
  },
  {
    value: 'super_admin',
    label: 'Super Admin',
    description: 'Full access, including inviting and removing other administrators.',
  },
] as const;

export const ROLE_LABELS: Record<Role, string> = {
  staff: 'Staff',
  event_manager: 'Event Manager',
  finance_manager: 'Finance Manager',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

/**
 * Mirrors ROLE_PERMISSIONS in backend/src/utils/constants.js.
 *
 * This is for hiding controls a role cannot use — the server enforces the
 * same table on every request and remains the only thing that actually
 * protects an endpoint.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  super_admin: [
    'create_events',
    'assign_staff',
    'approve_staff',
    'manage_payments',
    'view_reports',
    'manage_admins',
  ],
  admin: ['create_events', 'assign_staff', 'approve_staff', 'manage_payments', 'view_reports'],
  event_manager: ['create_events', 'assign_staff', 'view_reports'],
  finance_manager: ['manage_payments', 'view_reports'],
  staff: [],
};

/** True when `role` carries `permission`. */
export function roleHasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

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

/**
 * Rank in the catering team, assigned by an admin at approval.
 * Must stay in sync with STAFF_POSITIONS in backend/src/utils/constants.js.
 * Ordered junior → senior.
 */
export const STAFF_POSITIONS = [
  { value: 'boy', label: 'Boy' },
  { value: 'captain', label: 'Captain' },
  { value: 'supervisor', label: 'Supervisor' },
] as const;

export const POSITION_LABELS: Record<string, string> = {
  boy: 'Boy',
  captain: 'Captain',
  supervisor: 'Supervisor',
};

/** Must stay in sync with SKILL_OPTIONS in backend/src/utils/constants.js. */
export const SKILL_OPTIONS = [
  'Hosting',
  'Service',
  'Kitchen Helper',
  'Dishwasher',
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

export const ROLE_META: Record<AdminRole, BadgeTone> = {
  event_manager: {
    label: 'Event Manager',
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  },
  finance_manager: {
    label: 'Finance Manager',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  },
  admin: {
    label: 'Admin',
    className: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  super_admin: {
    label: 'Super Admin',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
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

/** Seniority reads left-to-right as the colour warms. */
export const POSITION_META: Record<string, BadgeTone> = {
  boy: {
    label: 'Boy',
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  },
  captain: {
    label: 'Captain',
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  },
  supervisor: {
    label: 'Supervisor',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
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
