# Volume - Workout Tracker MVP

Simple workout tracking app with Convex backend and Clerk auth.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up Convex:
```bash
pnpm convex dev
```
This will:
- Create a new Convex project (first time only)
- Generate `.env.local` with your `NEXT_PUBLIC_CONVEX_URL`
- Start the Convex dev server

3. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Convex** - Backend-as-a-service (database, auth, real-time)
- **Clerk** - Authentication (to be added)

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
└── ...
convex/               # Convex backend functions
├── schema.ts         # Database schema
├── exercises.ts      # Exercise CRUD
└── sets.ts          # Set logging
```

## Development

```bash
pnpm dev          # Start Next.js dev server
pnpm convex dev   # Start Convex dev server (in separate terminal)
pnpm typecheck    # Run TypeScript checks
pnpm lint         # Run ESLint
```

## MVP Features

- ✅ User authentication (Clerk)
- ✅ Create/list/delete exercises
- ✅ Log sets (reps + optional weight)
- ✅ View history (reverse-chronological)
- ✅ Mobile responsive

See `BACKLOG.md` for post-MVP enhancements.
