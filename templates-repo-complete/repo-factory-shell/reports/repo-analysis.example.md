# Repo analysis — <repo>

## Stack detected
- Languages: TypeScript (80%), Python (20%)
- Framework: Next.js 15
- Backend: Supabase
- Jobs: Custom worker (Fly Machines)

## Health score
- Tests coverage: 60%
- TypeScript strict: enabled
- Lint config: present
- CI: GitHub Actions
- Dependencies up-to-date: yes (Renovate active)

## Risks
- None critical
- Renovate has 3 medium open PRs

## Recommendation
- Migrate worker to supabase-trigger pack pattern (already done in v2)
