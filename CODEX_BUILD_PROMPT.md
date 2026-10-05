# StudesQ implementation task

Continue the existing application on branch `import/claude-source-2026-10-05` in `Smarcastic/studesq-mvp`. Read `IMPORT_REVIEW.md`, the schema, auth, API routes, and UI before editing. This branch imports the user's actual Claude-built source; main contains an older, smaller MVP. Do not merge incompatible root `app/` files from the old MVP into this `src/app/` project.

## Product goal

Build a genuinely usable Student Growth & Academic Operating System around **Plan → Study → Improve → Achieve → Prove → Grow**. Connect planning, study sessions, exam preparation, grades, achievements and evidence, extracurricular activities, goals, applications, and opportunities into one student journey. Prioritize completing this loop over adding more standalone pages.

Include a **school-specific events marketplace**. Existing marketplace code is a general opportunities directory; school membership, event visibility, and authorization must be implemented and tested. Use stable school IDs and server-side membership checks rather than trusting a client filter or school name supplied by a request. Distinguish global opportunities from school-only events. Support discovery, saving, registration/application status, and adding deadlines to a student's plan. Define a controlled organizer approval flow.

## Work to complete

1. Establish a reproducible local setup using the lockfile, an example environment file, generated Prisma client, and a fresh disposable database. Validate the actual commands; do not blindly follow DATABASE.md's outdated migration instructions. Use Node 22 LTS or another version supported by the installed dependencies. Add setup/generate/seed scripts where necessary. Never commit secrets, local databases, user uploads, node_modules, or generated Prisma output.
2. Run lint, type checks, and a production build. Fix actual failures without suppressing diagnostics globally or weakening types. Add meaningful tests for behavior and authorization; report commands and results.
3. Test a real journey: register/sign in → create a task and exam goal → complete a linked study session → record a result and identify a weak topic → plan targeted revision → add an achievement and evidence → track progress toward a growth/application goal. Persist edits, reload them, handle empty/error/loading states, and ensure users cannot access another user's records.
4. Finish the school marketplace with authorization tests covering same-school access, cross-school denial, global event access, and organizer permissions. Use explicitly fictional demo events rather than presenting seeded competition dates/prizes as verified current facts.
5. Review authentication, password reset, verification permissions, public profiles, parent access, uploads, social/chat APIs, and privacy defaults before any real-user rollout. Password reset currently logs a development link instead of sending email. Uploads currently write into public/uploads; private evidence needs protected delivery and ownership checks. Avoid demo accounts and credentials in production.
6. Make the core flow comfortable on mobile and desktop: accessible forms, keyboard navigation, useful feedback, and usable navigation. Preserve useful existing UI and components; do not replace the app with a landing page or blanket rewrite.
7. Document a deployable private web-app path. Local SQLite and filesystem uploads need a deliberate persistent hosting strategy or migration to a supported hosted database and private object storage. Do not create paid services, send email, publish publicly, or modify production without explicit authorization. If credentials are missing, finish the code and document the exact required configuration.

## Scope discipline

The source includes chat, groups, social features, leaderboards, habits, wellness, and reading tools. Preserve existing work but treat expansion of those as secondary until the core student loop works. Flag significant product choices with a recommendation and tradeoff; do not silently remove major features. The earlier repo handoff excluded academic tools, but that is superseded by the user's current academic operating-system scope.

The existing AI engine uses deterministic local rules. Describe them honestly. Do not introduce a paid AI API or fabricate AI outputs. If model-backed assistance would help, identify the precise use case and make it optional with a safe fallback and explicit configuration.

iPhone support is a later packaging milestone. First stabilize the backend and responsive app; document whether Capacitor or a native client can reuse it. Do not claim an App Store-ready build without signing, device testing, and the necessary Apple tooling.

## Delivery

Work on a new feature branch from the import branch. Implement, test, and produce a reviewable PR without merging to main. Finish with: what now works, tests and their results, unresolved blockers/product choices, private preview URL if one actually exists, and exactly the next three priorities. Clearly distinguish implemented, tested, and planned behavior. Do not call the application complete while core flows or authorization are unverified.
