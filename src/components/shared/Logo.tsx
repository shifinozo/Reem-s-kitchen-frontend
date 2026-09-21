import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The brand mark, swapped for the active theme.
 *
 * Both artwork files carry their own rounded tile background — the dark-on-light
 * mark for light mode, the light-on-dark mark for dark mode — so this renders no
 * wrapper of its own. Anything placing it inside a coloured box would show a
 * tile inside a tile.
 *
 * Both images are always in the DOM and CSS picks one via the `dark` class on
 * <html>. Choosing in JS instead would either mismatch during hydration or flash
 * the wrong mark on first paint, since the theme is only known on the client.
 */
export function Logo({
  size = 36,
  className,
  priority = false,
  variant = 'auto',
}: {
  /** Rendered edge length in px; the source art is square. */
  size?: number;
  className?: string;
  /** Set on above-the-fold marks so Next preloads rather than lazy-loads. */
  priority?: boolean;
  /**
   * 'auto' follows the theme. Use 'on-dark' on surfaces that stay dark in both
   * themes — the admin sidebar — where the theme-following mark would turn
   * black-on-near-black in light mode.
   */
  variant?: 'auto' | 'on-dark' | 'on-light';
}) {
  const common = {
    width: size,
    height: size,
    priority,
    // Fixed-size UI chrome, never a responsive image. Omitting `sizes` keeps
    // Next on the width/height pair above; setting it makes Next fall back to
    // its widest breakpoint and fetch a 3840px file for a ~36px mark.
    style: { width: size, height: size },
    className: 'rounded-[22%] object-contain',
  };

  if (variant !== 'auto') {
    // A surface with a fixed brightness needs the mark that contrasts with it,
    // regardless of the page theme.
    const src = variant === 'on-dark' ? '/logo-light.png' : '/logo-dark.png';
    return (
      <span
        className={cn('relative inline-block shrink-0', className)}
        style={{ width: size, height: size }}
      >
        <Image src={src} alt="Reem's Kitchen" {...common} />
      </span>
    );
  }

  return (
    <span
      className={cn('relative inline-block shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo-dark.png"
        alt="Reem's Kitchen"
        {...common}
        className={cn(common.className, 'block dark:hidden')}
      />
      <Image
        src="/logo-light.png"
        alt=""
        aria-hidden
        {...common}
        className={cn(common.className, 'hidden dark:block')}
      />
    </span>
  );
}
