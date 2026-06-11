// ============================================================
//  SafeSignal — Configuration
//  Fill in your own keys before hosting.
//  This file exports everything as window globals for app.js
// ============================================================

// --- Firebase ---
// Get from: https://console.firebase.google.com
// Project Settings → Your apps → Web app → Config
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyC9jF-ocy6HjsVzWVVlAyXW-4aIFgA79-A",
  authDomain: "crypto-6517d.firebaseapp.com",
  projectId: "crypto-6517d",
  storageBucket: "crypto-6517d.firebasestorage.app",
  messagingSenderId: "60263975159",
  appId: "1:60263975159:web:bd53dcaad86d6ed9592bf2"
};

// --- Groq AI ---
// Free key at: https://console.groq.com → API Keys → Create API Key
// ⚠️  For production, proxy this through a backend function to keep the key secret
window.GROQ_API_KEY = "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";
window.GROQ_MODEL   = "llama-3.3-70b-versatile";

// --- Cloudinary (optional — for screenshot uploads) ---
// Get from: https://cloudinary.com → Settings → Upload → Upload presets
// Create an *unsigned* upload preset
window.CLOUDINARY_CONFIG = {
  cloudName:    "YOUR_CLOUD_NAME",
  uploadPreset: "YOUR_UNSIGNED_UPLOAD_PRESET"
};

// --- App constants ---
window.APP_CONFIG = {
  name:             "SafeSignal",
  version:          "1.0.0",
  freeChecksPerDay: 5
};
