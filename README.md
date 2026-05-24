# AI Interview Landing Page & Customer Dashboard

Customer-facing landing page, authentication, and account dashboard for the AI Interview Helper SaaS.

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Firebase project credentials

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
```

### Development

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Get these values from Firebase Console > Project Settings > Web App

## Features

- 🎯 Landing page with hero, pricing, and FAQ sections
- 👤 User authentication (email/password + Google OAuth)
- 📊 Account dashboard with usage stats
- 💳 Plan management and upgrade options
- 🔐 Secure Firebase integration
- 📱 Responsive design with Tailwind CSS

## Project Structure

```
app/
├── page.tsx           # Landing page (hero, pricing, FAQ)
├── layout.tsx         # Root layout
├── globals.css        # Global styles
├── auth/
│   ├── login/         # Login page
│   └── signup/        # Signup page
└── dashboard/         # Protected account dashboard
      └── page.tsx

lib/
└── firebase.ts        # Firebase configuration

hooks/
└── useAuth.ts         # Auth state management
```

## Building for Production

```bash
pnpm run build
pnpm run start
```

## Deployment

### Vercel (Recommended)

1. Connect repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Custom Server

```bash
pnpm run build
pnpm run start
```

## Next Steps (Week 2)

- [ ] Implement Razorpay payment integration
- [ ] Create checkout flow
- [ ] Add Cloud Function for payment webhook
- [ ] Email confirmations

## Support

For issues or questions, contact support@aiinterviewhelper.com
