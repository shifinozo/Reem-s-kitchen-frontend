import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, initials, resolveImageUrl } from '@/lib/utils';
import type { User } from '@/types';

interface UserAvatarProps {
  user?: Partial<Pick<User, 'fullName' | 'avatar'>> | null;
  className?: string;
  /** Adds a coloured ring — used to signal availability at a glance. */
  ring?: 'none' | 'available' | 'busy' | 'unavailable';
}

const RING_CLASSES = {
  none: '',
  available: 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background',
  busy: 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background',
  unavailable: 'ring-2 ring-slate-400 ring-offset-2 ring-offset-background',
} as const;

export function UserAvatar({ user, className, ring = 'none' }: UserAvatarProps) {
  const src = resolveImageUrl(user?.avatar?.url);

  return (
    <Avatar className={cn(RING_CLASSES[ring], className)}>
      {src && <AvatarImage src={src} alt={user?.fullName || 'Profile photo'} />}
      <AvatarFallback>{initials(user?.fullName)}</AvatarFallback>
    </Avatar>
  );
}
