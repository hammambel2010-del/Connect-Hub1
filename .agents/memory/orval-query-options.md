---
name: Generated hook query options require queryKey
description: Orval-generated React Query hooks type the query option as UseQueryOptions (not Partial), so queryKey is required when passing custom options.
---

**Rule:** Always include `queryKey` when passing a `query` options object to an orval-generated hook.

**Why:** The generated signature is `options?: { query?: UseQueryOptions<...> }` — `UseQueryOptions` requires `queryKey`. The hook's internal `getXxxQueryOptions` will fill in a default queryKey at runtime, but TypeScript still demands it at the type level.

**How to apply:**
```ts
// Wrong - TS2741 missing queryKey
useGetGroup(id, { query: { enabled: !!id } })

// Correct - import and pass the queryKey getter
useGetGroup(id, { query: { queryKey: getGetGroupQueryKey(id), enabled: !!id } })
```
Import the matching `getXxxQueryKey` function from `@workspace/api-client-react` alongside the hook.
