---
name: Orval codegen barrel fix
description: Orval regenerates a stale barrel re-export that causes a TS2308 collision; strip it with sed post-processing.
---

**Rule:** After running orval codegen, remove the line `export * from './generated/types'` from `lib/api-zod/src/index.ts` via sed.

**Why:** Orval writes a `./generated/types` barrel into `index.ts` but the `types` file no longer exists (removed by removing the `schemas` config block). This causes `TS2308: Module not found` on every typecheck.

**How to apply:** In `lib/api-spec/package.json` codegen script, append:
```sh
&& sed -i "/generated\\/types/d" ../api-zod/src/index.ts
```
Also set `indexFiles: false` in `orval.config.ts` to prevent orval from writing extra barrel files.
