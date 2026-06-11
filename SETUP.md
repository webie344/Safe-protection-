# SafeSignal — Setup Guide

## What is this?

SafeSignal is a **PWA (Progressive Web App)** you can install on any phone or desktop directly from the browser — no app store needed. It uses AI to:

- 🛡️ **Truth Check** — Detect scams, phishing, and manipulation in messages
- ₿ **Crypto Check** — Verify if a crypto or investment offer is legit
- 🌐 **Website Safety** — Check if a URL is safe or phishing
- 💬 **Reply Helper** — Get 4 smart reply options for any message
- 📄 **Message Explainer** — Understand any confusing official message

---

## Quick Start (5 steps)

### 1. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g. "safesignal")
3. Enable **Authentication** → Sign-in providers → **Email/Password** and **Google**
4. Enable **Firestore** → Create database → Start in production mode
5. Go to **Project Settings** → Your apps → Add Web App
6. Copy the config and paste it into `config.js`:

```javascript
window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",
  authDomain:        "safesignal-xxxxx.firebaseapp.com",
  projectId:         "safesignal-xxxxx",
  storageBucket:     "safesignal-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

### 2. Get a Gemini API Key (free)

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API Key** — it's free!
3. Paste it in `config.js`:

```javascript
window.GEMINI_API_KEY = "AIzaSyYour-Key-Here";
```

### 3. Set up Cloudinary (optional — for screenshot uploads)

1. Go to [cloudinary.com](https://cloudinary.com) and create a free account
2. Go to Settings → Upload → Add Upload Preset
3. Set it to **Unsigned** mode
4. Paste your details in `config.js`:

```javascript
window.CLOUDINARY_CONFIG = {
  cloudName:    "your-cloud-name",
  uploadPreset: "your-preset-name"
};
```

### 4. Host the files

You can host SafeSignal on any static hosting service:

**Firebase Hosting (recommended — works with Firebase Auth):**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting  # set public dir to "." (current folder)
firebase deploy
```

**Other options:**
- [Netlify](https://netlify.com) — drag & drop the folder
- [Vercel](https://vercel.com) — `vercel deploy`
- [GitHub Pages](https://pages.github.com) — push to a repo

> **Important:** Firebase Auth requires HTTPS. All these hosts provide HTTPS automatically.

### 5. Enable PWA Install

Once hosted on HTTPS, users can install SafeSignal:
- **Android:** Chrome shows "Add to Home Screen" prompt automatically
- **iOS:** Safari → Share → Add to Home Screen
- **Desktop:** Chrome shows an install icon in the address bar

---

## File Structure

```
safesignal/
├── index.html      — App shell
├── app.js          — Full SPA (router, pages, AI, auth, Firestore)
├── config.js       — Your API keys and Firebase config  ← EDIT THIS
├── theme.css       — Design tokens, animations
├── styles.css      — All component styles
├── manifest.json   — PWA manifest
├── sw.js           — Service worker (offline support)
├── icons/          — App icons for all sizes
└── images/         — Onboarding and feature backgrounds
```

---

## Firestore Security Rules

Add these rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /checks/{checkId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Local Testing

ES modules require a web server. Run one of these in the `safesignal/` folder:

```bash
npx serve .            # Node.js
python3 -m http.server # Python
```

Then open `http://localhost:3000` (or the port shown).

---

## Security Note

The Gemini API key is visible in `config.js` since this is a client-side app. For production with high traffic:
1. Create a **Firebase Function** that proxies Gemini requests
2. Move the API key to the function's environment variables
3. Update `callGemini()` in `app.js` to call your function URL instead

---

## Free Tier Limits

- **5 checks per day** (resets at midnight local time)
- Check history stored in Firestore
- Offline support via service worker caching
