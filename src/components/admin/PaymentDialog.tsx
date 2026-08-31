'use client';

import { useState } from 'react';
import { toast } from 'sonner';

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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiPatch, toApiError } from '@/lib/api';
import { PAYMENT_METHODS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import type { Booking, PaymentMethod, PaymentStatus, User, Work } from '@/types';

interface PaymentDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

/** Records or updates the payment for a completed booking. */
export function PaymentDialog({ booking, open, onOpenChange, onUpdated }: PaymentDialogProps) {
  const staff = booking.staff as User;
  const work = booking.work as Work;

  const [status, setStatus] = useState<PaymentStatus>(booking.payment.status);
  const [amount, setAmount] = useState(String(booking.payment.amount ?? 0));
  const [method, setMethod] = useState<PaymentMethod>(booking.payment.method || 'cash');
  const [paidAt, setPaidAt] = useState(
    booking.payment.paidAt
      ? booking.payment.paidAt.split('T')[0]
      : new Date().toISOString().split('T')[0],
  );
  const [reference, setReference] = useState(booking.payment.reference || '');
  const [note, setNote] = useState(booking.payment.note || '');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const response = await apiPatch(`/bookings/${booking._id}/payment`, {
        status,
        amount: Number(amount),
        method,
        // Only meaningful once the payment is actually settled.
        paidAt: status === 'paid' ? paidAt : undefined,
        reference,
        note,
      });
      toast.success(response.message);
      onOpenChange(false);
      onUpdated();
    } catch (caught) {
      toast.error(toApiError(caught).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {staff?.fullName} · {work?.title} · {formatCurrency(booking.payment.amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment-status" required>
                Status
              </Label>
              <Select value={status} onValueChange={(value) => setStatus(value as PaymentStatus)}>
                <SelectTrigger id="payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount (₹)</Label>
              <Input
                id="payment-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
          </div>

          {status === 'paid' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment-method">Method</Label>
                <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
                  <SelectTrigger id="payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-date">Payment date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paidAt}
                  onChange={(event) => setPaidAt(event.target.value)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="payment-reference">Reference</Label>
                <Input
                  id="payment-reference"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Transaction ID or cheque number"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="payment-note">Note</Label>
            <Textarea
              id="payment-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={300}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            Save payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
