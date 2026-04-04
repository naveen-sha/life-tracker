# Life Tracker

Track habits, achievements, and long-term progress.

Live link: https://life-tracker-six-kappa.vercel.app

## Google Login + Cross-Device Sync Setup

To enable Gmail login and data sync across devices:

1. Create a Firebase project.
2. Enable `Authentication > Sign-in method > Google`.
3. Create a Firestore database in production or test mode.
4. Copy your Firebase web config into [firebase-config.js](c:\Users\liger\2026-6m\life-tracker\firebase-config.js).
5. Add your domain (for example localhost or your deployed URL) to Firebase authorized domains.

After setup, use `Settings > Google Account Sync` to sign in and sync data.
