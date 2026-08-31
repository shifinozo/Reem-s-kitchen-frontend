'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkForm } from '@/components/admin/WorkForm';
import { ErrorState } from '@/components/shared/EmptyState';
import { useFetch } from '@/hooks/useApi';
import type { Work } from '@/types';

export default function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error, refetch } = useFetch<{ work: Work }>(`/works/${id}`);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/admin/works/${id}`}>
            <ArrowLeft />
            Back to work
          </Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Edit work</h1>
        {data?.work && (
          <p className="mt-0.5 text-sm text-muted-foreground">{data.work.title}</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : error || !data?.work ? (
        <ErrorState title="Work not found" description={error?.message} onRetry={refetch} />
      ) : (
        <WorkForm work={data.work} />
      )}
    </div>
  );
}
