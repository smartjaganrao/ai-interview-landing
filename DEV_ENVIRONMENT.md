# Dev / Staging Environment Setup

Goal: test changes (and Preview deploys) against a **separate dev Firebase project +
Razorpay test mode**, so nothing touches real users' data, accounts, or payments.

## The strategy (no code changes)
Vercel env vars are **scoped per environment**. We set the **same variable names** with
**different values**:

| Var | Production value | Preview + Development value |
|-----|------------------|------------------------------|
| `NEXT_PUBLIC_FIREBASE_*` (×7) | prod project `ai-interview-tutor` | **dev** project `ai-interview-tutor-dev` |
| `FIREBASE_ADMIN_SDK_JSON` | prod service account | **dev** service account |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | `rzp_live_…` | `rzp_test_…` |
| `RAZORPAY_WEBHOOK_SECRET` | prod webhook | dev/test webhook |
| `GROQ_API_KEY` | prod key | (same or a separate key) |
| `NEXT_PUBLIC_APP_URL` | https://javihai.in | the preview URL / localhost |

Production deploys (push to `main`) keep using prod. Preview deploys (PR branches) and
local `npm run dev` use dev. The code reads the same names either way.

---

## Step 1 — Create the dev Firebase project (you, in the console)
1. https://console.firebase.google.com → **Add project** → name `ai-interview-tutor-dev`.
   (Disable Google Analytics unless you want it.)
2. **Build → Authentication → Get started** → enable the same providers as prod
   (**Google**; email/password is removed in prod, so just Google).
3. **Build → Firestore Database → Create database** → Production mode → same region as prod.
4. **Project settings (gear) → General → Your apps → Add app → Web (</>)** → register →
   copy the `firebaseConfig` values (apiKey, authDomain, projectId, storageBucket,
   messagingSenderId, appId).
5. **Project settings → Service accounts → Generate new private key** → download the JSON
   (this is `FIREBASE_ADMIN_SDK_JSON`, minified to one line).

## Step 2 — Deploy security rules to dev
The same `firestore.rules` (in the helper repo) must be deployed to the dev project:
```bash
firebase use ai-interview-tutor-dev
firebase deploy --only firestore:rules
```

## Step 3 — Wire the values (send them to me, or set in Vercel dashboard)
For **both** `ai-interview-landing` and `ai-interview-admin` Vercel projects:
- Settings → Environment Variables → add each var with the **dev** value, scoped to
  **Preview** (and **Development**) only — leave the existing **Production** values alone.
- Razorpay → use **Test mode** keys + a test webhook.

For **local** dev, put the dev values in `.env.local` (already gitignored).

## Step 4 — Make an admin in dev
Run the admin's `setup/set-admin-claims` against the dev project so you can log into the
admin panel's preview build (see `ai-interview-admin/scripts`).

---

## Result
- `npm run dev` and every PR Preview → dev Firebase, test payments. Break things freely.
- Push to `main` → production, untouched.
- A bad change is caught on Preview *and* can't corrupt real user data even if it slips.
