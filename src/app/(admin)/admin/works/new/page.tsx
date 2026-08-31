'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { WorkForm } from '@/components/admin/WorkForm';

export default function CreateWorkPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/works">
            <ArrowLeft />
            Back to works
          </Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Create work</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Post a new catering job for staff to apply to.
        </p>
      </div>

      <WorkForm />
    </div>
  );
}
