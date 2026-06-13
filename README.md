# ai-interview-landing

Next.js 15 web app for JavihAI — handles auth, billing, dashboard, and app download.

**Production:** https://javihai.in | **Hosting:** Vercel (auto-deploys from `main`) | **Firebase:** `ai-interview-tutor`

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth | Firebase Auth — Google sign-in only |
| Database | Firestore (client + Admin SDK) |
| Payments | Razorpay Standard Checkout |
| Styles | Tailwind CSS |

---

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in values — see Environment section
npm run dev                  # http://localhost:3000
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve production build locally |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript check (no emit) |

---

## Environment variables

```bash
# .env.local — never commit this file

# Firebase web client (public-safe, can be in client bundle)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Razorpay — server-only (no NEXT_PUBLIC_ prefix = never sent to browser)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Razorpay key for client-side Checkout modal
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...

# Firebase Admin SDK — paste minified single-line JSON of service account file
FIREBASE_ADMIN_SDK_JSON={"type":"service_account","project_id":"..."}

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Production values are set directly in Vercel. Never commit `.env.local`.

---

## Project structure

```
app/
  page.tsx                  Landing / home
  pricing/page.tsx          Plan selection (monthly / yearly toggle)
  checkout/page.tsx         Razorpay checkout — blocks double-payment
  dashboard/page.tsx        User dashboard, plan status, app download
  auth/
    login/page.tsx          Google sign-in
    signup/page.tsx         Google sign-up → redirects to checkout if plan selected
  api/
    razorpay/
      create-order/         POST {plan, billing, userId} → Razorpay order
      verify-payment/       POST — HMAC verify + write subscription to Firestore
      webhook/              POST — payment.captured / payment.failed events
  privacy/page.tsx
  terms/page.tsx
  not-found.tsx
  robots.ts
  sitemap.ts

components/
  Navbar.tsx
  Footer.tsx

hooks/
  useAuth.ts                Firebase auth state

lib/
  firebase.ts               Client SDK init
  firebase-admin.ts         Admin SDK init (server only)
  auth.ts                   googleSignIn, ensureUserDocs, friendlyAuthError
  razorpay-server.ts        getRazorpayClient, verifyPaymentSignature, PLAN_CATALOG
```

---

## Payment flow

```
/pricing → select plan
  → unauthenticated: redirect to /auth/signup?plan=pro
  → authenticated, same/higher plan: button disabled
  → authenticated, upgrade: /checkout?plan=pro&billing=monthly

/checkout
  → reads Firestore subscription — blocks if already on same or higher plan
  → POST /api/razorpay/create-order  → { orderId, amount, keyId }
  → Razorpay modal (CDN script loaded at runtime)
  → payment success → POST /api/razorpay/verify-payment
  → HMAC-SHA256 verify → write subscriptions/{uid} to Firestore
  → redirect /dashboard?upgraded=true
```

### Plan pricing (server-side source of truth in `lib/razorpay-server.ts`)

```
pro:   ₹499/month  · ₹4,990/year
power: ₹999/month  · ₹9,990/year
```

### Firestore writes

| Collection | Doc key | Purpose |
|---|---|---|
| `users` | `{uid}` | plan, email, name, createdAt |
| `subscriptions` | `{uid}` | plan, status, billing, amount, paymentId, renewalDate |
| `support_tickets` | auto | userId, title, description, category, status |

---

## Deploy

Every push to `main` auto-deploys via Vercel (~40s build).

To update a secret:
```bash
npx vercel env rm KEY_NAME production --yes
echo "new-value" | npx vercel env add KEY_NAME production
git commit --allow-empty -m "chore: redeploy" && git push origin main
```

## Go live (test → production payments)

1. Razorpay Dashboard → switch to **Live mode** → generate live key pair
2. Webhooks → add `https://javihai.in/api/razorpay/webhook` → events: `payment.captured`, `payment.failed` → copy secret
3. Update Vercel: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET`
4. Redeploy
