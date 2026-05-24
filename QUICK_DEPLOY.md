# Quick Deployment Checklist

## ✅ What's Done
- [x] Landing page repo created with all pages
- [x] Firebase config added (.env.local)
- [x] Git repo initialized
- [x] GitHub remote configured: `smartjaganrao/ai-interview-landing`

## 📋 Your Tasks (5 minutes)

### Step 1: Push to GitHub
```bash
cd "D:\Jagan\Projects\AI Tutor\ai-interview-landing"
git push -u origin main
```
- First time? GitHub will ask for credentials
- Use GitHub CLI token or personal access token
- **Status:** Push completes in <10 seconds

### Step 2: Deploy to Vercel  
Go to [vercel.com](https://vercel.com) and:

1. **Sign In** (or create account)
2. **New Project** button
3. **Import GitHub Repository** → Select `smartjaganrao/ai-interview-landing`
4. **Framework:** Already detected as Next.js ✓
5. **Build Settings:** Default next.config.js ✓
6. **Environment Variables:** Already set in code, Vercel will auto-detect ✓
7. **Deploy** button → Takes ~2 minutes

### Step 3: Verify Deployment
Once Vercel shows "Ready ✓", visit:
```
https://ai-interview-landing.vercel.app/
```

Test these:
- [x] Landing page loads (hero + pricing visible)
- [x] Sign Up button works
- [x] Sign up creates user in Firebase
- [x] Login page accessible
- [x] Dashboard shows after login
- [x] Download button → GitHub link works

---

## 🎯 Next Steps (When Landing is Live)

### Week 2: Real Razorpay Billing
- Upgrade button → Razorpay checkout
- Payment webhook → Cloud Function
- Email confirmations
- Admin can see real revenue

### Week 3: Admin Panel
- Deploy admin.yourdomain.com
- User management, analytics, billing

### Week 4: Go Live
- Real Razorpay credentials
- Production domain
- Custom branding + legal

---

## 🚨 If Anything Fails

**GitHub push fails:**
```bash
# Verify you're using personal access token (not password)
# Or use GitHub CLI: gh auth login
```

**Vercel deployment fails:**
- Check build logs in Vercel dashboard
- Usually: missing env vars or npm dependency issue
- Run locally first: `npm install && npm run build`

**Firebase connection fails:**
- Verify .env.local has correct API keys
- Check Firebase allows Email + Google auth
- Verify Firestore has users, subscriptions collections

---

## 💰 Current Status

**You're here:** Landing repo ready for deployment  
**After Step 2:** Landing page live and users can sign up  
**After Step 3:** Users download desktop app from dashboard  
**After Week 2:** Users can pay and upgrade plans  
**After Week 4:** Making real money ✨

---

## Expected Timeline

- Push to GitHub: <1 min
- Deploy to Vercel: 2-3 min
- Verify pages work: 5 min
- **Total: ~10 minutes to go live**

Once live, user can immediately:
- ✓ Visit yourdomain.com (Vercel default)
- ✓ Sign up with email
- ✓ Use Google OAuth
- ✓ See their plan
- ✓ Download desktop app
- ✓ (Week 2) Upgrade to Pro/Power
