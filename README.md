# StudesQ — imported application source

This branch contains the Claude-built Next.js 16 application supplied by the project owner. Read [IMPORT_REVIEW.md](IMPORT_REVIEW.md) for observed features, known gaps, and validation results, and [CODEX_BUILD_PROMPT.md](CODEX_BUILD_PROMPT.md) for the implementation handoff.

The older implementation remains on `main`. This branch is not a production release.

## Local preparation

Use a supported Node version (Node 22 LTS is a suitable starting point). Copy `.env.example` to `.env` and generate a fresh AUTH_SECRET. Keep local secrets out of Git.

```bash
npm ci
npx prisma generate
npx prisma db push
npm run dev
```

Use a fresh disposable local database for development. The current adapter uses root `dev.db`; see the discrepancy with DATABASE.md in the import review. Sign up through `/register` for a fresh test account. Google OAuth is optional and requires configuration.

## Checks

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Type checking passed during import; lint did not. Full runtime validation and production hosting remain work for the next implementation phase. Generated Prisma files, local databases, uploads, and build/dependency directories are intentionally excluded from Git.
