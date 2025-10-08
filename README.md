# Volume - Workout Tracker MVP

Simple workout tracking app with Convex backend and Clerk auth.

**Live at: [volume.fitness](https://volume.fitness)**

## ⚠️ IMPORTANT: Dual Server Architecture

This project requires **TWO** dev servers running simultaneously:

1. **Next.js** (port 3000) - Frontend application
2. **Convex** (cloud) - Backend functions & database

The `pnpm dev` command now runs **BOTH** servers concurrently with color-coded output.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start BOTH servers (Next.js + Convex)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First-Time Setup

### 1. Set up Convex

```bash
pnpm convex dev
```

This will:
- Create a new Convex project (first time only)
- Generate `.env.local` with your `NEXT_PUBLIC_CONVEX_URL`
- Start the Convex dev server

Press Ctrl+C to stop, then use `pnpm dev` for ongoing development.

### 2. Set up Clerk

- Go to [Clerk Dashboard](https://dashboard.clerk.com)
- Create a new application
- Copy the API keys and add them to `.env.local`:
  ```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  ```

### 3. Start Development

```bash
pnpm dev  # Runs BOTH Next.js and Convex
```

## Troubleshooting

### "Could not find public function" Error

If you see this error after pulling changes:

```bash
pnpm convex dev  # Syncs Convex functions to your deployment
```

This is required whenever you pull code with new/modified Convex functions.

### Running Servers Separately

If needed, you can run servers individually:

```bash
pnpm dev:next    # Next.js only (port 3000)
pnpm dev:convex  # Convex only (cloud)
```

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Convex** - Backend-as-a-service (database, real-time sync)
- **Clerk** - Authentication and user management

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
