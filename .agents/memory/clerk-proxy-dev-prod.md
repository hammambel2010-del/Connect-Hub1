---
name: Clerk proxy dev vs prod
description: Clerk JS proxy URL must be undefined in dev mode — setting it in dev causes a 404 because the proxy middleware is skipped.
---

**Rule:** Set `clerkProxyUrl` only when `import.meta.env.PROD` is true on the frontend. In dev Clerk loads its JS bundle from its own CDN.

**Why:** The `clerkProxyMiddleware` in the API server explicitly returns a passthrough `next()` when `NODE_ENV !== "production"`. If the frontend always passes `proxyUrl`, Clerk tries to load `clerk.browser.js` through `/api/__clerk/...`, gets a 404, and the entire app fails to load.

**How to apply:**
```ts
const clerkProxyUrl = import.meta.env.PROD ? basePath + "/api/__clerk" : undefined;
```
Pass `proxyUrl={clerkProxyUrl}` to `<ClerkProvider>` — when undefined Clerk ignores the prop.
