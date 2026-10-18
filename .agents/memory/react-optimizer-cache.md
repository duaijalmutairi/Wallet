---
name: React optimizer cache
description: Runtime React version mismatch despite matching installed packages after adding Clerk.
---

Check Vite's generated dependency cache when a browser reports incompatible React and react-dom versions even though the artifact resolves matching installed versions.

**Why:** After the Clerk-required React patch upgrade, a normal workflow restart retained the previous optimized renderer while loading the newer React package.

**How to apply:** Confirm both actual package resolutions first, inspect the artifact's generated optimizer metadata, and clear only its generated node_modules/.vite cache before restarting. Do not downgrade supported dependencies or disable the runtime error overlay to conceal the problem.
