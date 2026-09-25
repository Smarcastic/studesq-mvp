# STUDESQ product and engineering roadmap

Status: working proposal, 25 September 2026. This document evaluates commit `c919ee4` against the current STUDESQ product brief. It does not certify the application for deployment.

## Decision

Keep the long-term mission: **Plan → Study → Improve → Achieve → Prove → Grow**. Make the first useful product a **personal exam-preparation loop**: a student enters an exam and its topics, sees a clear next action, studies that topic, and sees the plan update. Build the persistent achievement record after that daily loop earns repeat use.

The positioning for the first release is: **Know what to revise next, do the work, and see what still needs attention.** The larger student growth operating system remains the direction, not the first release's feature checklist.

Established planners already offer assignments, exam plans, revision tasks, timers, grade tracking, and parent views. A long feature list is not a reason to switch. STUDESQ must make the connection between an upcoming exam, topic progress, actual study, and the next recommended action noticeably better and easier to use.

## What exists in this repository

The current app is an early achievement-profile prototype. It contains a landing page, profile, achievements, timeline, sample opportunities, parent view components, reusable UI, mock and Google authentication paths, SQLite/Prisma models, and utility smoke tests. It does not contain models or working flows for subjects, exams, topics, assignments, focus sessions, or revision progress. The dashboard shows achievement activity, not a daily academic plan.

The existing `HANDOFF.md` describes an older **trust-first achievement tracking** MVP and explicitly excludes homework tracking. Its scope conflicts with the current product brief. Treat this roadmap and the brief as product direction; retain `HANDOFF.md` as historical context until its useful setup instructions are incorporated elsewhere.

### Findings to resolve before a student pilot

| Priority | Finding | Evidence in repository | Required outcome |
| --- | --- | --- | --- |
| Blocker | `npx prisma generate` fails: the pinned Prisma 5.22.0 SQLite connector rejects `UserRole` and `AchievementType` enums (`P1012`). | `prisma/schema.prisma`, `package.json` | Choose a supported local and production database strategy, adjust schema, generate the client, and make a repeatable setup. |
| Blocker | The repository pins Next.js 14.2.18, below the patched 14.x version in the December 2025 Next.js security advisory. | `package.json` | Upgrade to a supported patched release with React and other dependencies checked together; run build and regression checks. |
| Blocker | Mock authentication is the default and accepts a listed demo email with no password. | `lib/constants.ts`, `app/api/auth/mock-signin/route.ts` | Make demo access unavailable in any real-user environment; verify real sign-in and ownership checks. |
| Blocker | Uploaded certificates go under `public/uploads`; the protected API download route cannot protect a public URL. Local filesystem writes also do not provide durable deployment storage. | `lib/upload.ts`, `app/api/uploads/[studentId]/[...path]/route.ts` | Store evidence privately outside the public web root; authorize every download and verify access with another user's account. |
| High | OAuth uses `PrismaAdapter`, but the schema does not define the usual adapter account/session/verification models. The flow needs an end-to-end check before it can be trusted. | `app/api/auth/[...nextauth]/route.ts`, `prisma/schema.prisma` | Select one supported auth implementation and test first sign-in, repeat sign-in, logout, and new-profile creation. |
| High | Profile save is a placeholder; several visible actions appear wired only as UI. | `app/profile/page.tsx`, `app/dashboard/page.tsx` | Every primary control saves or navigates correctly, or is removed until available. |
| High | An achievement has one `certificatePath`, no evidence history, review decision, verifier, or scope of verification. | `prisma/schema.prisma` | Keep claims self-reported until a separately recorded review supports a precise verified statement. |
| High | The opportunities page says all listings are verified and updated weekly without a checking workflow in the data model. | `app/opportunities/page.tsx`, `prisma/schema.prisma` | Remove unsupported claims or implement source and review timestamps. |
| High | Current tests cover utilities but no end-to-end or authorization behavior. | `tests/smoke.test.ts` | Verify the core student path and cross-account isolation. |

The Prisma failure was reproduced locally after dependency installation. A successful production build and browser run have not been established. There is no committed lockfile; commit one after dependency selection so builds are reproducible.

## Proposed first release

### One complete workflow

1. A student chooses a school level and adds subjects.
2. The student adds one exam with a date, relevant topics, and rough confidence per topic. Manual entry must be fast; document import is later.
3. The dashboard recommends a **specific topic and a practical session length**, showing its reason: deadline, unfinished work, and the student's available time. The student can choose another topic.
4. A focus session records the topic, actual duration, and whether work was completed. Elapsed time alone must never imply mastery.
5. A short recall check or confidence update changes topic status. The dashboard and exam progress then recalculate.
6. The student can edit or delete inaccurate entries and export their data.

Assignments may join the first release if student interviews show they are necessary for daily planning. Notes, full flashcard authoring, grades, XP, streaks, and cosmetic themes are secondary until the six-step workflow is excellent.

### Suggested data model

`User → StudentProfile → Subject → Topic`; `Exam → ExamTopic → Topic`; `Assignment → Subject/Topic`; `StudySession → Subject/Topic/Exam`; `TopicProgress → student + topic + confidence + last reviewed`; `Recommendation → calculated from current data` (persist only if needed to explain or audit changes).

Later add `Achievement`, `Evidence`, `VerificationReview`, and `ShareGrant` separately. A review should record **who checked what, against which source, when, and with what result**. `Evidence attached` and `verified` are distinct states.

Build as one modular Next.js application with clear feature folders and shared authorization and data rules. Use deterministic scheduling and progress calculations. Avoid microservices, a marketplace, and a model call for every dashboard visit.

## Work sequence and acceptance gates

### 0. Stabilize the foundation

- Choose the database target and fix the schema so client generation, local setup, and an optimized build pass. Keep a reproducible lockfile and reviewed migrations.
- Upgrade vulnerable dependencies in a focused change. Resolve the server/client component boundary in the profile editor and wire or remove placeholder actions.
- Choose one real authentication path. Lock out demo accounts outside local development. Add user-scoped queries and tests for unauthorized reads, writes, and downloads.
- Put uploads in private durable storage, with validated size and content and access checked on every read. Keep student data private by default.
- Establish an isolated staging environment with backups and a restore exercise before storing real student records.

**Gate:** fresh checkout can start, migrate, seed only a local demo, build, and pass a browser journey without manual code edits. Two different student accounts cannot access each other's records.

### 1. Validate the daily study loop

- Implement fast onboarding, subjects, exams, topics, topic progress, a dashboard recommendation with an explanation, and topic-linked focus sessions.
- Support editing, deleting, empty states, mobile layout, keyboard access, and useful errors.
- Instrument only the events needed to learn: exam created, first recommendation viewed, first linked session completed, return study session. Do not capture sensitive note contents in analytics.

**Gate:** a new student can set up an exam in a few minutes, finish a topic-linked session, refresh or sign out and back in, and see the correct updated plan. Validate the recommendation rules with examples involving close deadlines, incomplete topics, and skipped sessions.

### 2. Pilot with actual students

- Recruit roughly 10–15 students in one school level or exam context for four weeks. Obtain the appropriate permission and privacy setup before collecting minors' records.
- Observe setup and a study session without coaching; ask what they would otherwise use and what they missed or distrusted.
- Review weekly: how many got to the first useful recommendation, completed a linked session, returned unprompted, and said the recommendation improved their decision. Track reasons for abandonment and manual-data burden.

**Gate:** repeat use and qualitative evidence justify the next feature. No single signup count or survey compliment counts as product validation. If setup is the main obstacle, fix it before adding features.

### 3. Build the lasting academic record

- Add structured achievements and timeline, multiple evidence items, private storage, precise sharing controls, export, and review history.
- Begin with `self-reported` and `evidence attached`. Introduce `verified` only when a real checking process exists and the UI states exactly what was checked.
- Test permission changes, revoked links, deletion/export, and evidence access from every role.

**Gate:** a student can retrieve an accurate record months later and share only selected parts, with no ambiguous badges.

### 4. Expand only on evidence

- Add syllabus import if manual topic entry is the main barrier; confirm extracted dates/topics before saving.
- Add flashcards or recall tools if topic progress needs better evidence; add assignments if they repeatedly drive the next-action decision.
- Add opportunities when there is a reliable sourcing and freshness process. Add institutional verification only when organizations will participate.
- Consider parents and social features separately because their permissions and safeguarding needs are substantial.

## Product risks and changes to the brief

1. **Three different usage rhythms:** a study planner is used daily, achievements are recorded occasionally, and applications are seasonal. Keep one long-term data model but do not force every layer into a daily dashboard.
2. **Manual entry is the adoption threat:** make the first exam useful with a small amount of input. Test whether students abandon setup before expecting years of data.
3. **Time is not learning:** focus duration is activity data. Use topic completion, confidence, and later recall results carefully; never promise a reliable mastery score from timer minutes.
4. **Verification is an operation, not a badge:** certificates can be misleading or altered. Make the review process explainable and initially narrow.
5. **Portability beats lock-in:** students should be able to export and correct their record. Account value should come from usefulness and trust, not difficulty leaving.
6. **Global grades can wait:** store flexible assessment results later without making GPA the foundation of a product aimed at multiple school systems.
7. **Distribution is part of the product:** interview peers and try a small cohort before planning school sales, paid tiers, or a two-sided opportunity marketplace.

## Decisions required before implementing phase 1

- First cohort: recommend students in grades 9–10 preparing for subject exams, starting with one school/exam context.
- First promise: recommend a specific next revision action and keep exam progress accurate.
- Backend target and identity provider: choose after the phase 0 comparison, considering privacy, deployment, cost, and migration effort.
- Pilot access: invite-only, private records, and no public portfolios or social features.

## References

- Product brief: STUDESQ — Product Brief, supplied 25 September 2026.
- [MyStudyLife product features](https://mystudylife.com/tour/) show overlap in planner, revision, timer, and parent functions.
- [Next.js December 2025 security update](https://nextjs.org/blog/security-update-2025-12-11) lists patched versions for the 14.x line.
- [Vercel function filesystem](https://vercel.com/docs/functions/runtimes) describes the read-only deployment filesystem and temporary scratch space.
- [Prisma database feature matrix](https://www.prisma.io/docs/orm/reference/database-features) notes SQLite enum support was introduced after the version pinned here.
