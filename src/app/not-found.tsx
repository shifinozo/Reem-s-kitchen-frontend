import Link from 'next/link';
import { ChefHat, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/30 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
        <ChefHat className="h-6 w-6 text-primary-foreground" aria-hidden />
      </div>

      <p className="mt-6 text-sm font-semibold text-primary">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you are looking for does not exist, or you may not have access to it.
      </p>

      <Button className="mt-6" asChild>
        <Link href="/">
          <Home />
          Back to home
        </Link>
      </Button>
    </div>
  );
}
