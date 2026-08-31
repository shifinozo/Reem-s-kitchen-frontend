'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AlertCircle, CameraOff, CheckCircle2, Keyboard, QrCode, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiPost, toApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Booking } from '@/types';

const READER_ID = 'rk-qr-reader';

type ScanResult =
  | { kind: 'success'; message: string; late: boolean; workTitle?: string }
  | { kind: 'error'; message: string };

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // html5-qrcode is browser-only and imported lazily, so it never runs on the server.
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const submittingRef = useRef(false);

  const submitPayload = useCallback(async (payload: string) => {
    // The camera fires continuously; ignore repeats while one is in flight.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const response = await apiPost<{ booking: Booking; work: { title: string }; late: boolean }>(
        '/bookings/scan',
        { payload },
      );
      setResult({
        kind: 'success',
        message: response.message,
        late: response.data.late,
        workTitle: response.data.work?.title,
      });
      toast.success(response.message);
    } catch (caught) {
      const apiError = toApiError(caught);
      setResult({ kind: 'error', message: apiError.message });
      toast.error(apiError.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
      scannerRef.current.clear();
    } catch {
      // Already stopped, or the element is gone — nothing to clean up.
    }
    scannerRef.current = null;
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError('');
    setResult(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner as unknown as { stop: () => Promise<void>; clear: () => void };

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText: string) => {
          await stopScanner();
          await submitPayload(decodedText);
        },
        // Per-frame decode failures are normal; ignore them.
        () => {},
      );

      setScanning(true);
    } catch (error) {
      const message =
        error instanceof Error && /permission|denied|NotAllowed/i.test(error.message)
          ? 'Camera access was blocked. Allow camera permission in your browser, or enter the code manually.'
          : 'Could not start the camera on this device. Enter the code manually instead.';
      setCameraError(message);
      setScanning(false);
    }
  }, [stopScanner, submitPayload]);

  // Release the camera when leaving the page.
  useEffect(() => () => void stopScanner(), [stopScanner]);

  const reset = () => {
    setResult(null);
    setManualCode('');
  };

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Scan attendance QR</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Scan the event QR code at the venue to mark your attendance.
        </p>
      </div>

      {/* Result */}
      {result && (
        <Card
          className={cn(
            result.kind === 'success'
              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40'
              : 'border-destructive/40 bg-destructive/5',
          )}
        >
          <CardContent className="flex flex-col items-center py-8 text-center">
            {result.kind === 'success' ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <CheckCircle2
                    className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                </div>
                <h2 className="mt-4 text-base font-semibold text-emerald-900 dark:text-emerald-200">
                  {result.late ? 'Checked in — late' : 'Checked in'}
                </h2>
                {result.workTitle && (
                  <p className="mt-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    {result.workTitle}
                  </p>
                )}
                <p className="mt-1.5 text-sm text-emerald-800/80 dark:text-emerald-300/80">
                  {result.message}
                </p>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-7 w-7 text-destructive" aria-hidden />
                </div>
                <h2 className="mt-4 text-base font-semibold text-destructive">
                  Could not check in
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{result.message}</p>
              </>
            )}

            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={reset}>
                <RotateCcw />
                Scan again
              </Button>
              <Button asChild>
                <Link href="/staff/bookings">My bookings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanner */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {manualMode ? 'Enter code manually' : 'Camera scanner'}
            </CardTitle>
            <CardDescription>
              {manualMode
                ? 'Type or paste the code printed under the QR image at the venue.'
                : 'Point your camera at the event QR code.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!manualMode ? (
              <>
                {/* html5-qrcode injects the video element here. */}
                <div
                  id={READER_ID}
                  className={cn(
                    'overflow-hidden rounded-lg bg-muted',
                    scanning ? 'min-h-[260px]' : 'hidden',
                  )}
                />

                {!scanning && (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center">
                    {cameraError ? (
                      <>
                        <CameraOff className="h-9 w-9 text-muted-foreground" aria-hidden />
                        <p className="mt-3 text-sm text-muted-foreground">{cameraError}</p>
                      </>
                    ) : (
                      <>
                        <QrCode className="h-9 w-9 text-muted-foreground" aria-hidden />
                        <p className="mt-3 text-sm text-muted-foreground">
                          Tap below to start your camera.
                        </p>
                      </>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {scanning ? (
                    <Button variant="outline" className="flex-1" onClick={stopScanner}>
                      Stop camera
                    </Button>
                  ) : (
                    <Button className="flex-1" onClick={startScanner} loading={submitting}>
                      <QrCode />
                      Start camera
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await stopScanner();
                      setManualMode(true);
                    }}
                  >
                    <Keyboard />
                    Manual
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="manual-code">Attendance code</Label>
                  <Input
                    id="manual-code"
                    value={manualCode}
                    onChange={(event) => setManualCode(event.target.value)}
                    placeholder="RK|…"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={manualCode.trim().length < 10}
                    loading={submitting}
                    onClick={() => submitPayload(manualCode.trim())}
                  >
                    Check in
                  </Button>
                  <Button variant="outline" onClick={() => setManualMode(false)}>
                    Use camera
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        You can only check in for work that has been confirmed, and within a few
        hours of the reporting time.
      </p>
    </div>
  );
}
