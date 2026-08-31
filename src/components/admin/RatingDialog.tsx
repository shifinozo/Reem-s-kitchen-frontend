'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { apiPost, toApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Booking, User } from '@/types';

const CRITERIA = [
  { key: 'attendance', label: 'Attendance', hint: 'Did they turn up as booked?' },
  { key: 'punctuality', label: 'Punctuality', hint: 'Were they on time?' },
  { key: 'performance', label: 'Performance', hint: 'Quality of their work' },
  { key: 'behaviour', label: 'Behaviour', hint: 'Conduct with guests and the team' },
] as const;

type CriterionKey = (typeof CRITERIA)[number]['key'];

interface RatingDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRated: () => void;
}

function StarRow({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          role="radio"
          aria-checked={value === score}
          aria-label={`${score} out of 5`}
          onClick={() => onChange(score)}
          className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            className={cn(
              'h-6 w-6 transition-colors',
              score <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30',
            )}
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}

/** Collects the four rating criteria after a work is completed. */
export function RatingDialog({ booking, open, onOpenChange, onRated }: RatingDialogProps) {
  const staff = booking.staff as User;

  const [scores, setScores] = useState<Record<CriterionKey, number>>({
    attendance: booking.rating?.attendance || 0,
    punctuality: booking.rating?.punctuality || 0,
    performance: booking.rating?.performance || 0,
    behaviour: booking.rating?.behaviour || 0,
  });
  const [feedback, setFeedback] = useState(booking.rating?.feedback || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filled = Object.values(scores).filter(Boolean);
  const overall = filled.length
    ? Math.round((filled.reduce((sum, value) => sum + value, 0) / filled.length) * 10) / 10
    : 0;
  const complete = Object.values(scores).every((value) => value > 0);

  const submit = async () => {
    if (!complete) {
      setError('Please score all four criteria');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await apiPost(`/bookings/${booking._id}/rating`, { ...scores, feedback });
      toast.success(response.message);
      onOpenChange(false);
      onRated();
    } catch (caught) {
      const apiError = toApiError(caught);
      setError(apiError.message);
      toast.error(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate {staff?.fullName}</DialogTitle>
          <DialogDescription>
            Scores feed into this staff member&apos;s overall performance rating.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {CRITERIA.map((criterion) => (
            <div
              key={criterion.key}
              className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <Label className="text-sm">{criterion.label}</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">{criterion.hint}</p>
              </div>
              <StarRow
                label={criterion.label}
                value={scores[criterion.key]}
                onChange={(value) => {
                  setScores((prev) => ({ ...prev, [criterion.key]: value }));
                  if (error) setError('');
                }}
              />
            </div>
          ))}

          {overall > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
              <span className="text-sm font-medium">Overall score</span>
              <span className="flex items-center gap-1.5 text-lg font-semibold">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                {overall} / 5
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="rating-feedback">Feedback (optional)</Label>
            <Textarea
              id="rating-feedback"
              rows={3}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="A short note the staff member will see."
              maxLength={500}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting} disabled={!complete}>
            Save rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
