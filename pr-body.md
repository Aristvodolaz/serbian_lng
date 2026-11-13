## Summary
- `load-theory.mjs` read `access_token` from the login response, but the auth API returns `accessToken`, so the token stayed `undefined` and section listing crashed with `TypeError: data is not iterable`.
- Reads `accessToken` now and exits with a clear error if the login response has no token.
- With the fix, all 25 A1 theory topics from `theory.csv` loaded successfully on the dev server (25 created, 0 failed).

## Test plan
- [x] `BASE_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node backend/scripts/load-theory.mjs` — 25 created
- [ ] Run again on any environment (idempotent: should print 25 skipped)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
