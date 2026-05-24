# Deployment Guide

## Deploying to Vercel

### Step 1: Initialize Git Repository

```bash
cd ai-interview-landing
git init
git add .
git commit -m "Initial landing page repo"
```

### Step 2: Push to GitHub

```bash
# Create a new repository on GitHub named 'ai-interview-landing'
git remote add origin https://github.com/YOUR_USERNAME/ai-interview-landing.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

Option A: Using Vercel CLI

```bash
npm i -g vercel
vercel
# Follow the prompts to connect GitHub and deploy
```

Option B: Using Vercel Web Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

### Step 4: Configure Environment Variables

In Vercel Dashboard:

1. Go to Project Settings → Environment Variables
2. Add the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

Get these from: Firebase Console → Project Settings → Web App

### Step 5: Set Custom Domain

1. In Vercel Dashboard → Settings → Domains
2. Add custom domain (e.g., `yourdomain.com`)
3. Follow DNS setup instructions
4. Update your domain registrar's DNS records

### Step 6: Verify Deployment

```bash
# Your site is now live at:
https://yourdomain.com/
https://ai-interview-landing.vercel.app/ (Vercel default)
```

### Step 7: Test Key Features

- [ ] Landing page loads
- [ ] Sign up form works
- [ ] Email/password signup creates user in Firebase
- [ ] Google OAuth button works
- [ ] Login page works
- [ ] Dashboard loads (shows usage stats for free tier)
- [ ] Download button links to GitHub releases
- [ ] Upgrade button is visible

## Troubleshooting

### Firebase Not Initializing

- Check that all env variables are set in Vercel
- Verify Firebase project ID is correct
- Check Firebase security rules allow anonymous auth

### Build Fails

```bash
# Test locally first
npm install
npm run build

# Check for TypeScript errors
npm run type-check
```

### Auth Issues

- Verify Firebase project has Email/Password and Google OAuth enabled
- Check Firestore is created in the project
- Verify security rules allow user reads/writes

## Next Steps (Week 2)

After confirming the landing page is live:

1. Deploy admin panel to `admin.yourdomain.com`
2. Implement Razorpay payment integration
3. Create checkout flow
4. Add Cloud Function for payment webhook

## Support

For deployment issues:
- Check [Vercel Docs](https://vercel.com/docs)
- Check [Next.js Docs](https://nextjs.org/docs)
- Check [Firebase Docs](https://firebase.google.com/docs)
