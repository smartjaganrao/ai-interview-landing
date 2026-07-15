# Graph Report - .  (2026-07-15)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 450 nodes · 673 edges · 34 communities (27 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c4367cb8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Navbar.tsx
- firebase-admin.ts
- Footer.tsx
- compilerOptions
- devDependencies
- razorpay-server.ts
- dependencies
- layout.tsx
- github-release.ts
- page.tsx
- email.ts
- page.tsx
- page.tsx
- deploy-firestore-rules.mjs
- vercel.json
- creator-payouts.mjs
- route.ts
- route.ts
- route.ts
- route.ts
- setup-firestore.mjs
- route.ts
- route.ts
- layout.tsx
- layout.tsx
- layout.tsx
- layout.tsx
- next.config.js
- next-env.d.ts

## God Nodes (most connected - your core abstractions)
1. `verifyIdToken()` - 27 edges
2. `compilerOptions` - 23 edges
3. `useAuth()` - 19 edges
4. `POST()` - 11 edges
5. `POST()` - 9 edges
6. `scripts` - 9 edges
7. `POST()` - 8 edges
8. `POST()` - 7 edges
9. `SignupContent()` - 7 edges
10. `getUserInfo()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getDynamicPricing()`  [EXTRACTED]
  app/api/pricing/route.ts → lib/firebase-admin.ts
- `POST()` --calls--> `getDynamicPricing()`  [EXTRACTED]
  app/api/razorpay/create-order/route.ts → lib/firebase-admin.ts
- `POST()` --calls--> `verifyIdToken()`  [EXTRACTED]
  app/api/razorpay/create-order/route.ts → lib/firebase-admin.ts
- `GET()` --calls--> `isRazorpayConfigured()`  [EXTRACTED]
  app/api/razorpay/status/route.ts → lib/razorpay-server.ts
- `POST()` --calls--> `getUserInfo()`  [EXTRACTED]
  app/api/razorpay/verify-payment/route.ts → lib/firebase-admin.ts

## Import Cycles
- None detected.

## Communities (34 total, 7 thin omitted)

### Community 0 - "Navbar.tsx"
Cohesion: 0.06
Nodes (43): LoginPage(), attributeCreatorIfPending(), claimReferralIfPending(), SignupContent(), CreatorData, CreatorPage(), ActivityData, DashboardContent() (+35 more)

### Community 1 - "firebase-admin.ts"
Cohesion: 0.08
Nodes (39): POST(), POST(), POST(), POST(), POST(), Difficulty, DIFFICULTY_GUIDE, generateQuestion() (+31 more)

### Community 2 - "Footer.tsx"
Cohesion: 0.05
Nodes (17): metadata, ROWS, metadata, ROWS, metadata, ROWS, metadata, ROWS (+9 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (34): DOM, DOM.Iterable, ES2020, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+26 more)

### Community 4 - "devDependencies"
Cohesion: 0.06
Nodes (32): autoprefixer, eslint, eslint-config-next, description, devDependencies, autoprefixer, eslint, eslint-config-next (+24 more)

### Community 5 - "razorpay-server.ts"
Cohesion: 0.15
Nodes (25): POST(), GET(), POST(), POST(), RazorpayEvent, RazorpayPaymentEntity, RazorpaySubscriptionEntity, sendPaymentConfirmation() (+17 more)

### Community 6 - "dependencies"
Cohesion: 0.09
Nodes (23): clsx, firebase, firebase-admin, groq-sdk, next, dependencies, clsx, firebase (+15 more)

### Community 7 - "layout.tsx"
Cohesion: 0.14
Nodes (11): appSchema, metadata, orgSchema, websiteSchema, CaptureAttribution(), GoogleAnalytics(), TawkChat(), Window (+3 more)

### Community 8 - "github-release.ts"
Cohesion: 0.18
Nodes (12): EXT, GET(), logDownload(), GET(), InstallPage(), metadata, FALLBACK, getLatestRelease() (+4 more)

### Community 9 - "page.tsx"
Cohesion: 0.21
Nodes (13): BlogIndexPage(), formatDate(), metadata, BlogPostPage(), formatDate(), generateMetadata(), generateStaticParams(), sitemap() (+5 more)

### Community 10 - "email.ts"
Cohesion: 0.22
Nodes (13): GET(), getAdmin(), POST(), formatDate(), PLAN_EMOJI, PLAN_FEATURES, PLAN_NAMES, sendFreeTrialVoucher() (+5 more)

### Community 11 - "page.tsx"
Cohesion: 0.22
Nodes (9): CheckoutContent(), loadRazorpayScript(), Offer, offerActiveFor(), PLAN_RANK, planDetails, Pricing, RazorpayOptions (+1 more)

### Community 12 - "page.tsx"
Cohesion: 0.22
Nodes (7): effectivePrice(), faqSchema, LandingPage(), PricingData, QUESTIONS, FormData, FreeTrialModalProps

### Community 13 - "deploy-firestore-rules.mjs"
Cohesion: 0.20
Nodes (7): __dir, envPath, root, rulesContent, rulesLocations, rulesPath, sa

### Community 14 - "vercel.json"
Cohesion: 0.25
Nodes (7): buildCommand, crons, framework, installCommand, name, outputDirectory, version

### Community 15 - "creator-payouts.mjs"
Cohesion: 0.29
Nodes (4): db, __dir, envPath, root

### Community 16 - "route.ts"
Cohesion: 0.47
Nodes (5): GeneratedPost, generatePost(), LENGTH_GUIDE, POST(), slugify()

### Community 17 - "route.ts"
Cohesion: 0.60
Nodes (5): formatPhoneNumber(), generateVoucherCode(), getFirestoreDb(), POST(), sendWhatsAppMessage()

### Community 18 - "route.ts"
Cohesion: 0.50
Nodes (4): GeneratedEmail, generateTemplate(), POST(), TEMPLATE_PROMPTS

### Community 19 - "route.ts"
Cohesion: 0.50
Nodes (4): EmailPayload, getResendConfig(), POST(), ResendConfig

### Community 20 - "setup-firestore.mjs"
Cohesion: 0.40
Nodes (4): db, __dir, envPath, root

### Community 21 - "route.ts"
Cohesion: 0.83
Nodes (3): GET(), isAtLeast(), parseVersion()

## Knowledge Gaps
- **175 isolated node(s):** `GeneratedPost`, `LENGTH_GUIDE`, `EXT`, `TEMPLATE_PROMPTS`, `GeneratedEmail` (+170 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Navbar.tsx` to `page.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `verifyIdToken()` connect `firebase-admin.ts` to `email.ts`, `razorpay-server.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `GeneratedPost`, `LENGTH_GUIDE`, `EXT` to the rest of the system?**
  _175 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Navbar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.061581920903954805 - nodes in this community are weakly interconnected._
- **Should `firebase-admin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07542087542087542 - nodes in this community are weakly interconnected._
- **Should `Footer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._