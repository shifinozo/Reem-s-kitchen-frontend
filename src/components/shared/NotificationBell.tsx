'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiGet, apiPatch, apiDelete, toApiError } from '@/lib/api';
import { cn, timeAgo } from '@/lib/utils';
import type { AppNotification } from '@/types';

/** Poll interval for the unread badge. Cheap endpoint, modest cadence. */
const POLL_MS = 60_000;

const TYPE_DOT: Record<string, string> = {
  booking_approved: 'bg-emerald-500',
  booking_rejected: 'bg-rose-500',
  booking_cancelled: 'bg-orange-500',
  work_cancelled: 'bg-rose-500',
  new_work: 'bg-blue-500',
  payment_update: 'bg-teal-500',
  account_approved: 'bg-emerald-500',
  account_rejected: 'bg-rose-500',
  account_suspended: 'bg-slate-500',
  rating_received: 'bg-amber-500',
  staff_assigned: 'bg-indigo-500',
  new_registration: 'bg-blue-500',
  work_reminder: 'bg-amber-500',
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    try {
      const response = await apiGet<{ unreadCount: number }>('/notifications/unread-count');
      setUnread(response.data.unreadCount);
    } catch {
      // A failed badge poll is not worth interrupting the user.
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<{ notifications: AppNotification[]; unreadCount: number }>(
        '/notifications?limit=12',
      );
      setItems(response.data.notifications);
      setUnread(response.data.unreadCount);
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCount();
    const timer = setInterval(loadCount, POLL_MS);
    return () => clearInterval(timer);
  }, [loadCount]);

  useEffect(() => {
    if (open) void loadList();
  }, [open, loadList]);

  const openNotification = async (notification: AppNotification) => {
    if (!notification.read) {
      setItems((prev) =>
        prev.map((item) => (item._id === notification._id ? { ...item, read: true } : item)),
      );
      setUnread((count) => Math.max(count - 1, 0));
      void apiPatch(`/notifications/${notification._id}/read`).catch(() => null);
    }

    setOpen(false);
    // External links (e.g. an invite URL) are left to the browser.
    if (notification.link?.startsWith('/')) router.push(notification.link);
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnread(0);
    try {
      await apiPatch('/notifications/read-all');
    } catch (error) {
      toast.error(toApiError(error).message);
      void loadList();
    }
  };

  const clearAll = async () => {
    const previous = items;
    setItems([]);
    setUnread(0);
    try {
      await apiDelete('/notifications');
      toast.success('Notifications cleared');
    } catch (error) {
      setItems(previous);
      toast.error(toApiError(error).message);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllRead}>
                <Check className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={clearAll}
                aria-label="Clear all notifications"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-[26rem] overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" aria-hidden />
              <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((notification) => (
                <li key={notification._id}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={cn(
                      'flex w-full gap-2.5 px-3 py-3 text-left transition-colors hover:bg-accent',
                      !notification.read && 'bg-primary/5',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        TYPE_DOT[notification.type] || 'bg-slate-400',
                        notification.read && 'opacity-40',
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-sm',
                          notification.read ? 'font-medium' : 'font-semibold',
                        )}
                      >
                        {notification.title}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground/70">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
