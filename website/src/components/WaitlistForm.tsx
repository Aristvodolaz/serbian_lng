'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { joinWaitlist, type WaitlistState } from '@/app/actions';
import type { Lang } from '@/content';
import type { Dict } from '@/content/ru';

const initial: WaitlistState = { status: 'idle' };

export function WaitlistForm({ lang, t }: { lang: Lang; t: Dict['waitlist'] }) {
  const [state, action, pending] = useActionState(joinWaitlist, initial);

  if (state.status === 'ok') {
    return (
      <p role="status" className="rounded-plate bg-paper p-6 text-[20px] font-semibold text-success">
        {t.success}
      </p>
    );
  }

  const errors = state.status === 'error' ? state.errors : undefined;
  const emailError = errors?.email === 'empty' ? t.errors.emailEmpty : errors?.email === 'invalid' ? t.errors.emailInvalid : undefined;
  const consentError = errors?.consent ? t.errors.consent : undefined;

  return (
    <form
      action={action}
      noValidate
      aria-busy={pending}
      onSubmit={(e) => {
        // Ignore repeat submits while the first one is in flight.
        if (pending) e.preventDefault();
      }}
      className="max-w-prose"
    >
      <input type="hidden" name="lang" value={lang} />

      <div>
        <label htmlFor="email" className="block text-[17px] font-medium text-ink">
          {t.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={state.status === 'error' ? state.email : ''}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? 'email-error' : undefined}
          className="mt-2 block h-12 w-full rounded-control border-[1.5px] border-field bg-paper px-4 text-[17px] text-ink placeholder:text-ink-soft aria-[invalid=true]:border-danger"
        />
        {emailError && (
          <p id="email-error" className="mt-2 text-[15px] text-danger">
            {emailError}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and screen readers, bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-6">
        <div className="flex items-start gap-3">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            aria-invalid={consentError ? true : undefined}
            aria-describedby={consentError ? 'consent-error' : undefined}
            className="mt-1 h-6 w-6 shrink-0 accent-enamel"
          />
          <label htmlFor="consent" className="text-[17px]">
            {t.consent}{' '}
            <Link href={`/${lang}/consent`} className="link">
              {t.consentLink}
            </Link>
          </label>
        </div>
        {consentError && (
          <p id="consent-error" className="mt-2 text-[15px] text-danger">
            {consentError}
          </p>
        )}
      </div>

      {state.status === 'error' && state.server && (
        <p role="alert" className="mt-6 text-[15px] text-danger">
          {t.errors.server}
        </p>
      )}

      <button type="submit" className="btn-primary mt-8 w-full sm:w-auto">
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
