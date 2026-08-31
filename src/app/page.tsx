'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarCheck,
  ChefHat,
  ClipboardList,
  QrCode,
  ShieldCheck,
  Star,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { homeRouteForRole } from '@/lib/utils';

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Work listings',
    body: 'Publish events with staffing needs, reporting times and pay. Staff apply in a tap.',
  },
  {
    icon: CalendarCheck,
    title: 'Conflict-free scheduling',
    body: 'Overlapping bookings are blocked automatically, so nobody is double-booked.',
  },
  {
    icon: QrCode,
    title: 'QR attendance',
    body: 'Staff scan at the venue. Check-ins, late arrivals and no-shows are tracked live.',
  },
  {
    icon: Wallet,
    title: 'Payment tracking',
    body: 'Move payments from pending to paid, and let staff see their own earnings history.',
  },
  {
    icon: Star,
    title: 'Ratings & performance',
    body: 'Score attendance, punctuality, performance and behaviour after every event.',
  },
  {
    icon: ShieldCheck,
    title: 'Approved staff only',
    body: 'Every registration is reviewed by an admin before work listings become visible.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, initialising, bootstrap } = useAuthStore();

  // Send an already-signed-in visitor straight to their dashboard.
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!initialising && user) router.replace(homeRouteForRole(user.role));
  }, [user, initialising, router]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <ChefHat className="h-5 w-5 text-primary-foreground" aria-hidden />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Reem&apos;s Kitchen</p>
              <p className="text-[11px] text-muted-foreground">Staff Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Join as staff</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent)]"
            aria-hidden
          />
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                Catering staff &amp; booking management
              </span>

              <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Staff every event without the{' '}
                <span className="text-primary">phone-call chaos</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                Post work, let approved catering staff book themselves in, and track
                attendance, payments and performance — all in one place.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Create a staff account
                    <ArrowRight className="ml-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Admin log in</Link>
                </Button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Admin accounts are invitation-only.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything the operation needs
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted-foreground">
              Built for catering teams that juggle dozens of staff across
              weddings, corporate events and festivals.
            </p>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              How a booking flows
            </h2>

            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { step: 'Available', body: 'Admin publishes the work' },
                { step: 'Applied', body: 'Staff apply from their phone' },
                { step: 'Confirmed', body: 'Admin approves the booking' },
                { step: 'Checked In', body: 'Staff scan the event QR code' },
                { step: 'Completed', body: 'Rated and paid' },
              ].map((item, index) => (
                <li key={item.step} className="relative rounded-xl border border-border bg-card p-4">
                  <span className="text-xs font-semibold text-primary">
                    Step {index + 1}
                  </span>
                  <p className="mt-1 text-sm font-semibold">{item.step}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Reem&apos;s Kitchen. Catering staff &amp; booking management.
        </div>
      </footer>
    </div>
  );
}
