# Antigravity Frontend Brief

## Branch

Create your branch from latest `main`:

```bash
git checkout main
git pull origin main
git checkout -b antigravity/frontend-shell
```

Do not work on `codex/backend-foundation`; Codex owns that branch.

## Scope

Build only the frontend shell and static screens first:

- Finance Concierge / FinHub visual style.
- Header layout with role-aware destinations.
- Landing page.
- New Request / Category Selection page.
- My Requests empty/list state.
- Finance `Dashboard` page layout.
- Finance/Admin `Configuration` page layout.
- Admin side-menu layout.
- Approval Inbox layout.

Use the existing routes in `src/app`. Keep components in `src/components`.

## Backend Contract

Use these read-only endpoints for now:

- `GET /api/request-types`
- `GET /api/navigation?roles=REQUESTER,FINANCE`

The requester form must display both `Name` and `Email`.

## Avoid

- Do not add new UI libraries.
- Do not implement auth.
- Do not invent the Digital dashboard yet.
- Do not add email/actionable-card logic.
- Do not change Prisma schema.

## Merge Order

1. Codex merges `codex/backend-foundation` into `main`.
2. Rebase your branch on latest `main`.
3. Open PR from `antigravity/frontend-shell`.

