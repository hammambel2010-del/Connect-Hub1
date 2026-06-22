# Social Connect

A full-stack Arabic-first social networking web app with real-time messaging, group chats, friend management, profile editing, and media uploads.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/social-app run dev` — run the frontend (Vite, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- Auth: Clerk (`@clerk/react` on frontend, `@clerk/express` on backend)
- API: Express 5, contract-first OpenAPI → Orval codegen (React Query hooks + Zod schemas)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod`), `drizzle-zod`
- Fonts: Tajawal (Arabic-first RTL layout)
- Object Storage: Replit App Storage (presigned uploads via `/api/storage`)
- Build: esbuild (CJS bundle for API server)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, friends, groups, messages)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)
- `artifacts/api-server/src/routes/` — Express route handlers (users, friends, messages, groups, storage)
- `artifacts/social-app/src/pages/` — all page components (home, messages, groups, friends, search, profile)
- `artifacts/social-app/src/components/` — shared components (layout, message-bubble, message-input, user-avatar, loading-screen)

## Architecture decisions

- **Contract-first API**: OpenAPI spec in `lib/api-spec/openapi.yaml` drives both server-side Zod validators and client React Query hooks via Orval codegen.
- **Clerk proxy only in production**: `clerkProxyUrl` in App.tsx is undefined in dev mode (Clerk CDN used instead); the proxy middleware in `clerkProxyMiddleware.ts` also skips if `NODE_ENV !== production`.
- **Polling for messages**: DM and group chat pages poll every 2s with `refetchInterval`. No WebSocket needed for MVP.
- **Orval codegen fix**: `lib/api-spec/package.json` codegen script includes a `sed` step to strip the stale `export * from './generated/types'` barrel re-export that orval adds but then removes in later steps. Also `indexFiles: false` in orval config.
- **zod import**: API server routes import from `"zod"` not `"zod/v4"` (esbuild subpath limitation).

## Product

- **Auth**: Sign in / sign up via Clerk (email + Google OAuth), Arabic-localized UI
- **Messaging**: Direct messages between friends, 2-second polling, media (image/video) upload
- **Groups**: Create public/private groups, join/leave, group chat with members sidebar
- **Friends**: Send/accept/reject/cancel friend requests, view friends list
- **Search**: Find users and public groups by name
- **Profile**: View and edit own profile (avatar, cover photo, bio, age); view others' profiles

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/db run push` after schema changes — tables must exist before the API server boots
- After adding new deps to any package, restart its workflow — Vite/esbuild don't auto-pick new node_modules
- `@clerk/themes` ESM build works with Vite; the CJS dist path differs — don't use `require()` for it
- Clerk `Show` component (v6) takes `when="signed-in"` or `when="signed-out"` props

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
