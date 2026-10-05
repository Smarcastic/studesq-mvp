# Claude source import — 5 October 2026

## Provenance and comparison

Imported from the user-provided `StudesQ.zip`. Primary source is the archive's top-level `StudesQ/` project. The nested Claude worktree is an older variant: its schema lacks the social and marketplace models present in the top-level source. It was not mixed into the import.

The existing `main` at `c919ee4b7ea7fd6972e849c7be53543a1930a612` is a different, smaller Next.js 14 MVP using root `app/`. This branch replaces its working tree with the supplied Next.js 16 source using `src/app/`. The old implementation remains recoverable in main and parent history. This is a source snapshot and handoff, not a completed migration or release.

Excluded from the import: nested worktree and Claude settings, Git history, generated Prisma client, local SQLite database, uploaded user images, dependency/build caches, and secret environment files. Kept schema, seed, source, configuration, lockfile, example environment, and bundled static assets. A pattern scan found no common API-key/private-key formats in retained files; this is not a guarantee against every possible credential format.

## Actual implementation present

- Next.js 16.1.6, React 19.2.3, TypeScript, Tailwind 4.
- Prisma 7 with SQLite and better-sqlite3 adapter; generated client deliberately excluded.
- Credentials authentication, optional Google provider, registration and password-reset routes.
- Dashboard, calendar, assignments, goals, grades, exam topics, study timer/session logging, notes, flashcards and study analytics.
- Achievement evidence and verification routes, profiles, documents, timelines, application tracking and opportunities.
- General marketplace listings, saves, application/recommendation routes; also social, chat, groups, leaderboards, wellness, habits, and reading pages.

These are observed files and code paths, not a claim that every interaction works end to end.

## Findings and unresolved product decisions

1. The core growth loop needs end-to-end validation and clearer links between planning, sessions, results, revision, achievements, and longer-term goals.
2. Marketplace listing queries filter approved events globally. No school membership/tenant isolation was observed in the reviewed list route and schema. School-specific events remain a real implementation gap.
3. `src/lib/ai-engine.ts` contains deterministic text patterns and rules, not an external AI model integration. Product wording should match that behavior.
4. `src/lib/prisma.ts` hardcodes the database at root `dev.db`; DATABASE.md instead claims `prisma/dev.db`. Its production guidance must be checked against the actual Prisma 7 configuration.
5. Uploads write to `public/uploads/<userId>` and return public URLs. This is inadequate for private student evidence and unsuitable for ephemeral hosting without persistent storage.
6. Password-reset delivery logs the link in development; a real email delivery path is still needed. Only student/parent registration is offered, while verification expects an admin role. Clarify administrator provisioning and parent access.
7. Existing social/chat/groups/leaderboards are substantial additional scope. Decide their priority relative to the core academic loop rather than expanding everything at once.
8. Seeded marketplace opportunity descriptions, deadlines, and prizes must not be treated as verified current external facts. Use clearly labeled demo data or maintain an independently verified catalog.
9. No test script or test suite was found in the supplied package/source. Add meaningful integration and authorization coverage.

## Validation during import

- Original `npm ci --ignore-scripts` failed: lockfile missing/inconsistent floating-ui packages.
- Repaired lockfile using `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`; no application feature rewrite.
- `npm ci --ignore-scripts --no-audit --no-fund`: passed (636 packages).
- `DATABASE_URL=file:./dev.db npx prisma generate`: passed.
- `npm rebuild better-sqlite3`: passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: failed with 66 errors and 66 warnings, including render purity/hooks issues. Resolve rather than globally disabling rules.
- `DATABASE_URL=file:./dev.db npm run build`: blocked because next/font could not fetch Inter from Google Fonts in this environment. This does not establish whether the complete production build otherwise passes; retry with network access or bundled fonts.
- Runtime journeys, user isolation, browser behavior, and native iPhone builds were not validated during this import.

## Next three priorities

1. Establish clean reproducible setup, resolve lint/build issues, and test authentication plus ownership restrictions.
2. Validate and connect one complete Plan → Study → Improve → Achieve → Prove → Grow student journey.
3. Implement school-scoped marketplace membership/visibility and protected evidence storage before a real-user launch.

Use `CODEX_BUILD_PROMPT.md` for the next implementation task. Do not publish publicly or merge this branch without the user's direction.
