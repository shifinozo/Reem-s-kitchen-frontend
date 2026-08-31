import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Event dates are stored at UTC midnight so the calendar day is stable.
 * Formatting in UTC keeps "20 Dec" from sliding to "19 Dec" west of Greenwich.
 */
export function formatDate(value?: string | Date | null, pattern = 'dd MMM yyyy') {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(date)) return '—';

  const utcShifted = new Date(date.getTime() + date.getTimezoneOffset() * 60_000);
  return format(utcShifted, pattern);
}

/** Timestamps (check-ins, payments) are real instants — format them locally. */
export function formatDateTime(value?: string | Date | null, pattern = 'dd MMM yyyy, h:mm a') {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? format(date, pattern) : '—';
}

export function formatTimeOnly(value?: string | Date | null) {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? format(date, 'h:mm a') : '—';
}

/** "14:30" → "2:30 PM" */
export function formatClockTime(time?: string | null) {
  if (!time) return '—';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
}

export function timeAgo(value?: string | Date | null) {
  if (!value) return '';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : '';
}

export function formatCurrency(amount?: number | null, currency = 'INR') {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value?: number | null) {
  return new Intl.NumberFormat('en-IN').format(Number(value ?? 0));
}

/** Turns a snake_case status into "Title Case" for display. */
export function humanise(value?: string | null) {
  if (!value) return '';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function initials(name?: string | null) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Local avatar uploads come back as a relative "/uploads/..." path, which
 * must be resolved against the API origin rather than the Next.js one.
 */
export function resolveImageUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Serialises a filter object into a query string, dropping empty values. */
export function toQueryString(params: Record<string, unknown>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue;
    if (Array.isArray(value)) {
      if (value.length) search.set(key, value.join(','));
    } else {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/** Where to send a user after login, based on their role. */
export function homeRouteForRole(role?: string) {
  return role === 'admin' || role === 'super_admin' ? '/admin/dashboard' : '/staff/dashboard';
}

export function debounce<T extends (...args: never[]) => void>(fn: T, delay = 350) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** 4.6 → [full, full, full, full, partial] for star rendering. */
export function starFill(rating: number, index: number) {
  const diff = rating - index;
  if (diff >= 1) return 1;
  if (diff <= 0) return 0;
  return diff;
}
