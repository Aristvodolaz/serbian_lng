// Server-side checks for the waitlist form. Pure functions, no I/O.

export type EmailError = 'empty' | 'invalid';
export type WaitlistErrors = { email?: EmailError; consent?: 'required' };

export type WaitlistResult =
  | { ok: true; email: string; isBot: boolean }
  | { ok: false; errors: WaitlistErrors };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL = 254;

export function validateWaitlist(input: { email: unknown; consent: unknown; website: unknown }): WaitlistResult {
  // A filled honeypot means a bot: report success without sending anything.
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return { ok: true, email: '', isBot: true };
  }

  const errors: WaitlistErrors = {};
  const email = typeof input.email === 'string' ? input.email.trim() : '';

  if (!email) errors.email = 'empty';
  else if (email.length > MAX_EMAIL || !EMAIL.test(email)) errors.email = 'invalid';

  if (input.consent !== 'on') errors.consent = 'required';

  if (errors.email || errors.consent) return { ok: false, errors };
  return { ok: true, email, isBot: false };
}
