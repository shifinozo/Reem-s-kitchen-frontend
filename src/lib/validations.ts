import { parseCoordsFromUrl } from '@/lib/maps';
import { z } from 'zod';

/* Client-side mirrors of the server schemas so users get instant feedback.
   The server remains the authority — these only improve the UX. */

const passwordRules = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'Cannot exceed 72 characters')
  .regex(/[a-z]/, 'Needs a lowercase letter')
  .regex(/[A-Z]/, 'Needs an uppercase letter')
  .regex(/[0-9]/, 'Needs a number');

const phoneRules = z
  .string()
  .min(7, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .regex(/^[0-9+\-\s()]+$/, 'Only digits, spaces, +, - and ( ) allowed');

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const staffSignupSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(80),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    phone: phoneRules,
    password: passwordRules,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    address: z.string().trim().max(300).optional().or(z.literal('')),
    city: z.string().trim().max(80).optional().or(z.literal('')),
    dateOfBirth: z
      .string()
      .min(1, 'Date of birth is required')
      .refine((value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return false;
        const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return age >= 16 && age <= 90;
      }, 'You must be at least 16 years old'),
    experienceYears: z.coerce.number().min(0, 'Cannot be negative').max(60, 'That seems too high'),
    experienceNote: z.string().trim().max(500).optional().or(z.literal('')),
    skills: z.array(z.string()).min(1, 'Select at least one skill or work type'),
    availabilityStatus: z.enum(['available', 'busy', 'unavailable']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type StaffSignupValues = z.infer<typeof staffSignupSchema>;

export const acceptInviteSchema = z
  .object({
    password: passwordRules,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type AcceptInviteValues = z.infer<typeof acceptInviteSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(80),
  phone: phoneRules,
  address: z.string().trim().max(300).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  experienceYears: z.coerce.number().min(0).max(60),
  experienceNote: z.string().trim().max(500).optional().or(z.literal('')),
  skills: z.array(z.string()).min(1, 'Select at least one skill'),
  availabilityStatus: z.enum(['available', 'busy', 'unavailable']),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Choose a password different from your current one',
    path: ['newPassword'],
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const workSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  eventType: z.string().min(1, 'Choose an event type'),
  description: z.string().trim().max(2000).optional().or(z.literal('')),

  eventDate: z.string().min(1, 'Choose the event date'),
  reportingTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use 24-hour HH:mm format'),
  durationHours: z.coerce
    .number()
    .min(1, 'At least 1 hour')
    .max(24, 'Cannot exceed 24 hours'),

  venue: z.string().trim().min(2, 'Venue is required').max(160),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  // A Google Maps share link. Coordinates are extracted from it server-side
  // so staff get an exact pin rather than a name search.
  mapUrl: z.string().url('Paste a valid map link').optional().or(z.literal('')),

  requiredStaff: z.coerce
    .number()
    .int('Enter a whole number')
    .min(1, 'At least 1 staff member')
    .max(500, 'Cannot exceed 500'),
  // Not optional: a divergent input/output type breaks the RHF resolver's generics.
  preferredSkills: z.array(z.string()),

  paymentAmount: z.coerce.number().min(0, 'Cannot be negative').max(10_000_000),
  paymentBasis: z.enum(['per_shift', 'per_hour']),
  paymentNote: z.string().trim().max(200).optional().or(z.literal('')),

  contactName: z.string().trim().max(80).optional().or(z.literal('')),
  contactPhone: z.string().trim().max(20).optional().or(z.literal('')),

  status: z.enum(['draft', 'published']),
});
export type WorkValues = z.infer<typeof workSchema>;

/** Maps the flat form shape back to the nested API payload. */
export function workValuesToPayload(values: WorkValues) {
  const coords = parseCoordsFromUrl(values.mapUrl || '');

  return {
    title: values.title,
    eventType: values.eventType,
    description: values.description || '',
    eventDate: values.eventDate,
    reportingTime: values.reportingTime,
    durationHours: values.durationHours,
    location: {
      venue: values.venue,
      address: values.address || '',
      city: values.city || '',
      mapUrl: values.mapUrl || '',
      // The server re-derives these from mapUrl too, so this is belt-and-braces
      // rather than the only path — but sending them keeps the optimistic UI
      // and the stored record in agreement.
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    },
    requiredStaff: values.requiredStaff,
    preferredSkills: values.preferredSkills || [],
    payment: {
      amount: values.paymentAmount,
      currency: 'INR',
      basis: values.paymentBasis,
      note: values.paymentNote || '',
    },
    contactPerson: {
      name: values.contactName || '',
      phone: values.contactPhone || '',
    },
    status: values.status,
  };
}

export const inviteAdminSchema = z.object({
  name: z.string().trim().min(2, 'Enter their name').max(80),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: phoneRules.optional().or(z.literal('')),
  role: z.enum(['event_manager', 'finance_manager', 'admin', 'super_admin']),
});
export type InviteAdminValues = z.infer<typeof inviteAdminSchema>;

export const ratingSchema = z.object({
  attendance: z.coerce.number().int().min(1, 'Rate 1–5').max(5),
  punctuality: z.coerce.number().int().min(1, 'Rate 1–5').max(5),
  performance: z.coerce.number().int().min(1, 'Rate 1–5').max(5),
  behaviour: z.coerce.number().int().min(1, 'Rate 1–5').max(5),
  feedback: z.string().trim().max(500).optional().or(z.literal('')),
});
export type RatingValues = z.infer<typeof ratingSchema>;

export const paymentSchema = z.object({
  status: z.enum(['pending', 'processing', 'paid']),
  amount: z.coerce.number().min(0).max(10_000_000).optional(),
  method: z.enum(['cash', 'upi', 'bank_transfer', 'cheque', 'other']).optional(),
  paidAt: z.string().optional().or(z.literal('')),
  reference: z.string().trim().max(120).optional().or(z.literal('')),
  note: z.string().trim().max(300).optional().or(z.literal('')),
});
export type PaymentValues = z.infer<typeof paymentSchema>;
