'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { STAFF_POSITIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { StaffPosition, User } from '@/types';

interface ApproveStaffDialogProps {
  /** The staff member being approved, or null when the dialog is closed. */
  staff: User | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (position: StaffPosition) => Promise<void>;
}

/**
 * Approving a registration is also where a staff member is placed in the team,
 * so the position is chosen here rather than defaulted — the API rejects an
 * approval without one.
 */
export function ApproveStaffDialog({ staff, onOpenChange, onConfirm }: ApproveStaffDialogProps) {
  const [position, setPosition] = useState<StaffPosition>('boy');
  const [saving, setSaving] = useState(false);

  // Reset to the default rank each time the dialog opens for someone new,
  // so a previous choice cannot carry over to the next person.
  useEffect(() => {
    if (staff) setPosition('boy');
  }, [staff]);

  const submit = async () => {
    setSaving(true);
    try {
      await onConfirm(position);
      onOpenChange(false);
    } catch {
      // The caller surfaces the error; keep the dialog open so the admin
      // can retry without re-entering their choice.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(staff)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve registration</DialogTitle>
          <DialogDescription>
            Choose the position this staff member will hold. It appears on their profile and
            can be changed later.
          </DialogDescription>
        </DialogHeader>

        {staff && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <UserAvatar user={staff} className="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{staff.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {staff.phone}
                {staff.city ? ` · ${staff.city}` : ''}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Position</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {STAFF_POSITIONS.map((option) => {
              const selected = position === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPosition(option.value)}
                  aria-pressed={selected}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  {selected && <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden />}
                  {option.label}
                </button>
              );
            })}
          </div>
          {staff?.skills && staff.skills.length > 0 && (
            <p className="pt-1 text-xs text-muted-foreground">
              Listed skills: {staff.skills.join(', ')}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="success" onClick={submit} loading={saving}>
            {!saving && <Check />}
            Approve as {STAFF_POSITIONS.find((o) => o.value === position)?.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
