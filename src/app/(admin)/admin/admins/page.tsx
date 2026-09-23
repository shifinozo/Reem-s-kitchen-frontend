'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Check, Copy, Mail, Plus, ShieldCheck, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ADMIN_ROLE_OPTIONS, ROLE_LABELS, ROLE_META } from '@/lib/constants';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useFetch } from '@/hooks/useApi';
import { apiPost, apiDelete, toApiError } from '@/lib/api';
import { inviteAdminSchema, type InviteAdminValues } from '@/lib/validations';
import { formatDateTime, timeAgo } from '@/lib/utils';
import type { AdminInvite } from '@/types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  accepted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  expired: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  revoked: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
};

export default function ManageAdminsPage() {
  const { data, loading, error, refetch } = useFetch<{ invites: AdminInvite[] }>(
    '/auth/admin/invites',
  );

  const [inviteOpen, setInviteOpen] = useState(false);
  const [revoking, setRevoking] = useState<AdminInvite | null>(null);
  const [lastLink, setLastLink] = useState<{ email: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InviteAdminValues>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: { name: '', email: '', phone: '', role: 'admin' },
  });

  const sendInvite = async (values: InviteAdminValues) => {
    try {
      const response = await apiPost<{ invite: AdminInvite; acceptUrl: string }>(
        '/auth/admin/invites',
        values,
      );
      toast.success(response.message);
      // The link is returned once so it can be shared when email is not configured.
      setLastLink({ email: values.email, url: response.data.acceptUrl });
      setInviteOpen(false);
      reset();
      await refetch();
    } catch (caught) {
      const apiError = toApiError(caught);
      toast.error(apiError.message);
      if (apiError.errors) {
        for (const [field, message] of Object.entries(apiError.errors)) {
          setError(field as keyof InviteAdminValues, { message });
        }
      }
    }
  };

  const revokeInvite = async () => {
    if (!revoking) return;
    try {
      await apiDelete(`/auth/admin/invites/${revoking._id}`);
      toast.success('Invitation revoked');
      await refetch();
    } catch (caught) {
      toast.error(toApiError(caught).message);
      throw caught;
    }
  };

  const copyLink = async () => {
    if (!lastLink) return;
    try {
      await navigator.clipboard.writeText(lastLink.url);
      setCopied(true);
      toast.success('Invitation link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Administrators</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Invite administrators. There is no public admin signup.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Plus />
          Invite administrator
        </Button>
      </div>

      {/* Freshly issued link */}
      {lastLink && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium">
              Invitation link for {lastLink.email}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              An email was sent if SMTP is configured. Otherwise, share this link
              directly — it is shown only once and expires in 72 hours.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                readOnly
                value={lastLink.url}
                className="font-mono text-xs"
                onFocus={(event) => event.currentTarget.select()}
                aria-label="Invitation link"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyLink}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="ghost" onClick={() => setLastLink(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invitations</CardTitle>
          <CardDescription>
            Invited administrators set their own password from a single-use link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <ErrorState description={error.message} onRetry={refetch} />
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !data?.invites.length ? (
            <EmptyState
              icon={ShieldCheck}
              title="No invitations yet"
              description="Invite a colleague to help administer the system."
              action={
                <Button onClick={() => setInviteOpen(true)}>
                  <Plus />
                  Invite administrator
                </Button>
              }
              className="border-0"
            />
          ) : (
            <ul className="space-y-2.5">
              {data.invites.map((invite) => (
                <li
                  key={invite._id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{invite.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{invite.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <Badge variant="tone" className={ROLE_META[invite.role]?.className}>
                      {ROLE_LABELS[invite.role] ?? invite.role}
                    </Badge>
                    <Badge variant="tone" className={STATUS_STYLES[invite.status]}>
                      {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                    </Badge>

                    <span className="text-xs text-muted-foreground">
                      {invite.status === 'accepted'
                        ? `Joined ${timeAgo(invite.acceptedAt)}`
                        : invite.status === 'pending'
                          ? `Expires ${formatDateTime(invite.expiresAt, 'dd MMM, h:mm a')}`
                          : `Sent ${timeAgo(invite.createdAt)}`}
                    </span>

                    {invite.status === 'pending' && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setRevoking(invite)}
                        aria-label={`Revoke invitation for ${invite.email}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite an administrator</DialogTitle>
            <DialogDescription>
              They receive a single-use link to set their own password. The
              invitation expires in 72 hours.
            </DialogDescription>
          </DialogHeader>

          <form
            id="invite-admin-form"
            onSubmit={handleSubmit(sendInvite)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="invite-name" required>
                Full name
              </Label>
              <Input id="invite-name" error={Boolean(errors.name)} {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email" required>
                Email address
              </Label>
              <Input
                id="invite-email"
                type="email"
                error={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-phone">Phone</Label>
                <Input
                  id="invite-phone"
                  type="tel"
                  error={Boolean(errors.phone)}
                  {...register('phone')}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role" required>
                  Role
                </Label>
                <Select
                  value={watch('role')}
                  onValueChange={(value) => setValue('role', value as InviteAdminValues['role'])}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Describes whichever role is selected, so the consequences of
                the choice are visible before the invitation is sent. */}
            <p className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
              {ADMIN_ROLE_OPTIONS.find((option) => option.value === watch('role'))?.description}
            </p>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" form="invite-admin-form" loading={isSubmitting}>
              Send invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {revoking && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setRevoking(null)}
          title={`Revoke the invitation for ${revoking.email}?`}
          description="The link will stop working immediately. You can send a new invitation later."
          confirmLabel="Revoke invitation"
          variant="destructive"
          onConfirm={revokeInvite}
        />
      )}
    </div>
  );
}
