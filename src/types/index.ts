/* Shared domain types — mirrors backend/src/utils/constants.js */

export type Role = 'staff' | 'admin' | 'super_admin';
export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type AvailabilityStatus = 'available' | 'busy' | 'unavailable';
export type WorkStatus =
  | 'draft'
  | 'published'
  | 'fully_booked'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type BookingStatus =
  | 'applied'
  | 'approved'
  | 'checked_in'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'no_show';
export type AttendanceStatus = 'pending' | 'present' | 'late' | 'absent';
export type PaymentStatus = 'pending' | 'processing' | 'paid';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';

export interface Avatar {
  url: string;
  publicId: string;
}

export interface RatingBreakdown {
  attendance: number;
  punctuality: number;
  performance: number;
  behaviour: number;
}

export interface User {
  id: string;
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  avatar: Avatar;

  address?: string;
  city?: string;
  dateOfBirth?: string;
  age?: number | null;
  experienceYears?: number;
  experienceNote?: string;
  skills?: string[];
  availabilityStatus?: AvailabilityStatus;

  accountStatus: AccountStatus;
  statusReason?: string;
  approvedAt?: string;

  rating?: { average: number; count: number; breakdown: RatingBreakdown };
  stats?: {
    completedWorks: number;
    noShows: number;
    cancellations: number;
    totalEarnings: number;
  };

  isAdmin?: boolean;
  canAccessWork?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkLocation {
  venue: string;
  address: string;
  city: string;
  /** A Google/Apple Maps link the admin pasted, if any. */
  mapUrl: string;
  /** Exact pin, extracted from `mapUrl` server-side when available. */
  lat?: number | null;
  lng?: number | null;
}

export interface WorkPayment {
  amount: number;
  currency: string;
  basis: 'per_shift' | 'per_hour';
  note: string;
}

export interface Work {
  id: string;
  _id: string;
  title: string;
  eventType: string;
  description: string;

  eventDate: string;
  reportingTime: string;
  durationHours: number;
  startAt: string;
  endAt: string;

  location: WorkLocation;
  requiredStaff: number;
  bookedStaff: number;
  appliedCount: number;
  availableSlots: number;
  isFullyBooked: boolean;
  fillPercentage: number;
  preferredSkills: string[];
  payment: WorkPayment;

  status: WorkStatus;
  cancellationReason?: string;
  contactPerson?: { name: string; phone: string };

  createdBy?: Pick<User, 'id' | 'fullName' | 'email'> | string;
  publishedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;

  /** Present on staff listings: the viewer's own booking for this work. */
  myBooking?: { id: string; status: BookingStatus } | null;
  /** Present on staff work detail when a clash was detected. */
  scheduleConflict?: { conflicts: Array<{ title: string; eventDate: string }> } | null;
  /** Present on admin work detail. */
  applicants?: Booking[];
}

export interface BookingAttendance {
  status: AttendanceStatus;
  checkInAt?: string;
  checkOutAt?: string;
  method: 'qr' | 'manual';
  minutesLate: number;
}

export interface BookingPayment {
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  paidAt?: string;
  reference: string;
  note: string;
}

export interface BookingRating extends RatingBreakdown {
  overall: number;
  feedback: string;
  ratedAt?: string;
}

export interface BookingHistoryEntry {
  from?: string;
  to: string;
  at: string;
  by?: Pick<User, 'id' | 'fullName' | 'role'> | string;
  note?: string;
}

export interface Booking {
  id: string;
  _id: string;
  work: Work | string;
  staff: User | string;
  status: BookingStatus;
  startAt: string;
  endAt: string;
  assignedByAdmin: boolean;

  appliedAt: string;
  approvedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  statusNote?: string;

  attendance: BookingAttendance;
  payment: BookingPayment;
  rating?: BookingRating;
  history: BookingHistoryEntry[];

  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'new_work'
  | 'booking_applied'
  | 'booking_approved'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'work_cancelled'
  | 'work_reminder'
  | 'payment_update'
  | 'account_approved'
  | 'account_rejected'
  | 'account_suspended'
  | 'rating_received'
  | 'staff_assigned'
  | 'admin_invite'
  | 'new_registration';

export interface AppNotification {
  _id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  meta: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AdminInvite {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'super_admin';
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
  acceptedAt?: string;
  invitedBy?: Pick<User, 'id' | 'fullName' | 'email'>;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  errors?: Record<string, string>;
}

export interface AdminDashboardData {
  stats: {
    totalStaff: number;
    activeStaff: number;
    availableStaff: number;
    pendingApprovals: number;
    suspendedStaff: number;
    availableWorks: number;
    fullyBookedWorks: number;
    draftWorks: number;
    completedWorks: number;
    cancelledWorks: number;
    appliedBookings: number;
    confirmedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    noShowBookings: number;
    upcomingEvents: number;
    paidAmount: number;
    pendingAmount: number;
  };
  charts: {
    bookingTrend: Array<{
      month: string;
      applied: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    }>;
    bookingStatus: Array<{ name: string; value: number }>;
    eventTypes: Array<{ name: string; value: number }>;
  };
  upcomingEvents: Work[];
  topStaff: User[];
  recentActivity: Booking[];
}

export interface StaffDashboardData {
  stats: {
    applied: number;
    confirmed: number;
    checkedIn: number;
    completed: number;
    cancelled: number;
    noShow: number;
    availableWorks: number;
    unreadNotifications: number;
    rating: number;
    ratingCount: number;
  };
  earnings: { paid: number; pending: number };
  upcoming: Booking[];
  trend: Array<{ month: string; works: number; earnings: number }>;
}

export interface AttendanceOverview {
  work: { id: string; title: string; eventDate: string; reportingTime: string };
  summary: {
    expected: number;
    checkedIn: number;
    onTime: number;
    late: number;
    missing: number;
    noShow: number;
  };
  checkedIn: Booking[];
  missing: Booking[];
  noShow: Booking[];
}

export interface ReportResponse {
  title: string;
  subtitle: string;
  columns: Array<{ key: string; label: string }>;
  rows: Record<string, unknown>[];
  summary: Array<{ label: string; value: string | number }>;
  chart?: Array<Record<string, unknown>>;
}
