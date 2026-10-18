---
name: GitHub Git authentication
description: Distinguish anonymous public repository reads from authenticated Git writes.
---

Do not treat successful reads of a public GitHub repository as proof that the managed connection can write.

**Why:** The managed source-control connection reported healthy and reading the empty public repository succeeded, but the GitHub CLI had no login and the actual push failed authentication. The read had not established authenticated access. Integration reconnect forms also rejected this special source-control connection type.

**How to apply:** Check the remote safely, but verify write access separately before reporting upload success. If the special connector's reconnect forms fail, use Replit's native account Git Providers / Connected Services reconnection flow rather than repeating those forms. Never extract tokens or embed credentials in remote URLs.
