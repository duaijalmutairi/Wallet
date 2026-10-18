# وين راحت فلوسي

Personal subscription, purchase-receipt, warranty-reminder, and potential-savings MVP for Kuwait.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/wen-rahat-flousi run typecheck` — check the React client
- Required secret: `MONGODB_URI` — MongoDB Atlas connection string; never put its value in source control

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Product DB: MongoDB Atlas + Mongoose (the scaffold's PostgreSQL library is not used by this product)
- Validation: generated Zod schemas
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- React/Vite client: `artifacts/wen-rahat-flousi/`
- Express server: `artifacts/api-server/`
- API contract: `lib/api-spec/openapi.yaml`

## Architecture decisions

- Purchase receipts must stay in MongoDB GridFS, as agreed with the user; do not provision external file storage.
- The user subsequently approved access control. Clerk sessions protect every subscription/purchase/receipt operation; all queries are scoped to the verified user.
- Never auto-claim ownerless legacy records, including on first sign-up. Preserve them until the owner is independently verified and an explicit ownership assignment is approved.
- Keep metadata saves separate from receipt uploads: a failed upload must never discard a saved purchase or replace its existing receipt.
- Prefer retaining an unreferenced file over deleting a potentially committed receipt after an ambiguous database write. Cleanup runs only after a definitive change.
- Warranty end dates include that calendar day in Kuwait; an item becomes expired on the following Kuwait day. Reminders appear in-app only.

## Product

Arabic, RTL personal-finance app with private, account-scoped subscription CRUD and purchase CRUD, optional PDF/JPEG/PNG receipts (up to 10 MiB), and warranty-expiry alerts. Public home and branded sign-in/sign-up lead to `/user-portal`. Receipt downloads, replacements and deletion are available from the purchase editor. A failed upload leaves saved purchase details intact and offers an upload-only retry.

## User preferences

The user explicitly repeated: "التزم بالي أنا دازه".
Build only subscription logging, renewal reminders, purchase receipt storage, warranty-expiry reminders, and the potential-savings calculator.
Work in small runnable stages, starting with subscription CRUD from UI to MongoDB; visual polish comes later.
The product is for the public, not a single-person workspace. The user explicitly requested accounts, login, dark mode, and private per-user MongoDB data.
All financial API routes must require a verified Clerk session. Derive identity from the server session and filter every read/update/delete by owner; never accept ownership from the request body.
Keep ownerless demo/legacy records unassigned and hidden rather than assigning them to the first person who logs in.
Do not add email reminder delivery, payments, external file storage, or future-vision features without a new request.
The user approved adding access protection after the original no-login constraint; Clerk authentication and per-user authorization are now in scope.
The original hosting target was Vercel; the user approved direct Replit publishing for the current version. If payments are ever requested, Stripe must be test mode only.
## Gotchas

- `node scripts/src/test-purchases.mjs` checks that every private API operation rejects anonymous/forged identity, while health remains public. Its exported `testPurchases(request)` full CRUD suite requires an authenticated request adapter and cleans up only its own records. Signed-in browser tests also cover real GridFS operations and cross-account isolation.
- `pnpm --filter @workspace/scripts exec tsx --test ../artifacts/api-server/tests/warranty.test.ts` checks calendar validation and Kuwait warranty boundaries.
- The server-side generated binary-upload schemas reference Node's global `Blob`; the API Zod package needs Node type declarations because the shared TypeScript config excludes ambient types.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
