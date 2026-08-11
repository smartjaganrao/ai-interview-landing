# Netlify environment variables for ai-interview-landing
# Copy these into Netlify Site settings > Environment variables
# Replace placeholder values with your real production values

# ------------------------------
# Public variables (exposed to browser)
# ------------------------------
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ai-interview-tutor.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-interview-tutor
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ai-interview-tutor.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=475876914174
NEXT_PUBLIC_FIREBASE_APP_ID=1:475876914174:web:caceda87b97359476546af
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-MEZ0DJ7R0B
NEXT_PUBLIC_WHATSAPP_NUMBER=919884160332
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
NODE_VERSION=20

# ------------------------------
# Secret variables (server-only)
# ------------------------------
RAZORPAY_KEY_SECRET=...
FIREBASE_ADMIN_SDK_JSON={"type":"service_account","project_id":"ai-interview-tutor",...}
ADMIN_SECRET=...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=JavihAI <noreply@javihai.in>
