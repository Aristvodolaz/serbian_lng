import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWaitlist } from './validate.ts';

const ok = { email: 'name@example.com', consent: 'on', website: '' };

test('accepts a valid email with consent', () => {
  assert.deepEqual(validateWaitlist(ok), { ok: true, email: 'name@example.com', isBot: false });
});

test('trims surrounding spaces from the email', () => {
  const r = validateWaitlist({ ...ok, email: '  name@example.com  ' });
  assert.equal(r.ok && r.email, 'name@example.com');
});

test('reports an empty email', () => {
  assert.deepEqual(validateWaitlist({ ...ok, email: '   ' }), { ok: false, errors: { email: 'empty' } });
  assert.deepEqual(validateWaitlist({ ...ok, email: undefined }), { ok: false, errors: { email: 'empty' } });
});

test('rejects malformed emails', () => {
  for (const email of ['name@', '@example.com', 'a b@example.com', 'name@example', 'name@example.c']) {
    assert.deepEqual(validateWaitlist({ ...ok, email }), { ok: false, errors: { email: 'invalid' } }, email);
  }
});

test('rejects an email longer than 254 characters', () => {
  const email = `${'a'.repeat(250)}@b.cd`;
  assert.deepEqual(validateWaitlist({ ...ok, email }), { ok: false, errors: { email: 'invalid' } });
});

test('requires the consent checkbox', () => {
  assert.deepEqual(validateWaitlist({ ...ok, consent: null }), { ok: false, errors: { consent: 'required' } });
  assert.deepEqual(validateWaitlist({ ...ok, consent: 'off' }), { ok: false, errors: { consent: 'required' } });
});

test('reports both errors at once', () => {
  assert.deepEqual(validateWaitlist({ email: '', consent: null, website: '' }), {
    ok: false,
    errors: { email: 'empty', consent: 'required' },
  });
});

test('treats a filled honeypot as a bot and skips validation', () => {
  assert.deepEqual(validateWaitlist({ email: 'nope', consent: null, website: 'http://spam' }), {
    ok: true,
    email: '',
    isBot: true,
  });
});
