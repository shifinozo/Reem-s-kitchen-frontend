import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

/** Shared shell for login / signup / invite screens. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={36} priority />
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Reem&apos;s Kitchen</p>
              <p className="text-[11px] text-muted-foreground">Staff Management</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        {children}
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Reem&apos;s Kitchen
      </footer>
    </div>
  );
}
