'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { useFetch } from '@/hooks/useApi';
import { downloadFile, toApiError } from '@/lib/api';
import { toQueryString } from '@/lib/utils';
import type { ReportResponse } from '@/types';

const REPORTS = [
  { value: 'works', label: 'Completed works', description: 'Every finished event with staffing and payout.' },
  { value: 'attendance', label: 'Attendance', description: 'Check-ins, late arrivals and absences.' },
  { value: 'earnings', label: 'Staff earnings', description: 'Per-staff totals, paid and outstanding.' },
  { value: 'payments', label: 'Payment history', description: 'The full payment ledger.' },
  { value: 'bookings', label: 'Booking statistics', description: 'Volumes and outcomes over time.' },
  { value: 'staff', label: 'Staff roster', description: 'Every registered staff member.' },
] as const;

/** Returns an ISO date string N months before today. */
function monthsAgo(count: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - count);
  return date.toISOString().split('T')[0];
}

export default function AdminReportsPage() {
  const [report, setReport] = useState<string>('works');
  const [from, setFrom] = useState(monthsAgo(6));
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('month');
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null);

  const query = useMemo(
    () => toQueryString({ from, to, groupBy, format: 'json' }),
    [from, to, groupBy],
  );

  const { data, loading, error, refetch } = useFetch<ReportResponse>(`/reports/${report}${query}`);

  const download = async (format: 'csv' | 'pdf') => {
    setDownloading(format);
    try {
      const params = toQueryString({ from, to, groupBy, format });
      const filename = `${report}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      await downloadFile(`/reports/${report}${params}`, filename);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (caught) {
      toast.error(toApiError(caught).message);
    } finally {
      setDownloading(null);
    }
  };

  const current = REPORTS.find((item) => item.value === report);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Reports</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Generate and export operational reports as CSV or PDF.
        </p>
      </div>

      {/* Report picker */}
      <Tabs value={report} onValueChange={setReport}>
        <TabsList className="w-full">
          {REPORTS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Controls */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="report-from">From</Label>
              <Input
                id="report-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-to">To</Label>
              <Input
                id="report-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
            {report === 'bookings' && (
              <div className="space-y-1.5">
                <Label htmlFor="report-group">Group by</Label>
                <Select
                  value={groupBy}
                  onValueChange={(value) => setGroupBy(value as 'day' | 'month')}
                >
                  <SelectTrigger id="report-group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => download('csv')}
              loading={downloading === 'csv'}
              disabled={loading || !data?.rows.length}
            >
              {downloading !== 'csv' && <FileSpreadsheet />}
              CSV
            </Button>
            <Button
              onClick={() => download('pdf')}
              loading={downloading === 'pdf'}
              disabled={loading || !data?.rows.length}
            >
              {downloading !== 'pdf' && <FileText />}
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState description={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Summary tiles */}
          {data && data.summary.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {data.summary.map((item) => (
                <Card key={item.label} className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1.5 truncate text-xl font-semibold tracking-tight">
                    {item.value}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* Chart for booking statistics */}
          {report === 'bookings' && data?.chart && data.chart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bookings over time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 10,
                          fontSize: 12,
                          color: 'hsl(var(--popover-foreground))',
                        }}
                        cursor={{ fill: 'hsl(var(--muted))' }}
                      />
                      <Bar dataKey="completed" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="cancelled" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data table */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">{data?.title || current?.label}</CardTitle>
              <CardDescription>{data?.subtitle || current?.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!data?.rows.length ? (
                <EmptyState
                  icon={BarChart3}
                  title="No data for this period"
                  description="Try widening the date range."
                  className="border-0 py-14"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-y border-border bg-muted/50">
                      <tr className="text-left">
                        {data.columns.map((column) => (
                          <th
                            key={column.key}
                            scope="col"
                            className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground"
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.rows.slice(0, 100).map((row, index) => (
                        <tr key={index} className="transition-colors hover:bg-muted/40">
                          {data.columns.map((column) => {
                            const value = row[column.key];
                            return (
                              <td key={column.key} className="whitespace-nowrap px-4 py-2.5">
                                {value === null || value === undefined || value === '' ? (
                                  <span className="text-muted-foreground">—</span>
                                ) : typeof value === 'number' ? (
                                  value.toLocaleString('en-IN')
                                ) : (
                                  String(value)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {data.rows.length > 100 && (
                    <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Showing the first 100 of {data.rows.length.toLocaleString('en-IN')} rows.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => download('csv')}>
                        <Download />
                        Download all
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
