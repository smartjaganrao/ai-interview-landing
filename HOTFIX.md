# Hotfix & Rollback Runbook — Landing

Customer-facing landing + dashboard, deployed on **Vercel** (project `ai-interview-landing`).

## Deploy facts
- **Vercel Production Branch: `main`.** Pushing to `main` deploys to production (javihai.in). Any other branch / PR gets a throwaway **Preview** URL.
- Deploys are **atomic**: a build either fully replaces the live site or doesn't. A **failed build never goes live** — Vercel keeps the previous deployment serving.

## If production is broken → ROLL BACK FIRST (seconds, no code)
1. Vercel dashboard → project **ai-interview-landing** → **Deployments**.
2. Find the last deployment that was healthy (green, before the bad one).
3. **⋯ → Promote to Production**. Live users are back on the good build immediately.
4. *Then* fix forward calmly on a branch (below). Rolling back buys you time; it is not the fix.

> CLI alternative: `vercel rollback <deployment-url>` (needs `vercel login`).

## Normal fix flow (no users disturbed)
```bash
git checkout main && git pull
git checkout -b fix/<short-desc>
# ...make the fix...
npm run build          # must compile locally first
git commit -am "fix: <desc>" && git push -u origin fix/<short-desc>
```
- Open a PR → Vercel posts a **Preview URL** on it. **Test the fix on that URL** (it behaves like prod, but note the backend caveat below).
- Merge the PR to `main` → production deploys automatically.
- Watch the deploy go green; if it misbehaves, **roll back** (above).

## ⚠️ Backend caveat — previews are NOT fully isolated
Preview deploys still talk to the **production Firebase project** and **live Razorpay**. So UI fixes are safe to preview, but anything touching **data, Firestore rules, or payments** can affect real users even from a preview. For those, use a dev Firebase project + Razorpay **test** keys (see the dev-environment task).

## Pre-merge checklist
- [ ] `npm run build` passes locally
- [ ] Tested on the PR's Preview URL
- [ ] No Firestore-rule / data / payment change that could hit live users (or it was tested against dev)
- [ ] Know the last-good deployment to roll back to if needed
