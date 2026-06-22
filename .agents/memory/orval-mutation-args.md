---
name: Orval mutation args — path params vs body
description: Path parameters are top-level in mutateAsync args; only request bodies go in `data`.
---

**Rule:** When calling `mutateAsync`, put URL path parameters at the top level and request body in `data`. Never wrap path params in `data`.

**Why:** Orval generates mutation functions that destructure `{ pathParam, data }` from the args object and pass them separately to the underlying fetch function.

**How to apply:**
```ts
// Wrong - path param wrapped in data
acceptMutation.mutateAsync({ data: { requestId } })

// Correct - path param at top level
acceptMutation.mutateAsync({ requestId })

// Correct - path param + body
sendMutation.mutateAsync({ userId, data: { content, mediaUrl } })
```
Check the generated `UseMutationOptions` type for the exact shape — it's always `{ pathParam1, pathParam2?, data?: BodyType<X> }`.
