'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  /** When set, the dialog collects a reason and passes it to onConfirm. */
  reason?: { label: string; placeholder?: string; required?: boolean };
  onConfirm: (reason?: string) => Promise<void> | void;
}

/**
 * Confirmation gate for destructive or irreversible actions.
 * Optionally collects a reason, which several endpoints require.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  reason,
  onConfirm,
}: ConfirmDialogProps) {
  const [value, setValue] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  // Clear transient state whenever the dialog reopens.
  React.useEffect(() => {
    if (open) {
      setValue('');
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  const handleConfirm = async (event: React.MouseEvent) => {
    event.preventDefault();

    if (reason?.required && value.trim().length < 3) {
      setError('Please give a reason (at least 3 characters)');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(reason ? value.trim() : undefined);
      onOpenChange(false);
    } catch {
      // The caller surfaces its own toast; just re-enable the button.
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>

        {reason && (
          <div className="space-y-2">
            <Label htmlFor="confirm-reason" required={reason.required}>
              {reason.label}
            </Label>
            <Textarea
              id="confirm-reason"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                if (error) setError('');
              }}
              placeholder={reason.placeholder}
              error={Boolean(error)}
              rows={3}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={variant} onClick={handleConfirm} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Hook that wires a ConfirmDialog to an arbitrary action. */
export function useConfirm() {
  const [state, setState] = React.useState<{
    open: boolean;
    props: Omit<ConfirmDialogProps, 'open' | 'onOpenChange'> | null;
  }>({ open: false, props: null });

  const confirm = React.useCallback(
    (props: Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>) => {
      setState({ open: true, props });
    },
    [],
  );

  const dialog = state.props ? (
    <ConfirmDialog
      {...state.props}
      open={state.open}
      onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}
    />
  ) : null;

  return { confirm, dialog };
}
