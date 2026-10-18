---
name: GitHub Git authentication
description: Distinguish managed Git transport access from GitHub CLI authentication.
---

Do not treat an unauthenticated GitHub CLI as proof that the managed Git connection is broken.

**Why:** The managed source-control connection reported healthy, while gh reported no login and integration reconnect forms rejected the special connection type. Direct HTTPS Git access succeeded without handling credentials.

**How to apply:** Try a read-only git ls-remote against the user's supplied repository before requesting a new authorization. Never extract tokens or embed credentials in remote URLs.
