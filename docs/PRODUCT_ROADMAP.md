# STUDESQ product and engineering roadmap

Status: working proposal, 25 September 2026. This document evaluates commit `c919ee4` against the current STUDESQ product brief. It does not certify the application for deployment.

## Decision

Keep the long-term mission: **Plan → Study → Improve → Achieve → Prove → Grow**. STUDESQ is a **school-life and student-growth platform**, with connected academic planning, school activities and events, and a lasting record of participation and achievement. Studying is one important loop, not the whole product.

The first release should make two promises: **know what needs attention academically** and **discover relevant things happening at your school or other eligible schools**. A simple growth record connects these experiences. The full marketplace and verification system will grow from observed use of those loops.

Established planners already offer assignments, exam plans, revision tasks, timers, grade tracking, and parent views. A long feature list is not a reason to switch. STUDESQ's opportunity is the connection between a student's academic work, real school events, participation, and a credible history they control. The student must get useful results quickly in both daily planning and event discovery.

## What exists in this repository

The current app is an early achievement-profile prototype. It contains a landing page, profile, achievements, timeline, sample opportunities, parent view components, reusable UI, mock and Google authentication paths, SQLite/Prisma models, and utility smoke tests. It does not contain models or working flows for subjects, exams, topics, assignments, focus sessions, or revision progress. Its `Opportunity` model is a generic list with no school, organizer, eligibility, registration, or event status. The dashboard shows achievement activity, not a daily academic plan or school events.

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

The first release has **two connected entry points**: a student study plan and a curated school-event feed. It does not need a self-service platform for every school at launch. Pilot events can be published by the STUDESQ team with the school's or organizer's permission and labelled with their real source.

### One complete workflow

1. A student chooses a school level and adds subjects.
2. The student adds one exam with a date, relevant topics, and rough confidence per topic. Manual entry must be fast; document import is later.
3. The dashboard recommends a **specific topic and a practical session length**, showing its reason: deadline, unfinished work, and the student's available time. The student can choose another topic.
4. A focus session records the topic, actual duration, and whether work was completed. Elapsed time alone must never imply mastery.
5. A short recall check or confidence update changes topic status. The dashboard and exam progress then recalculate.
6. The student can edit or delete inaccurate entries and export their data.

Assignments may join the first release if student interviews show they are necessary for daily planning. Notes, full flashcard authoring, grades, XP, streaks, and cosmetic themes are secondary until the core workflows are excellent.

### School events and activity discovery

1. A student belongs to a school (or selects one during a tightly controlled pilot).
2. Their feed shows school-specific events plus interschool events for which they are eligible. Examples include competitions, MUNs, sports, workshops, clubs, performances, volunteering, and school programs.
3. Every event has an organizer, source, dates, venue or online link, eligibility, registration deadline, and clear action such as saving the event or following the organizer's registration link.
4. The student can save an event and optionally track an application or registration. A registration status is never silently treated as attendance.
5. After participation, the student can add the activity to their record. The organizer can later confirm attendance or an award through a separate, explainable verification process.

The word **marketplace** describes the future two-sided network of students and school or external organizers. Whether it includes STUDESQ-hosted registration, paid tickets, or payments is still a product decision; none is assumed for the first pilot.

### Suggested data model

`User → StudentProfile → Subject → Topic`; `Exam → ExamTopic → Topic`; `Assignment → Subject/Topic`; `StudySession → Subject/Topic/Exam`; `TopicProgress → student + topic + confidence + last reviewed`; `Recommendation → calculated from current data` (persist only if needed to explain or audit changes).

For school life: `School → SchoolMembership`; `Organizer → Event`; `Event → audience/eligible schools, grade or age rules, deadline, source and status`; `Student → SavedEvent/Registration`; `EventParticipation → self-reported activity`, later linked to `Achievement/Evidence`. Keep school-only, selected-school, and broadly discoverable events distinct. Only authorized organizers or moderators may publish or alter event details; visibility and eligibility checks belong on the server.

Evolve the existing `Achievement` model; later add `Evidence`, `VerificationReview`, and `ShareGrant` separately. A review should record **who checked what, against which source, when, and with what result**. `Evidence attached` and `verified` are distinct states.

Build as one modular Next.js application with clear feature folders and shared authorization and data rules. Use deterministic scheduling and progress calculations. Start the event marketplace with curated listings and clear source ownership; defer organizer self-service, payments, and messaging. Avoid microservices and a model call for every dashboard visit.

## Work sequence and acceptance gates

### 0. Stabilize the foundation

- Choose the database target and fix the schema so client generation, local setup, and an optimized build pass. Keep a reproducible lockfile and reviewed migrations.
- Upgrade vulnerable dependencies in a focused change. Resolve the server/client component boundary in the profile editor and wire or remove placeholder actions.
- Choose one real authentication path. Lock out demo accounts outside local development. Add user-scoped queries and tests for unauthorized reads, writes, and downloads.
- Put uploads in private durable storage, with validated size and content and access checked on every read. Keep student data private by default.
- Establish an isolated staging environment with backups and a restore exercise before storing real student records.

**Gate:** fresh checkout can start, migrate, seed only a local demo, build, and pass a browser journey without manual code edits. Two different student accounts cannot access each other's records.

### 1. Build the first connected student experience

- Implement fast onboarding, subjects, exams, topics, topic progress, a dashboard recommendation with an explanation, and topic-linked focus sessions.
- Add school membership and a curated event feed with audience rules, event detail, save/unsave, and an accurate registration action or external link. Include event dates alongside academic deadlines in the dashboard without mixing them up.
- Let students mark participation as self-reported and link it to the event, with a clear distinction from organizer-confirmed attendance or an award.
- Support editing, deleting, empty states, mobile layout, keyboard access, and useful errors.
- Instrument only the events needed to learn: exam created, first recommendation viewed, first linked session completed, event viewed/saved, registration link used, and return visits. Do not capture sensitive note contents in analytics.

**Gate:** a new student can set up an exam in a few minutes, finish a topic-linked session, and see the correct updated plan after signing in again. They can also find an event appropriate for their school and grade, save it, and see the correct deadline and organizer. A different school's private event is inaccessible. Validate recommendation and event-audience rules with realistic examples.

### 2. Pilot with actual students

- Recruit roughly 10–15 students in one school level and one school community for four weeks. Obtain the appropriate permission and privacy setup before collecting minors' records or publishing school event details.
- Observe setup, a study session, and an attempt to discover an event without coaching; ask what they would otherwise use and what they missed or distrusted.
- Review weekly: how many got to a useful recommendation, completed a linked session, found and saved a relevant event, returned unprompted, and actually acted on a listing. Track reasons for abandonment, poor event supply, and manual-data burden.

**Gate:** repeat use and qualitative evidence justify the next investment. Study use and event engagement should be measured separately: one may work before the other. No single signup count or survey compliment counts as product validation. If the feed is empty or stale, fix event supply before adding personalization.

### 3. Build the lasting academic record

- Add structured achievements and timeline, multiple evidence items, private storage, precise sharing controls, export, and review history.
- Begin with `self-reported` and `evidence attached`. Introduce `verified` only when a real checking process exists and the UI states exactly what was checked.
- Test permission changes, revoked links, deletion/export, and evidence access from every role.

**Gate:** a student can retrieve an accurate record months later and share only selected parts, with no ambiguous badges.

### 4. Grow the event network and academic tools on evidence

- Add syllabus import if manual topic entry is the main barrier; confirm extracted dates/topics before saving.
- Add flashcards or recall tools if topic progress needs better evidence; add assignments if they repeatedly drive the next-action decision.
- Add organizer accounts and school publishing workflows once curated listings demonstrate student demand and schools agree to keep event information current. Include moderation, duplicate handling, cancelled events, school ownership, and reporting of misleading listings.
- Add matching, registrations hosted inside STUDESQ, and institutional verification only when organizers will participate and the operational process is reliable.
- Consider parents, messaging, social feeds, and payments separately because their permissions, safeguarding, and operational needs are substantial.

## Product risks and changes to the brief

1. **Different usage rhythms:** academic planning may be daily, events are discovered around school calendars, achievements are recorded occasionally, and applications are seasonal. Connect their data without forcing every layer into a daily action.
2. **Manual entry is the adoption threat:** make the first exam useful with a small amount of input. Test whether students abandon setup before expecting years of data.
3. **Time is not learning:** focus duration is activity data. Use topic completion, confidence, and later recall results carefully; never promise a reliable mastery score from timer minutes.
4. **Verification is an operation, not a badge:** certificates can be misleading or altered. Make the review process explainable and initially narrow.
5. **Portability beats lock-in:** students should be able to export and correct their record. Account value should come from usefulness and trust, not difficulty leaving.
6. **Global grades can wait:** store flexible assessment results later without making GPA the foundation of a product aimed at multiple school systems.
7. **Two-sided supply is work:** students will not return to stale event listings, and schools will not publish without a clear benefit and permission model. Start with a reliable curated feed in one community, then test organizer demand before building self-service tools.
8. **School boundaries matter:** distinguish school-only events, invited interschool events, and public events. Do not infer attendance, awards, or school endorsement from a saved event or registration click.

## Decisions required before implementing phase 1

- First cohort: recommend students in grades 9–10 in one school community, with a real exam and activity calendar.
- First promises: recommend a specific next academic action and show relevant, trustworthy school and interschool events.
- Event transaction: decide whether STUDESQ initially offers discovery and outbound registration, in-app RSVP, or full organizer-managed registration. Do not assume ticketing or payments.
- Backend target and identity provider: choose after the phase 0 comparison, considering privacy, deployment, cost, and migration effort.
- Pilot access: invite-only, private records, and no public portfolios or social features.

## References

- Product brief: STUDESQ — Product Brief, supplied 25 September 2026.
- [MyStudyLife product features](https://mystudylife.com/tour/) show overlap in planner, revision, timer, and parent functions.
- [Next.js December 2025 security update](https://nextjs.org/blog/security-update-2025-12-11) lists patched versions for the 14.x line.
- [Vercel function filesystem](https://vercel.com/docs/functions/runtimes) describes the read-only deployment filesystem and temporary scratch space.
- [Prisma database feature matrix](https://www.prisma.io/docs/orm/reference/database-features) notes SQLite enum support was introduced after the version pinned here.
