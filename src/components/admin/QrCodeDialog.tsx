'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2, Printer, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiGet, apiPost, toApiError } from '@/lib/api';
import { formatClockTime, formatDate } from '@/lib/utils';
import type { Work } from '@/types';

interface QrCodeDialogProps {
  work: Work;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QrResponse {
  qrDataUrl: string;
  issuedAt: string;
  work?: { title: string; eventDate: string; reportingTime: string; venue: string };
}

/** Shows the event QR code for printing or displaying at the venue. */
export function QrCodeDialog({ work, open, onOpenChange }: QrCodeDialogProps) {
  const [qr, setQr] = useState<QrResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const response = await apiGet<QrResponse>(`/works/${work._id}/qr`);
        if (!cancelled) setQr(response.data);
      } catch (caught) {
        if (!cancelled) toast.error(toApiError(caught).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, work._id]);

  const rotate = async () => {
    setRotating(true);
    try {
      const response = await apiPost<QrResponse>(`/works/${work._id}/qr/rotate`);
      setQr(response.data);
      toast.success(response.message);
    } catch (caught) {
      toast.error(toApiError(caught).message);
    } finally {
      setRotating(false);
    }
  };

  /**
   * Opens a minimal print window containing just the code and event details,
   * so the venue copy is not cluttered with app chrome.
   */
  const print = () => {
    if (!qr) return;

    const printWindow = window.open('', '_blank', 'width=640,height=760');
    if (!printWindow) {
      toast.error('Your browser blocked the print window. Allow pop-ups and try again.');
      return;
    }

    const escapeHtml = (value: string) =>
      value.replace(/[&<>"']/g, (char) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string,
      );

    printWindow.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(work.title)} — Attendance QR</title>
<style>
  body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;padding:36px;text-align:center;color:#0f172a}
  h1{font-size:20px;margin:0 0 4px}
  p{margin:2px 0;color:#475569;font-size:13px}
  img{width:320px;height:320px;margin:24px auto;display:block}
  .hint{margin-top:20px;font-size:12px;color:#64748b}
  .brand{font-size:12px;font-weight:600;color:#0f766e;letter-spacing:.04em;text-transform:uppercase}
</style></head>
<body>
  <p class="brand">Reem&#39;s Kitchen</p>
  <h1>${escapeHtml(work.title)}</h1>
  <p>${escapeHtml(formatDate(work.eventDate))} &middot; ${escapeHtml(formatClockTime(work.reportingTime))}</p>
  <p>${escapeHtml(work.location.venue)}</p>
  <img src="${qr.qrDataUrl}" alt="Attendance QR code">
  <p class="hint">Staff: open the app and scan this code to mark your attendance.</p>
</body></html>`);

    printWindow.document.close();
    printWindow.focus();
    // Give the image a moment to decode before the print dialog opens.
    setTimeout(() => printWindow.print(), 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Attendance QR code</DialogTitle>
          <DialogDescription>
            Display or print this at the venue. Staff scan it to check in.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center">
          {loading ? (
            <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : qr ? (
            <>
              <div className="rounded-lg border border-border bg-white p-3">
                <Image
                  src={qr.qrDataUrl}
                  alt={`Attendance QR code for ${work.title}`}
                  width={240}
                  height={240}
                  unoptimized
                />
              </div>
              <p className="mt-3 text-center text-sm font-medium">{work.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(work.eventDate)} · {formatClockTime(work.reportingTime)}
              </p>
            </>
          ) : (
            <p className="py-10 text-sm text-muted-foreground">Could not load the QR code.</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={print} disabled={!qr}>
            <Printer />
            Print
          </Button>
          <Button variant="outline" className="flex-1" onClick={rotate} loading={rotating}>
            {!rotating && <RefreshCw />}
            New code
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Issuing a new code invalidates any copy shared or printed earlier.
        </p>
      </DialogContent>
    </Dialog>
  );
}
