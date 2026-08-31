'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Search, Star, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDebounced, useFetch } from '@/hooks/useApi';
import { apiPost, toApiError } from '@/lib/api';
import { toQueryString } from '@/lib/utils';
import type { User, Work } from '@/types';

interface AssignStaffDialogProps {
  work: Work;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}

/**
 * Assigns staff directly to a work.
 * The candidate list already excludes anyone booked in the same window, so
 * an admin cannot create a clash by accident.
 */
export function AssignStaffDialog({ work, open, onOpenChange, onAssigned }: AssignStaffDialogProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounced(search);
  const slotsLeft = Math.max(work.requiredStaff - work.bookedStaff, 0);

  const url = useMemo(
    () =>
      open
        ? `/staff/available${toQueryString({
            startAt: work.startAt,
            endAt: work.endAt,
            search: debouncedSearch,
          })}`
        : null,
    [open, work.startAt, work.endAt, debouncedSearch],
  );

  const { data, loading } = useFetch<{ staff: User[]; count: number }>(url);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const assign = async () => {
    if (!selected.length) return;
    setSubmitting(true);

    try {
      const response = await apiPost<{
        assigned: Array<{ name: string }>;
        skipped: Array<{ name?: string; reason: string }>;
      }>(`/works/${work._id}/assign`, { staffIds: selected });

      toast.success(response.message);

      // Each candidate is validated independently server-side; surface skips.
      if (response.data.skipped.length) {
        for (const skip of response.data.skipped.slice(0, 3)) {
          toast.warning(`${skip.name || 'A staff member'} was skipped`, {
            description: skip.reason,
          });
        }
      }

      setSelected([]);
      onOpenChange(false);
      onAssigned();
    } catch (caught) {
      toast.error(toApiError(caught).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign staff</DialogTitle>
          <DialogDescription>
            {slotsLeft > 0
              ? `${slotsLeft} position${slotsLeft === 1 ? '' : 's'} still open. Only staff who are free at this date and time are listed.`
              : 'All positions are filled. Cancel a booking before assigning anyone else.'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, phone or city…"
            className="pl-9"
            aria-label="Search available staff"
          />
        </div>

        <div className="max-h-80 space-y-1.5 overflow-y-auto scrollbar-thin">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))
          ) : !data?.staff.length ? (
            <EmptyState
              icon={UserPlus}
              title="No available staff"
              description="Everyone approved is either busy at this time or does not match your search."
              className="border-0 py-8"
            />
          ) : (
            data.staff.map((staff) => {
              const isSelected = selected.includes(staff._id);
              const atCapacity = !isSelected && selected.length >= slotsLeft;

              return (
                <label
                  key={staff._id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                  } ${atCapacity ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggle(staff._id)}
                    disabled={atCapacity}
                    aria-label={`Assign ${staff.fullName}`}
                  />
                  <UserAvatar user={staff} className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{staff.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {staff.city || 'No city'} · {staff.stats?.completedWorks ?? 0} works
                    </p>
                    {staff.skills && staff.skills.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {staff.skills.slice(0, 2).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-[10px]">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {(staff.rating?.average ?? 0) > 0 && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                      {staff.rating?.average}
                    </span>
                  )}
                </label>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={assign} loading={submitting} disabled={!selected.length || slotsLeft === 0}>
            Assign {selected.length > 0 && `(${selected.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
