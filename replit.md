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

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

The user explicitly repeated: "التزم بالي أنا دازه".
Build only subscription logging, renewal reminders, purchase receipt storage, warranty-expiry reminders, and the potential-savings calculator.
Work in small runnable stages, starting with subscription CRUD from UI to MongoDB; visual polish comes later.
The product is for the public, not a single-person workspace. The user explicitly requested accounts, login, dark mode, and private per-user MongoDB data.
All financial API routes must require a verified Clerk session. Derive identity from the server session and filter every read/update/delete by owner; never accept ownership from the request body.
Keep ownerless demo/legacy records unassigned and hidden rather than assigning them to the first person who logs in.
Do not add email reminder delivery, payments, external file storage, or future-vision features without a new request.
Final hosting target is Vercel. If payments are ever requested, Stripe must be test mode only.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
