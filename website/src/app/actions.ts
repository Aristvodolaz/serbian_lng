'use server';

import { notifyWaitlist } from '@/lib/telegram';
import { validateWaitlist, type WaitlistErrors } from '@/lib/validate';

export type WaitlistState =
  | { status: 'idle' }
  | { status: 'ok' }
  | { status: 'error'; errors?: WaitlistErrors; server?: boolean; email: string };

// Works without JavaScript too: the form posts here and the page re-renders with the result.
export async function joinWaitlist(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const result = validateWaitlist({
    email: formData.get('email'),
    consent: formData.get('consent'),
    website: formData.get('website'),
  });
  // Keep what the person typed: React clears uncontrolled fields after an action.
  const typed = String(formData.get('email') ?? '').trim();
  if (!result.ok) return { status: 'error', errors: result.errors, email: typed };
  if (result.isBot) return { status: 'ok' };

  const sent = await notifyWaitlist(result.email);
  return sent ? { status: 'ok' } : { status: 'error', server: true, email: typed };
}
