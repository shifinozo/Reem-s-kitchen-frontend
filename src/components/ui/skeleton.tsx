import { cn } from '@/lib/utils';

/** Loading placeholder. Uses the shimmer utility from globals.css. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('shimmer rounded-md', className)}
      aria-hidden
      {...props}
    />
  );
}

/** Convenience: a block of stacked lines, e.g. a loading card body. */
function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-3.5', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText };
