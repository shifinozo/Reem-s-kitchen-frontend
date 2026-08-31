'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { homeRouteForRole } from '@/lib/utils';
import type { Role } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Roles permitted on this branch of the app. */
  allow: Role[];
}

/**
 * Client-side route guard.
 *
 * The server enforces authorisation on every endpoint — this only prevents a
 * signed-out or wrong-role user from seeing a shell they cannot use, and
 * redirects them somewhere sensible.
 */
export function AuthGuard({ children, allow }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialising, bootstrap } = useAuthStore();

  useEffect(() => {
    if (initialising) void bootstrap();
  }, [initialising, bootstrap]);

  useEffect(() => {
    if (initialising) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!allow.includes(user.role)) {
      router.replace(homeRouteForRole(user.role));
    }
  }, [user, initialising, allow, router, pathname]);

  if (initialising || !user || !allow.includes(user.role)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
