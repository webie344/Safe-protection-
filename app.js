// ============================================================
//  SafeSignal — Main Application
//  SPA with Firebase Auth, Firestore, Groq AI, Cloudinary
// ============================================================

import { initializeApp }                              from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, GoogleAuthProvider,
         signInWithPopup, onAuthStateChanged,
         signOut as fbSignOut, updateProfile }         from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc,
         addDoc, collection, query, orderBy,
         limit, getDocs, updateDoc, increment,
         arrayUnion, arrayRemove,
         serverTimestamp }                             from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const { FIREBASE_CONFIG, GROQ_API_KEY, GROQ_MODEL, CLOUDINARY_CONFIG, APP_CONFIG } = window;

// ============================================================
// 1. Firebase Init
// ============================================================
let firebaseApp, auth, db;
try {
  firebaseApp = initializeApp(FIREBASE_CONFIG);
  auth        = getAuth(firebaseApp);
  db          = getFirestore(firebaseApp);
} catch (e) {
  console.error('Firebase init failed. Check FIREBASE_CONFIG in config.js', e);
}

// ============================================================
// 2. State
// ============================================================
const state = {
  user:          null,
  checksToday:   0,
  installPrompt: null,
};

// ============================================================
// 3. SVG Icon Library
// ============================================================
const ICONS = {
  home:       `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>`,
  history:    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>`,
  community:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  profile:    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  shield:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  bitcoin:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
  globe:      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
  message:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  file:       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  thumbsUp:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>`,
  thumbsDown: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>`,
  back:       `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  upload:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  copy:       `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`,
  replyIcon:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
};

function typeIcon(type) {
  return ({ truth: ICONS.shield, crypto: ICONS.bitcoin, website: ICONS.globe, reply: ICONS.message, explain: ICONS.file })[type] || ICONS.shield;
}

// ============================================================
// 4. Inject styles for new feed/detail elements ONLY
// ============================================================
(function injectFeedStyles() {
  const s = document.createElement('style');
  s.textContent = `
    /* Community feed page */
    .community-page { min-height: 100vh; padding-bottom: 80px; }
    .community-header { padding: 52px 20px 12px; }
    .community-header h2 { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--text); }
    .community-header p  { color: var(--text2); font-size: 13px; margin-top: 4px; }

    /* Feed list */
    .feed-list { display: flex; flex-direction: column; }
    .feed-post { padding: 16px 20px; border-bottom: 1px solid var(--border); }
    .feed-post:last-child { border-bottom: none; }

    /* Post header */
    .feed-post-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .feed-type-dot { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .feed-meta { flex: 1; min-width: 0; }
    .feed-author-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .feed-author { font-size: 13px; font-weight: 700; color: var(--text); }
    .feed-sep { color: var(--text3); font-size: 12px; }
    .feed-type-name { font-size: 12px; color: var(--text2); }
    .feed-time { font-size: 11px; color: var(--text3); margin-left: auto; flex-shrink: 0; }

    /* Input preview */
    .feed-input-preview { font-size: 13px; color: var(--text2); line-height: 1.5; margin-bottom: 10px; background: var(--bg3,rgba(255,255,255,0.04)); border-radius: 8px; padding: 10px 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    /* Result section inside feed */
    .feed-result { margin-bottom: 10px; }

    /* Compact truth/crypto/website result */
    .feed-verdict-block { border-radius: 10px; border: 1px solid; padding: 12px 14px; margin-bottom: 8px; }
    .feed-verdict-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .verdict-chip { display: inline-flex; align-items: center; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; letter-spacing: .04em; }
    .feed-verdict-sub { font-size: 12px; color: var(--text2); }
    .feed-score-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .feed-score-bar { flex: 1; height: 6px; background: var(--bg3); border-radius: 3px; overflow: hidden; }
    .feed-score-fill { height: 100%; border-radius: 3px; }
    .feed-score-num { font-size: 12px; font-weight: 700; min-width: 28px; text-align: right; }
    .feed-explanation { font-size: 13px; color: var(--text2); line-height: 1.55; margin-bottom: 8px; }
    .feed-flags { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 4px; }
    .feed-flag { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 20px; }
    .feed-flags-label { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
    .feed-action { background: var(--bg3); border-radius: 8px; padding: 10px 12px; font-size: 12px; color: var(--text2); line-height: 1.5; margin-bottom: 8px; }
    .feed-action strong { color: var(--text); }

    /* Reply options in feed */
    .feed-replies-label { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px; }
    .feed-replies { display: flex; flex-direction: column; gap: 5px; margin-bottom: 8px; }
    .feed-reply-row { display: flex; align-items: flex-start; gap: 8px; background: var(--bg3,rgba(255,255,255,0.04)); border-radius: 8px; padding: 8px 10px; cursor: pointer; transition: background .15s; }
    .feed-reply-row:hover { background: var(--surface); }
    .feed-reply-icon { flex-shrink: 0; opacity: .7; margin-top: 2px; }
    .feed-reply-body { flex: 1; min-width: 0; }
    .feed-reply-tone { font-size: 11px; font-weight: 700; margin-bottom: 2px; }
    .feed-reply-text { font-size: 13px; color: var(--text); line-height: 1.4; font-style: italic; }

    /* Explain result in feed */
    .feed-key-points { padding-left: 16px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px; }
    .feed-key-points li { font-size: 13px; color: var(--text2); line-height: 1.4; }
    .feed-simplified { background: var(--bg3); border-radius: 8px; padding: 10px 12px; font-size: 13px; color: var(--text2); line-height: 1.6; margin-bottom: 8px; }

    /* Vote buttons */
    .feed-actions { display: flex; align-items: center; gap: 4px; padding-top: 4px; }
    .vote-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; font-size: 12px; font-weight: 500; color: var(--text2); padding: 5px 10px; border-radius: 20px; transition: all .15s; font-family: var(--font); }
    .vote-btn:hover { background: var(--surface); }
    .vote-btn.up-voted   { color: #10B981; background: rgba(16,185,129,.08); }
    .vote-btn.down-voted { color: #EF4444; background: rgba(239,68,68,.08); }

    /* Feed states */
    .feed-empty   { padding: 48px 20px; text-align: center; color: var(--text2); font-size: 14px; line-height: 1.7; }
    .feed-loading { padding: 48px 20px; display: flex; justify-content: center; }

    /* History detail page */
    .hist-detail-page { min-height: 100vh; padding-bottom: 40px; }
    .hist-detail-header { display: flex; align-items: center; gap: 12px; padding: 52px 20px 16px; }
    .hist-detail-header h2 { font-family: var(--font-display); font-size: 20px; font-weight: 700; }
    .hist-detail-meta { padding: 0 20px 14px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .hist-detail-type { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
    .hist-detail-date { font-size: 12px; color: var(--text3); }
    .hist-detail-input { margin: 0 16px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 14px; }
    .hist-detail-input label { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .05em; display: block; margin-bottom: 6px; }
    .hist-detail-input p { font-size: 13px; color: var(--text2); line-height: 1.6; word-break: break-word; }
    .hist-detail-body { padding: 0 16px; }

    /* Feature icon override */
    .feature-icon { display: flex; }
    .feature-icon svg { filter: drop-shadow(0 0 6px rgba(255,255,255,.2)); }
  `;
  document.head.appendChild(s);
})();

// ============================================================
// 5. Check Count — Firestore-backed
// ============================================================
async function loadCheckCount() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.user && db) {
    try {
      const snap = await getDoc(doc(db, 'users', state.user.uid));
      if (snap.exists()) {
        const d = snap.data();
        state.checksToday = d.checksDate === today ? (d.checksToday || 0) : 0;
        return;
      }
    } catch(e) {}
  }
  const stored = JSON.parse(localStorage.getItem('ss_checks') || '{"count":0,"date":""}');
  state.checksToday = stored.date === today ? stored.count : 0;
}

async function saveCheckCount() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.user && db) {
    try {
      await setDoc(doc(db, 'users', state.user.uid), { checksDate: today, checksToday: state.checksToday }, { merge: true });
      return;
    } catch(e) {}
  }
  localStorage.setItem('ss_checks', JSON.stringify({ count: state.checksToday, date: today }));
}

function canCheck() { return state.checksToday < APP_CONFIG.freeChecksPerDay; }

// ============================================================
// 6. Router
// ============================================================
const $app = document.getElementById('app');

function render(html) {
  $app.innerHTML = html;
  $app.querySelectorAll('.anim-fade-up').forEach((el, i) => { el.style.animationDelay = `${i * 0.06}s`; });
}

window.navigate = function(hash) { window.location.hash = hash; };

function handleRoute() {
  const hash      = window.location.hash || '#/';
  const onboarded = localStorage.getItem('ss_onboarded');
  if (!state.user) {
    if (!onboarded)              { renderOnboarding(0); return; }
    if (hash.includes('signup')) { renderAuth('signup'); return; }
    renderAuth('login'); return;
  }
  if (hash === '#/' || hash === '#/home' || hash === '') { renderHome(); return; }
  if (hash.startsWith('#/check/'))   { renderCheckPage(hash.replace('#/check/', '')); return; }
  if (hash === '#/history')          { renderHistory(); return; }
  if (hash === '#/community')        { renderCommunity(); return; }
  if (hash === '#/profile')          { renderProfile(); return; }
  renderHome();
}

window.addEventListener('hashchange', handleRoute);

// ============================================================
// 7. Auth Functions
// ============================================================
async function signIn(email, pass)       { return signInWithEmailAndPassword(auth, email, pass); }
async function signUp(email, pass, name) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(cred.user, { displayName: name });
  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      name, email, plan: 'free', checksToday: 0,
      checksDate: new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp()
    });
  } catch(e) {}
  return cred;
}
async function signInGoogle() { return signInWithPopup(auth, new GoogleAuthProvider()); }
async function doSignOut()    { await fbSignOut(auth); navigate('#/auth'); }

function friendlyAuthError(code) {
  return ({
    'auth/invalid-email':          'Invalid email address.',
    'auth/user-not-found':         'No account with this email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-credential':     'Invalid email or password.',
    'auth/email-already-in-use':   'Email already in use.',
    'auth/weak-password':          'Password must be 6+ characters.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user':   null,
  }[code]) ?? 'Something went wrong. Please try again.';
}

// ============================================================
// 8. Firestore — History & Public Feed
// ============================================================
async function saveCheck(type, input, result) {
  if (!state.user || !db) return;
  try {
    await addDoc(collection(db, 'users', state.user.uid, 'checks'), {
      type, input: input.slice(0, 1000), result, createdAt: serverTimestamp(),
    });
  } catch(e) {}
}

async function fetchHistory() {
  if (!state.user || !db) return [];
  try {
    const q    = query(collection(db, 'users', state.user.uid, 'checks'), orderBy('createdAt', 'desc'), limit(30));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) { return []; }
}

async function fetchHistoryItem(id) {
  if (!state.user || !db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', state.user.uid, 'checks', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch(e) { return null; }
}

async function saveToPublicFeed(type, input, result) {
  if (!state.user || !db) return;
  try {
    await addDoc(collection(db, 'public_feed'), {
      type,
      input:       input.slice(0, 500),
      result,                          // full result object stored for display
      authorName:  state.user.displayName?.split(' ')[0] || 'Anonymous',
      authorId:    state.user.uid,
      createdAt:   serverTimestamp(),
      upvotes:     0,
      downvotes:   0,
      upvoters:    [],
      downvoters:  [],
    });
  } catch(e) {}
}

async function fetchPublicFeed() {
  if (!db) return [];
  try {
    const q    = query(collection(db, 'public_feed'), orderBy('createdAt', 'desc'), limit(30));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) { return []; }
}

// ============================================================
// 9. Voting
// ============================================================
window._vote = async function(postId, voteType) {
  if (!state.user) { showToast('Sign in to vote', 'warn'); return; }
  const uid = state.user.uid;
  const ref = doc(db, 'public_feed', postId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const d       = snap.data();
    const hasUp   = (d.upvoters   || []).includes(uid);
    const hasDown = (d.downvoters || []).includes(uid);
    const updates = {};
    if (voteType === 'up') {
      if (hasUp)  { updates.upvotes = increment(-1); updates.upvoters = arrayRemove(uid); }
      else        { updates.upvotes = increment(1);  updates.upvoters = arrayUnion(uid);
        if (hasDown) { updates.downvotes = increment(-1); updates.downvoters = arrayRemove(uid); }
      }
    } else {
      if (hasDown){ updates.downvotes = increment(-1); updates.downvoters = arrayRemove(uid); }
      else        { updates.downvotes = increment(1);  updates.downvoters = arrayUnion(uid);
        if (hasUp) { updates.upvotes = increment(-1); updates.upvoters = arrayRemove(uid); }
      }
    }
    await updateDoc(ref, updates);
    await _refreshFeedInPlace();
  } catch(e) { showToast('Vote failed. Try again.', 'error'); }
};

async function _refreshFeedInPlace() {
  const container = document.getElementById('feed-container');
  if (!container) return;
  const posts = await fetchPublicFeed();
  container.innerHTML = buildFeedHTML(posts);
}

// ============================================================
// 10. Feed HTML — renders full analysis results inline
// ============================================================
const TONE_COLORS  = { Polite: '#00D4FF', Neutral: '#9CA3AF', Assertive: '#EF4444', Flirty: '#EC4899' };
const TYPE_NAMES   = { truth:'Truth Check', crypto:'Crypto Check', website:'Website Safety', reply:'Reply Helper', explain:'Message Explainer' };
const TYPE_COLORS  = { truth:'#00D4FF', crypto:'#F59E0B', website:'#7C3AED', reply:'#10B981', explain:'#A855F7' };

function buildFeedHTML(posts) {
  const uid = state.user?.uid || '';
  if (!posts.length) return `<div class="feed-empty">No checks yet.<br>Be the first to run an analysis!</div>`;

  return `<div class="feed-list">${posts.map(p => {
    const tcolor  = TYPE_COLORS[p.type] || '#00D4FF';
    const hasUp   = (p.upvoters   || []).includes(uid);
    const hasDown = (p.downvoters || []).includes(uid);
    const timeStr = p.createdAt?.toDate ? fmtTimeAgo(p.createdAt.toDate()) : '';

    return `
    <div class="feed-post">
      <div class="feed-post-header">
        <div class="feed-type-dot" style="background:${tcolor}18;color:${tcolor}">${typeIcon(p.type)}</div>
        <div class="feed-meta">
          <div class="feed-author-row">
            <span class="feed-author">${escHtml(p.authorName)}</span>
            <span class="feed-sep">·</span>
            <span class="feed-type-name">${TYPE_NAMES[p.type] || p.type}</span>
            <span class="feed-time">${timeStr}</span>
          </div>
        </div>
      </div>
      <div class="feed-input-preview">${escHtml((p.input || '').slice(0, 160))}${(p.input?.length ?? 0) > 160 ? '…' : ''}</div>
      <div class="feed-result">${buildFeedResult(p.type, p.result, p.id)}</div>
      <div class="feed-actions">
        <button class="vote-btn ${hasUp   ? 'up-voted'   : ''}" onclick="window._vote('${p.id}','up')">
          ${ICONS.thumbsUp}<span>${p.upvotes || 0}</span>
        </button>
        <button class="vote-btn ${hasDown ? 'down-voted' : ''}" onclick="window._vote('${p.id}','down')">
          ${ICONS.thumbsDown}<span>${p.downvotes || 0}</span>
        </button>
      </div>
    </div>`;
  }).join('')}</div>`;
}

// Renders the actual analysis result compactly inside a feed post
function buildFeedResult(type, d, postId) {
  if (!d) return '';
  if (type === 'truth')   return _feedTruth(d);
  if (type === 'crypto')  return _feedCrypto(d);
  if (type === 'website') return _feedWebsite(d);
  if (type === 'reply')   return _feedReply(d, postId);
  if (type === 'explain') return _feedExplain(d);
  return '';
}

function _feedTruth(d) {
  const { color, bg } = riskStyle(d.riskLevel);
  const flags = (d.redFlags || []).slice(0, 4);
  return `
    <div class="feed-verdict-block" style="background:${bg};border-color:${color}30">
      <div class="feed-verdict-top">
        <span class="verdict-chip" style="background:${color};color:#000">${d.riskLevel} RISK</span>
        <span class="feed-verdict-sub">${d.verdict || ''}</span>
      </div>
      <div class="feed-score-row">
        <div class="feed-score-bar"><div class="feed-score-fill" style="width:${d.riskScore}%;background:${color}"></div></div>
        <span class="feed-score-num" style="color:${color}">${d.riskScore}/100</span>
      </div>
      ${d.explanation ? `<p class="feed-explanation">${escHtml(d.explanation)}</p>` : ''}
      ${flags.length ? `
        <p class="feed-flags-label">⚠️ Red Flags</p>
        <div class="feed-flags">${flags.map(f => `<span class="feed-flag" style="background:#EF444418;color:#EF4444;border:1px solid #EF444430">${escHtml(f)}</span>`).join('')}</div>` : ''}
      ${d.suggestedAction ? `<div class="feed-action"><strong>Action:</strong> ${escHtml(d.suggestedAction)}</div>` : ''}
    </div>`;
}

function _feedCrypto(d) {
  const { color, bg } = riskStyle(d.verdict);
  const indicators = (d.scamIndicators || []).slice(0, 4);
  return `
    <div class="feed-verdict-block" style="background:${bg};border-color:${color}30">
      <div class="feed-verdict-top">
        <span class="verdict-chip" style="background:${color};color:#000">${d.verdict}</span>
        <span class="feed-verdict-sub">Risk Score: ${d.riskScore}/100</span>
      </div>
      <div class="feed-score-row">
        <div class="feed-score-bar"><div class="feed-score-fill" style="width:${d.riskScore}%;background:${color}"></div></div>
        <span class="feed-score-num" style="color:${color}">${d.riskScore}</span>
      </div>
      ${d.explanation ? `<p class="feed-explanation">${escHtml(d.explanation)}</p>` : ''}
      ${indicators.length ? `
        <p class="feed-flags-label">🚨 Scam Indicators</p>
        <div class="feed-flags">${indicators.map(f => `<span class="feed-flag" style="background:#EF444418;color:#EF4444;border:1px solid #EF444430">${escHtml(f)}</span>`).join('')}</div>` : ''}
      ${d.recommendation ? `<div class="feed-action"><strong>Recommendation:</strong> ${escHtml(d.recommendation)}</div>` : ''}
    </div>`;
}

function _feedWebsite(d) {
  const { color, bg } = riskStyle(d.verdict);
  const signals = (d.suspiciousSignals || []).slice(0, 4);
  return `
    <div class="feed-verdict-block" style="background:${bg};border-color:${color}30">
      <div class="feed-verdict-top">
        <span class="verdict-chip" style="background:${color};color:#000">${d.verdict}</span>
        <span class="feed-verdict-sub">Safety: ${d.safetyScore}/100</span>
      </div>
      <div class="feed-score-row">
        <div class="feed-score-bar"><div class="feed-score-fill" style="width:${d.safetyScore}%;background:${color}"></div></div>
        <span class="feed-score-num" style="color:${color}">${d.safetyScore}</span>
      </div>
      ${d.explanation ? `<p class="feed-explanation">${escHtml(d.explanation)}</p>` : ''}
      ${signals.length ? `
        <p class="feed-flags-label">🚨 Suspicious Signals</p>
        <div class="feed-flags">${signals.map(f => `<span class="feed-flag" style="background:#EF444418;color:#EF4444;border:1px solid #EF444430">${escHtml(f)}</span>`).join('')}</div>` : ''}
      ${d.recommendation ? `<div class="feed-action"><strong>Recommendation:</strong> ${escHtml(d.recommendation)}</div>` : ''}
    </div>`;
}

// Feed reply store keyed by postId+index to avoid collisions across posts
window._feedReplyStore = {};

function _feedReply(d, postId) {
  const replies = d.replies || [];
  const storeKey = postId || ('feed_' + Date.now());
  window._feedReplyStore[storeKey] = replies.map(r => r.text);
  return `
    <div style="margin-bottom:4px">
      ${d.context ? `<p class="feed-explanation" style="margin-bottom:8px">📝 ${escHtml(d.context)}</p>` : ''}
      <p class="feed-replies-label">Reply options</p>
      <div class="feed-replies">
        ${replies.map((r, i) => {
          const rc = TONE_COLORS[r.tone] || '#00D4FF';
          return `<div class="feed-reply-row" onclick="window._copyFeedReplyByKey('${storeKey}',${i},'${escHtml(r.tone)}')">
            <span class="feed-reply-icon" style="color:${rc}">${ICONS.replyIcon}</span>
            <div class="feed-reply-body">
              <div class="feed-reply-tone" style="color:${rc}">${r.emoji || ''} ${escHtml(r.tone)}</div>
              <div class="feed-reply-text">"${escHtml(r.text)}"</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

window._copyFeedReplyByKey = function(storeKey, index, tone) {
  const texts = window._feedReplyStore[storeKey];
  const text  = texts && texts[index];
  if (!text) return;
  copyText(text)
    .then(() => showToast(`${tone} reply copied!`, 'success'))
    .catch(() => showToast('Copy failed.', 'error'));
};

function _feedExplain(d) {
  const { color, bg } = riskStyle(d.urgency);
  const points = (d.keyPoints || []).slice(0, 4);
  return `
    <div class="feed-verdict-block" style="background:${bg};border-color:${color}30">
      <div class="feed-verdict-top">
        <span class="verdict-chip" style="background:${color};color:#000">${d.urgency} URGENCY</span>
        <span class="feed-verdict-sub">${escHtml(d.summary || '')}</span>
      </div>
      ${points.length ? `
        <ul class="feed-key-points">${points.map(p => `<li>${escHtml(p)}</li>`).join('')}</ul>` : ''}
      ${d.actionRequired && d.action ? `<div class="feed-action"><strong>Action Required:</strong> ${escHtml(d.action)}</div>` : ''}
      ${d.simplifiedText ? `<div class="feed-simplified">${escHtml(d.simplifiedText)}</div>` : ''}
    </div>`;
}


function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtTimeAgo(d) {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60)    return 'just now';
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================
// 11. AI Analysis (Groq)
// ============================================================
const PROMPTS = {
  truth: `You are a cybersecurity expert. Analyze this message for scams, phishing, manipulation, or safety risks.
Return ONLY valid JSON (no markdown fences, no extra text):
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "riskScore": <integer 0-100>,
  "verdict": "<one sentence verdict>",
  "explanation": "<2-3 sentences>",
  "redFlags": ["<flag>"],
  "greenFlags": ["<signal>"],
  "suggestedAction": "<clear action>"
}`,
  crypto: `You are a senior cryptocurrency analyst and fraud expert with deep knowledge of blockchain markets, tokenomics, and investment timing. Analyze the crypto coin, token, or investment opportunity provided.
Return ONLY valid JSON (no markdown fences, no extra text):
{
  "riskScore": <integer 0-100>,
  "verdict": "SCAM" | "SUSPICIOUS" | "RISKY" | "LEGITIMATE",
  "coinName": "<full coin or token name>",
  "ticker": "<ticker symbol e.g. BTC>",
  "marketCap": "<estimated or known market cap e.g. $850B or Unknown>",
  "currentPriceEstimate": "<estimated price range or last known price>",
  "priceOutlook": "BULLISH" | "BEARISH" | "NEUTRAL" | "UNKNOWN",
  "riseOrFallAnalysis": "<3-5 sentences analyzing factors that could push price up OR down, including on-chain data, market sentiment, macro trends, developer activity, and adoption signals>",
  "probabilityOfRise": <integer 0-100, your estimated % chance of significant price increase in next 90 days>,
  "probabilityOfFall": <integer 0-100, your estimated % chance of significant price decrease in next 90 days>,
  "bestTimeToInvest": "<Detailed advice: is now a good time? What market conditions to watch for? What price levels or signals would indicate a better entry? Be specific.>",
  "explanation": "<4-6 sentences giving a thorough assessment of legitimacy, team credibility, use case, whitepaper quality, community strength, and exchange listings>",
  "scamIndicators": ["<specific red flag>"],
  "positiveSignals": ["<specific positive signal>"],
  "marketTrustSummary": "<3-4 sentences on market reputation, trading volume credibility, institutional interest, and community trust>",
  "warningNotes": ["<specific warning>"],
  "keyRisks": ["<major investment risk>"],
  "recommendation": "<clear, detailed action plan — should someone buy, avoid, research more, or dollar-cost average? Include specific conditions to watch.>"
}`,
  website: `You are a web security expert. Analyze this URL or website for phishing, fraud, or malware.
Return ONLY valid JSON:
{
  "safetyScore": <integer 0-100>,
  "verdict": "SAFE" | "SUSPICIOUS" | "DANGEROUS",
  "suspiciousSignals": ["<signal>"],
  "trustSignals": ["<signal>"],
  "phishingRisk": "LOW" | "MEDIUM" | "HIGH",
  "explanation": "<2-3 sentences>",
  "recommendation": "<clear action>"
}`,
  reply: `You are an expert social communicator and relationship coach. Read the message carefully, understand the context, relationship dynamic, and emotional subtext, then craft 4 highly tailored, natural-sounding reply options.

CRITICAL RULES:
- Each reply must be specific to the actual message content — NO generic replies
- Replies should sound like a real person wrote them, not an AI template
- The Flirty reply MUST be genuinely flirty: playful, teasing, suggestive, charming, witty, and confidence-exuding. Use banter, light teasing, double meanings, and leave them wanting more. Do NOT be vague or mild — make it unmistakably flirty.
- The Polite reply should be warm, considerate, and show genuine care
- The Assertive reply should be direct, confident, and firm without being rude
- The Neutral reply should be matter-of-fact and balanced

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "context": "<3-4 sentences analyzing the message: what it's really saying, the emotional tone, the relationship dynamic implied, and what the sender likely wants>",
  "replies": [
    { "tone": "Polite",    "emoji": "😊", "text": "<warm, thoughtful, specific reply — 1-3 sentences>", "note": "<when this reply works best and what outcome it creates>" },
    { "tone": "Neutral",   "emoji": "😐", "text": "<balanced, matter-of-fact reply — 1-2 sentences>", "note": "<when this reply works best and what outcome it creates>" },
    { "tone": "Assertive", "emoji": "💪", "text": "<confident, direct reply that sets boundaries or makes a point clearly — 1-2 sentences>", "note": "<when this reply works best and what outcome it creates>" },
    { "tone": "Flirty",   "emoji": "😉", "text": "<genuinely flirty reply — playful, teasing, witty, with charm and confidence. Should make them smile, blush, or want to keep the conversation going. 1-3 sentences>", "note": "<when this reply works best and what vibe it creates>" }
  ]
}`,
  explain: `You are an expert at simplifying complex official or confusing messages.
Return ONLY valid JSON:
{
  "summary": "<1-2 sentence plain English summary>",
  "keyPoints": ["<point>"],
  "actionRequired": <true|false>,
  "action": "<specific action or null>",
  "deadline": "<deadline or null>",
  "sender": "<who sent this or type of org>",
  "urgency": "LOW" | "MEDIUM" | "HIGH",
  "simplifiedText": "<full message rewritten simply>"
}`,
};

async function callGemini(systemPrompt, userMessage) {
  if (!window.GROQ_API_KEY || window.GROQ_API_KEY === 'YOUR_GROQ_API_KEY') {
    throw Object.assign(new Error('SETUP_REQUIRED'), { code: 'SETUP_REQUIRED' });
  }
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${window.GROQ_API_KEY}` },
    body: JSON.stringify({
      model:           window.GROQ_MODEL,
      messages:        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
      response_format: { type: 'json_object' },
      max_tokens:      2500,
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'AI analysis failed');
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response from AI');
  return JSON.parse(raw);
}

// ============================================================
// 12. Cloudinary Upload
// ============================================================
async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, { method: 'POST', body: fd });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
}

// ============================================================
// 13. Utils
// ============================================================
function showToast(msg, type = 'info') {
  document.getElementById('toast')?.remove();
  const C = { info: '#00D4FF', success: '#10B981', error: '#EF4444', warn: '#F59E0B' };
  const I = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
  const t = document.createElement('div');
  t.id = 'toast';
  Object.assign(t.style, {
    position: 'fixed', bottom: '80px', left: '50%',
    transform: 'translateX(-50%) translateY(80px)',
    background: `${C[type]}18`, border: `1px solid ${C[type]}40`,
    color: C[type], padding: '12px 20px', borderRadius: '12px',
    fontSize: '14px', fontWeight: '500', zIndex: '9999',
    backdropFilter: 'blur(16px)', transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
    display: 'flex', alignItems: 'center', gap: '8px',
    maxWidth: 'calc(100vw - 32px)',
    fontFamily: 'Inter,sans-serif', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  });
  t.innerHTML = `${I[type]} ${msg}`;
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.transform = 'translateX(-50%) translateY(0)'; });
  setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(80px)'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3600);
}

// Clipboard copy with fallback for non-HTTPS contexts
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  Object.assign(ta.style, { position: 'fixed', opacity: '0', pointerEvents: 'none' });
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, 99999);
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
  return Promise.resolve();
}

function riskStyle(key) {
  const map = {
    LOW:        { color: '#10B981', bg: 'rgba(16,185,129,0.08)'  },
    MEDIUM:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
    HIGH:       { color: '#EF4444', bg: 'rgba(239,68,68,0.08)'   },
    SAFE:       { color: '#10B981', bg: 'rgba(16,185,129,0.08)'  },
    SUSPICIOUS: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
    DANGEROUS:  { color: '#EF4444', bg: 'rgba(239,68,68,0.08)'   },
    SCAM:       { color: '#EF4444', bg: 'rgba(239,68,68,0.08)'   },
    RISKY:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
    LEGITIMATE: { color: '#10B981', bg: 'rgba(16,185,129,0.08)'  },
  };
  if (typeof key === 'number') { if (key <= 30) return map.LOW; if (key <= 65) return map.MEDIUM; return map.HIGH; }
  return map[key] ?? map.MEDIUM;
}

function scoreBar(score, color) {
  return `<div class="score-bar-wrap">
    <div class="score-bar"><div class="score-fill" style="width:${score}%;background:${color}"></div></div>
    <span class="score-num" style="color:${color}">${score}</span>
  </div>`;
}

function tags(items, color) {
  if (!items?.length) return `<p class="no-items">None detected</p>`;
  return `<div class="tag-list">${items.map(i =>
    `<span class="tag" style="background:${color}18;color:${color};border:1px solid ${color}30">${i}</span>`
  ).join('')}</div>`;
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function featureCfg(type) {
  return ({
    truth:   { name: 'Truth Check',       icon: ICONS.shield,  desc: 'Is this message safe or a scam?',       color: '#00D4FF', bg: 'images/bg-truth.png',   ph: 'Paste the suspicious message here...' },
    crypto:  { name: 'Crypto Check',      icon: ICONS.bitcoin, desc: 'Is this investment legit or fake?',     color: '#F59E0B', bg: 'images/onboard-3.png',  ph: 'Paste coin name, promo, or message...' },
    website: { name: 'Website Safety',    icon: ICONS.globe,   desc: 'Is this website safe or phishing?',     color: '#7C3AED', bg: 'images/bg-website.png', ph: 'Paste URL or website name...' },
    reply:   { name: 'Reply Helper',      icon: ICONS.message, desc: 'Get the perfect reply for any message', color: '#10B981', bg: 'images/bg-reply.png',   ph: 'Paste the message you received...' },
    explain: { name: 'Message Explainer', icon: ICONS.file,    desc: 'Understand any confusing message',      color: '#A855F7', bg: 'images/bg-explain.png', ph: 'Paste the confusing message here...' },
  })[type] ?? { name: type, icon: ICONS.shield, desc: '', color: '#00D4FF', bg: '', ph: '' };
}

function bottomNav(active) {
  const tabs = [
    { id: 'home',      label: 'Home',      icon: ICONS.home,      hash: '#/home'      },
    { id: 'history',   label: 'History',   icon: ICONS.history,   hash: '#/history'   },
    { id: 'community', label: 'Community', icon: ICONS.community, hash: '#/community' },
    { id: 'profile',   label: 'Profile',   icon: ICONS.profile,   hash: '#/profile'   },
  ];
  return `<div class="bottom-nav">${tabs.map(t => `
    <button class="nav-btn ${active === t.id ? 'active' : ''}" onclick="navigate('${t.hash}')">
      ${t.icon}
      <span>${t.label}</span>
    </button>`).join('')}</div>`;
}

// ============================================================
// 14. Page: Splash
// ============================================================
function renderSplash() {
  render(`
    <div class="splash">
      <div class="splash-logo anim-scale-in">
        <img src="icons/icon-512.png" alt="SafeSignal" class="splash-icon anim-float" onerror="this.style.visibility='hidden'">
        <h1 class="splash-title">Safe<span>Signal</span></h1>
      </div>
      <p class="splash-tagline anim-fade-up">Your AI safety shield</p>
      <div class="splash-loader"><div class="splash-bar"></div></div>
    </div>`);
}

// ============================================================
// 15. Page: Onboarding
// ============================================================
const SLIDES = [
  { img: 'images/onboard-1.png', title: 'Stay Protected Online',
    desc: 'SafeSignal uses advanced AI to detect scams, phishing, and manipulation before they can harm you. Real-time analysis in under 5 seconds.' },
  { img: 'images/onboard-2.png', title: 'Detect Scams Instantly',
    desc: 'Paste any suspicious message, link, or crypto offer and get a risk score, red flags, and a clear action plan — instantly.' },
  { img: 'images/onboard-3.png', title: 'Stay Smart. Stay Safe.',
    desc: '5 powerful tools in one app: Truth Check, Crypto Check, Website Safety, Reply Helper, and Message Explainer.' },
];

function renderOnboarding(slide = 0) {
  const s = SLIDES[Math.min(slide, SLIDES.length - 1)];
  const isLast = slide === SLIDES.length - 1;
  render(`
    <div class="onboard">
      <div class="onboard-img-wrap">
        <img src="${s.img}" alt="${s.title}" class="onboard-img" onerror="this.style.background='linear-gradient(135deg,#0D1526 0%,#111E35 100%)'">
        <div class="onboard-img-overlay"></div>
      </div>
      <div class="onboard-content anim-fade-up">
        <div class="onboard-dots">
          ${SLIDES.map((_, i) => `<span class="onboard-dot ${i === slide ? 'active' : ''}"></span>`).join('')}
        </div>
        <h2 class="onboard-title">${s.title}</h2>
        <p class="onboard-desc">${s.desc}</p>
        <button class="btn-primary btn-full" onclick="window._obNext(${slide})">
          ${isLast ? 'Get Started Free' : 'Next <span class="btn-arrow">→</span>'}
        </button>
        ${slide > 0
          ? `<button class="btn-ghost" onclick="window._obBack(${slide})">Back</button>`
          : `<button class="btn-ghost" onclick="window._obSkip()">Skip</button>`}
      </div>
    </div>`);
}

window._obNext = (slide) => {
  if (slide < SLIDES.length - 1) { renderOnboarding(slide + 1); }
  else { localStorage.setItem('ss_onboarded', '1'); navigate('#/auth'); }
};
window._obBack = (slide) => renderOnboarding(slide - 1);
window._obSkip = ()      => { localStorage.setItem('ss_onboarded', '1'); navigate('#/auth'); };

// ============================================================
// 16. Page: Auth
// ============================================================
function renderAuth(mode = 'login') {
  render(`
    <div class="auth-page">
      <div class="auth-header">
        <img src="icons/icon-512.png" alt="SafeSignal" class="auth-logo" onerror="this.style.display='none'">
        <h1 class="auth-brand">Safe<span>Signal</span></h1>
        <p class="auth-sub">Your AI-powered safety assistant</p>
      </div>
      <div class="auth-card anim-fade-up">
        <div class="auth-tabs">
          <button class="auth-tab ${mode==='login'  ? 'active':''}" onclick="renderAuth('login')">Login</button>
          <button class="auth-tab ${mode==='signup' ? 'active':''}" onclick="renderAuth('signup')">Sign Up</button>
        </div>
        ${mode === 'login' ? `
          <form id="authForm" onsubmit="window._authSubmit(event,'login')">
            <div class="form-group"><label class="form-label">Email</label>
              <input type="email" id="aEmail" class="form-input" placeholder="you@example.com" required></div>
            <div class="form-group"><label class="form-label">Password</label>
              <input type="password" id="aPass" class="form-input" placeholder="••••••••" required></div>
            <button type="submit" id="aBtn" class="btn-primary btn-full">Login to SafeSignal</button>
          </form>` : `
          <form id="authForm" onsubmit="window._authSubmit(event,'signup')">
            <div class="form-group"><label class="form-label">Full Name</label>
              <input type="text" id="aName" class="form-input" placeholder="Your Name" required></div>
            <div class="form-group"><label class="form-label">Email</label>
              <input type="email" id="aEmail" class="form-input" placeholder="you@example.com" required></div>
            <div class="form-group"><label class="form-label">Password</label>
              <input type="password" id="aPass" class="form-input" placeholder="Min 6 characters" minlength="6" required></div>
            <button type="submit" id="aBtn" class="btn-primary btn-full">Create Account</button>
          </form>`}
        <div class="auth-divider"><span>or continue with</span></div>
        <button class="btn-google" onclick="window._googleAuth()">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
      <p class="auth-footer">By continuing you agree to our
        <a href="#" class="auth-link">Terms</a> &amp;
        <a href="#" class="auth-link">Privacy Policy</a></p>
    </div>`);
}

window.renderAuth = renderAuth;

window._authSubmit = async function(e, mode) {
  e.preventDefault();
  const email = document.getElementById('aEmail').value.trim();
  const pass  = document.getElementById('aPass').value;
  const btn   = document.getElementById('aBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Please wait...';
  try {
    if (mode === 'login') { await signIn(email, pass); }
    else { await signUp(email, pass, document.getElementById('aName')?.value?.trim() || ''); }
    showToast('Welcome to SafeSignal!', 'success');
    navigate('#/home');
  } catch (err) {
    const msg = friendlyAuthError(err.code);
    if (msg) showToast(msg, 'error');
    btn.disabled = false;
    btn.textContent = mode === 'login' ? 'Login to SafeSignal' : 'Create Account';
  }
};

window._googleAuth = async function() {
  try { await signInGoogle(); showToast('Welcome to SafeSignal!', 'success'); navigate('#/home'); }
  catch (err) { const msg = friendlyAuthError(err.code); if (msg) showToast(msg, 'error'); }
};

// ============================================================
// 17. Page: Home
// ============================================================
function renderHome() {
  const left  = APP_CONFIG.freeChecksPerDay - state.checksToday;
  const pct   = (state.checksToday / APP_CONFIG.freeChecksPerDay) * 100;
  const name  = state.user?.displayName?.split(' ')[0] || 'there';
  const cards = [
    { type: 'truth',   icon: ICONS.shield,  name: 'Truth Check',       desc: 'Is this message safe?',     color: '#00D4FF', bg: 'images/bg-truth.png'   },
    { type: 'crypto',  icon: ICONS.bitcoin, name: 'Crypto Check',      desc: 'Is this investment legit?', color: '#F59E0B', bg: 'images/onboard-3.png'  },
    { type: 'website', icon: ICONS.globe,   name: 'Website Safety',    desc: 'Is this site safe?',        color: '#7C3AED', bg: 'images/bg-website.png' },
    { type: 'reply',   icon: ICONS.message, name: 'Reply Helper',      desc: 'Get the perfect reply',     color: '#10B981', bg: 'images/bg-reply.png'   },
    { type: 'explain', icon: ICONS.file,    name: 'Message Explainer', desc: 'Understand any message',    color: '#A855F7', bg: 'images/bg-explain.png' },
  ];

  render(`
    <div class="home">
      <header class="home-header">
        <div>
          <p class="home-greeting">Hey, ${name} 👋</p>
          <h2 class="home-title">What do you want to check?</h2>
        </div>
        <button class="avatar-btn" onclick="navigate('#/profile')" aria-label="Profile">
          ${state.user?.photoURL
            ? `<img src="${state.user.photoURL}" class="avatar" alt="Profile">`
            : `<div class="avatar-placeholder">${(name[0] || 'U').toUpperCase()}</div>`}
        </button>
      </header>
      <div class="usage-bar-wrap">
        <div class="usage-bar-top">
          <span class="usage-label">Free checks today</span>
          <span class="usage-count ${left <= 1 ? 'danger' : left <= 2 ? 'warn' : ''}">${left} / ${APP_CONFIG.freeChecksPerDay} left</span>
        </div>
        <div class="usage-bar">
          <div class="usage-fill ${pct >= 100 ? 'full' : ''}" style="width:${Math.min(pct, 100)}%"></div>
        </div>
        ${left <= 0 ? `<p class="usage-limit-msg">Daily limit reached.
          <a href="#" class="upgrade-link" onclick="showUpgrade(); return false">Upgrade to Pro →</a>
        </p>` : ''}
      </div>
      <div class="feature-grid">
        ${cards.map(c => `
          <div class="feature-card" onclick="navigate('#/check/${c.type}')"
               style="--card-color:${c.color}" role="button" tabindex="0">
            <div class="feature-card-bg" style="background-image:url('${c.bg}')"></div>
            <div class="feature-card-content">
              <span class="feature-icon" style="color:${c.color}">${c.icon}</span>
              <h3 class="feature-name">${c.name}</h3>
              <p class="feature-desc">${c.desc}</p>
              <span class="feature-arrow" style="color:${c.color}">→</span>
            </div>
          </div>`).join('')}
      </div>
      ${bottomNav('home')}
    </div>`);
}

// ============================================================
// 18. Page: Community Feed
// ============================================================
async function renderCommunity() {
  render(`
    <div class="community-page">
      <div class="community-header">
        <h2>Community</h2>
        <p>See what others are checking — real searches, real results.</p>
      </div>
      <div id="feed-container">
        <div class="feed-loading"><span class="spinner large"></span></div>
      </div>
      ${bottomNav('community')}
    </div>`);

  const posts     = await fetchPublicFeed();
  const container = document.getElementById('feed-container');
  if (container) container.innerHTML = buildFeedHTML(posts);
}

// ============================================================
// 19. Page: Check
// ============================================================
function renderCheckPage(type) {
  const cfg = featureCfg(type);
  render(`
    <div class="check-page">
      <div class="check-hero" style="background-image:url('${cfg.bg}')">
        <div class="check-hero-overlay"></div>
        <button class="back-btn" onclick="navigate('#/home')">${ICONS.back} Back</button>
        <div class="check-hero-content">
          <span class="check-hero-icon" style="color:${cfg.color}">${cfg.icon}</span>
          <h1 class="check-hero-title">${cfg.name}</h1>
          <p class="check-hero-desc">${cfg.desc}</p>
        </div>
      </div>
      <div class="check-body anim-fade-up">
        <div class="check-form-card">
          <div class="input-label-row">
            <label class="form-label">Paste your content below</label>
            ${(type === 'truth' || type === 'explain') ? `
              <label class="upload-btn" for="imgUpload" title="Upload screenshot">
                ${ICONS.upload}
                <input type="file" id="imgUpload" accept="image/*" style="display:none" onchange="window._imgUpload(event)">
              </label>` : ''}
          </div>
          <textarea id="checkInput" class="check-textarea" placeholder="${cfg.ph}" rows="5"></textarea>
          <div id="uploadStatus" class="upload-status" style="display:none">
            <span class="upload-spinner">⟳</span> Uploading screenshot...
          </div>
          <button class="btn-primary btn-full check-btn" id="analyzeBtn"
                  style="--btn-color:${cfg.color}"
                  onclick="window._runCheck('${type}')">
            <span>Analyze Now</span>
            <span style="display:flex">${cfg.icon}</span>
          </button>
        </div>
        <div id="resultArea" style="display:none"></div>
      </div>
    </div>`);
}

window._imgUpload = async function(e) {
  const file = e.target.files[0]; if (!file) return;
  if (!CLOUDINARY_CONFIG.cloudName || CLOUDINARY_CONFIG.cloudName === 'YOUR_CLOUD_NAME') {
    showToast('Cloudinary not configured. See config.js.', 'warn'); return;
  }
  const status = document.getElementById('uploadStatus');
  status.style.display = 'flex';
  try {
    const url = await uploadToCloudinary(file);
    const ta  = document.getElementById('checkInput');
    ta.value  = `[Uploaded image: ${url}]\n\n` + ta.value;
    status.style.display = 'none';
    showToast('Screenshot uploaded!', 'success');
  } catch(err) { status.style.display = 'none'; showToast('Upload failed. Check Cloudinary config.', 'error'); }
};

window._runCheck = async function(type) {
  const input = document.getElementById('checkInput')?.value?.trim();
  if (!input) { showToast('Please enter something to analyze.', 'warn'); return; }
  if (!canCheck()) { window.showUpgrade(); return; }

  const btn        = document.getElementById('analyzeBtn');
  const resultArea = document.getElementById('resultArea');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Analyzing...';
  resultArea.style.display = 'none';

  try {
    const result = await callGemini(PROMPTS[type], input);
    state.checksToday++;
    await saveCheckCount();
    await saveCheck(type, input, result);
    await saveToPublicFeed(type, input, result);

    resultArea.style.display = 'block';
    resultArea.innerHTML     = buildResult(type, result);
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast('Analysis complete!', 'success');
  } catch(err) {
    if (err.code === 'SETUP_REQUIRED') { resultArea.style.display = 'block'; resultArea.innerHTML = setupCard(); }
    else { showToast('Analysis failed: ' + err.message, 'error'); }
  }
  btn.disabled = false; btn.innerHTML = '<span>Analyze Again</span>';
};

// ============================================================
// 20. Full Result Builders (used on Check page + History detail)
// ============================================================
function setupCard() {
  return `<div class="result-card setup-card anim-fade-up">
    <div class="setup-icon">🔑</div>
    <h3>API Key Required</h3>
    <p>Add your <strong>free Groq API key</strong> in <code>config.js</code> to enable AI analysis.</p>
    <ol class="setup-steps">
      <li>Visit <a href="https://console.groq.com" target="_blank" rel="noopener">console.groq.com</a> — it's free</li>
      <li>Click <strong>API Keys → Create API Key</strong></li>
      <li>Open <code>config.js</code> → replace <code>YOUR_GROQ_API_KEY</code></li>
      <li>Save and refresh</li>
    </ol>
  </div>`;
}

function buildResult(type, d) {
  if (type === 'truth')   return _truthResult(d);
  if (type === 'crypto')  return _cryptoResult(d);
  if (type === 'website') return _websiteResult(d);
  if (type === 'reply')   return _replyResult(d);
  if (type === 'explain') return _explainResult(d);
  return '<p>No result.</p>';
}

function _copyResultCard() {
  const el = document.querySelector('.hist-detail-body .result-card') || document.querySelector('#resultArea .result-card') || document.querySelector('.result-card');
  if (!el) return;
  copyText(el.innerText).then(() => showToast('Copied to clipboard!', 'success')).catch(() => showToast('Copy failed.', 'error'));
}

function _truthResult(d) {
  const { color, bg } = riskStyle(d.riskLevel);
  return `<div class="result-card anim-fade-up">
    <div class="result-verdict" style="background:${bg};border-color:${color}40">
      <span class="verdict-badge" style="background:${color};color:#000">${d.riskLevel} RISK</span>
      <p class="verdict-text">${d.verdict}</p>
    </div>
    ${scoreBar(d.riskScore, color)}
    <p class="result-explanation">${d.explanation}</p>
    <div class="result-section"><h4 class="section-title red">⚠️ Red Flags</h4>${tags(d.redFlags, '#EF4444')}</div>
    <div class="result-section"><h4 class="section-title green">✅ Positive Signals</h4>${tags(d.greenFlags, '#10B981')}</div>
    <div class="action-box"><h4>💡 Suggested Action</h4><p>${d.suggestedAction}</p></div>
    <button class="btn-secondary btn-full" onclick="_copyResultCard()">${ICONS.copy} Copy Result</button>
  </div>`;
}

function _cryptoResult(d) {
  const { color, bg } = riskStyle(d.verdict);
  const outlookColor = { BULLISH: '#10B981', BEARISH: '#EF4444', NEUTRAL: '#F59E0B', UNKNOWN: '#9CA3AF' }[d.priceOutlook] || '#9CA3AF';
  const riseNum = d.probabilityOfRise ?? 0;
  const fallNum = d.probabilityOfFall ?? 0;
  return `<div class="result-card anim-fade-up">
    <div class="result-verdict" style="background:${bg};border-color:${color}40">
      <span class="verdict-badge" style="background:${color};color:#000">${d.verdict}</span>
      <p class="verdict-text">${d.coinName || ''}${d.ticker ? ` (${d.ticker})` : ''} · Risk Score: ${d.riskScore}/100</p>
    </div>
    ${scoreBar(d.riskScore, color)}

    ${(d.marketCap || d.currentPriceEstimate) ? `
    <div class="info-box" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      ${d.marketCap ? `<div><h4 style="font-size:11px;margin-bottom:2px">💰 Market Cap</h4><p style="font-size:14px;font-weight:700;color:var(--text)">${d.marketCap}</p></div>` : ''}
      ${d.currentPriceEstimate ? `<div><h4 style="font-size:11px;margin-bottom:2px">💵 Price</h4><p style="font-size:14px;font-weight:700;color:var(--text)">${d.currentPriceEstimate}</p></div>` : ''}
    </div>` : ''}

    ${d.priceOutlook ? `
    <div class="info-box" style="margin-bottom:12px">
      <h4>📈 Price Outlook: <span style="color:${outlookColor}">${d.priceOutlook}</span></h4>
      ${d.riseOrFallAnalysis ? `<p style="margin-top:6px;color:var(--text2);font-size:13px;line-height:1.6">${d.riseOrFallAnalysis}</p>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
        <div>
          <p style="font-size:11px;color:var(--text3);margin-bottom:4px">📊 RISE PROBABILITY</p>
          <div style="height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;margin-bottom:4px">
            <div style="height:100%;width:${riseNum}%;background:#10B981;border-radius:3px"></div>
          </div>
          <p style="font-size:13px;font-weight:700;color:#10B981">${riseNum}%</p>
        </div>
        <div>
          <p style="font-size:11px;color:var(--text3);margin-bottom:4px">📉 FALL PROBABILITY</p>
          <div style="height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;margin-bottom:4px">
            <div style="height:100%;width:${fallNum}%;background:#EF4444;border-radius:3px"></div>
          </div>
          <p style="font-size:13px;font-weight:700;color:#EF4444">${fallNum}%</p>
        </div>
      </div>
    </div>` : ''}

    ${d.bestTimeToInvest ? `
    <div class="action-box" style="margin-bottom:12px">
      <h4>⏰ Best Time to Invest</h4><p>${d.bestTimeToInvest}</p>
    </div>` : ''}

    <p class="result-explanation">${d.explanation}</p>
    <div class="result-section"><h4 class="section-title red">🚨 Scam Indicators</h4>${tags(d.scamIndicators, '#EF4444')}</div>
    <div class="result-section"><h4 class="section-title green">✅ Positive Signals</h4>${tags(d.positiveSignals, '#10B981')}</div>
    ${d.warningNotes?.length ? `<div class="result-section"><h4 class="section-title warn">⚠️ Warnings</h4>${tags(d.warningNotes, '#F59E0B')}</div>` : ''}
    ${d.keyRisks?.length ? `<div class="result-section"><h4 class="section-title" style="color:#F59E0B">🔑 Key Risks</h4>${tags(d.keyRisks, '#F59E0B')}</div>` : ''}
    <div class="info-box"><h4>📊 Market Trust</h4><p>${d.marketTrustSummary}</p></div>
    <div class="action-box"><h4>💡 Recommendation</h4><p>${d.recommendation}</p></div>
    <button class="btn-secondary btn-full" onclick="_copyResultCard()">${ICONS.copy} Copy Result</button>
  </div>`;
}

function _websiteResult(d) {
  const { color, bg } = riskStyle(d.verdict);
  return `<div class="result-card anim-fade-up">
    <div class="result-verdict" style="background:${bg};border-color:${color}40">
      <span class="verdict-badge" style="background:${color};color:#000">${d.verdict}</span>
      <p class="verdict-text">Safety Score: ${d.safetyScore}/100</p>
    </div>
    ${scoreBar(d.safetyScore, color)}
    <p class="result-explanation">${d.explanation}</p>
    <div class="result-section"><h4 class="section-title red">🚨 Suspicious Signals</h4>${tags(d.suspiciousSignals, '#EF4444')}</div>
    <div class="result-section"><h4 class="section-title green">✅ Trust Signals</h4>${tags(d.trustSignals, '#10B981')}</div>
    <div class="action-box"><h4>💡 Recommendation</h4><p>${d.recommendation}</p></div>
    <button class="btn-secondary btn-full" onclick="_copyResultCard()">${ICONS.copy} Copy Result</button>
  </div>`;
}

// Store reply texts by index so inline onclick never breaks on special characters
window._replyStore = [];

function _replyResult(d) {
  window._replyStore = (d.replies || []).map(r => r.text);
  return `<div class="result-card anim-fade-up">
    <div class="info-box"><h4>📝 Message Context</h4><p>${escHtml(d.context)}</p></div>
    <h4 class="replies-heading">Choose your reply style:</h4>
    <div class="replies-grid">
      ${(d.replies || []).map((r, i) => {
        const c = TONE_COLORS[r.tone] || '#00D4FF';
        return `<div class="reply-card" style="--reply-color:${c}"
                     onclick="window._copyReply(${i},'${escHtml(r.tone)}')">
          <div class="reply-card-top">
            <span class="reply-tone" style="color:${c}">${r.emoji} ${r.tone}</span>
            <span class="copy-hint">Tap to copy</span>
          </div>
          <p class="reply-text">"${escHtml(r.text)}"</p>
          <p class="reply-note">${escHtml(r.note)}</p>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

window._copyReply = function(index, tone) {
  const text = window._replyStore[index];
  if (!text) return;
  copyText(text)
    .then(() => showToast(`${tone} reply copied!`, 'success'))
    .catch(() => showToast('Copy failed.', 'error'));
};

function _explainResult(d) {
  const { color } = riskStyle(d.urgency);
  return `<div class="result-card anim-fade-up">
    <div class="result-verdict" style="background:${riskStyle(d.urgency).bg};border-color:${color}40">
      <span class="verdict-badge" style="background:${color};color:#000">${d.urgency} URGENCY</span>
      <p class="verdict-text">${d.summary}</p>
    </div>
    ${d.actionRequired ? `<div class="action-box urgent">
      <h4>🚨 Action Required</h4><p>${d.action}</p>
      ${d.deadline ? `<p class="deadline">Deadline: <strong>${d.deadline}</strong></p>` : ''}
    </div>` : ''}
    <div class="result-section">
      <h4 class="section-title">📌 Key Points</h4>
      <ul class="key-points">${(d.keyPoints || []).map(p => `<li>${p}</li>`).join('')}</ul>
    </div>
    ${d.sender ? `<div class="info-box"><h4>From</h4><p>${d.sender}</p></div>` : ''}
    <div class="result-section">
      <h4 class="section-title">📖 In Plain English</h4>
      <div class="simplified-text">${d.simplifiedText}</div>
    </div>
    <button class="btn-secondary btn-full" onclick="_copyResultCard()">${ICONS.copy} Copy Explanation</button>
  </div>`;
}

// Expose helpers used in inline onclick strings
window.copyText          = copyText;
window.showToast         = showToast;
window._copyResultCard   = _copyResultCard;

// ============================================================
// 21. Page: History list + detail
// ============================================================
async function renderHistory() {
  render(`
    <div class="history-page">
      <div class="page-header">
        <button class="back-btn-inline" onclick="navigate('#/home')">${ICONS.back}</button>
        <h2>Check History</h2>
      </div>
      <div id="histList" class="history-list">
        <div class="loading-state"><span class="spinner large"></span><p>Loading...</p></div>
      </div>
      ${bottomNav('history')}
    </div>`);

  const items = await fetchHistory();
  const list  = document.getElementById('histList');
  if (!list) return;

  if (!items.length) {
    list.innerHTML = `<div class="empty-state">
      <span>📭</span><p>No checks yet. Start analyzing!</p>
      <button class="btn-primary" onclick="navigate('#/home')">Start Checking</button>
    </div>`; return;
  }

  list.innerHTML = items.map(item => {
    const color = TYPE_COLORS[item.type] || '#00D4FF';
    return `<div class="history-item anim-fade-up" onclick="window._viewHistory('${escHtml(item.id)}')">
      <span class="history-icon" style="color:${color}">${typeIcon(item.type)}</span>
      <div class="history-info">
        <strong>${TYPE_NAMES[item.type] || item.type}</strong>
        <p class="history-input">${(item.input || '').slice(0, 65)}${(item.input?.length ?? 0) > 65 ? '…' : ''}</p>
        <span class="history-date">${fmtDate(item.createdAt)}</span>
      </div>
      <span class="history-arrow">›</span>
    </div>`;
  }).join('');
}

// View a history item — fetches stored result, no re-analysis
window._viewHistory = async function(id) {
  // Render loading state immediately
  render(`
    <div class="hist-detail-page">
      <div class="hist-detail-header">
        <button class="back-btn-inline" onclick="renderHistory()">${ICONS.back}</button>
        <h2>Loading…</h2>
      </div>
      <div style="display:flex;justify-content:center;padding:60px">
        <span class="spinner large"></span>
      </div>
    </div>`);

  const item = await fetchHistoryItem(id);
  if (!item || !item.result) {
    showToast('Could not load this check.', 'error');
    renderHistory();
    return;
  }

  const color = TYPE_COLORS[item.type] || '#00D4FF';

  render(`
    <div class="hist-detail-page">
      <div class="hist-detail-header">
        <button class="back-btn-inline" onclick="renderHistory()">${ICONS.back}</button>
        <h2>${TYPE_NAMES[item.type] || item.type}</h2>
      </div>
      <div class="hist-detail-meta">
        <span class="hist-detail-type" style="background:${color}18;color:${color};border:1px solid ${color}30">${TYPE_NAMES[item.type] || item.type}</span>
        <span class="hist-detail-date">${fmtDate(item.createdAt)}</span>
      </div>
      <div class="hist-detail-input">
        <label>Original message</label>
        <p>${escHtml(item.input || '')}</p>
      </div>
      <div class="hist-detail-body anim-fade-up">
        ${buildResult(item.type, item.result)}
      </div>
    </div>`);
};

// Expose renderHistory so inline onclick="renderHistory()" works
window.renderHistory = renderHistory;

// ============================================================
// 22. Page: Profile
// ============================================================
function renderProfile() {
  const name  = state.user?.displayName || 'User';
  const email = state.user?.email || '';
  const left  = APP_CONFIG.freeChecksPerDay - state.checksToday;

  render(`
    <div class="profile-page">
      <div class="page-header">
        <button class="back-btn-inline" onclick="navigate('#/home')">${ICONS.back}</button>
        <h2>Profile</h2>
      </div>
      <div class="profile-card anim-fade-up">
        <div class="profile-avatar">
          ${state.user?.photoURL
            ? `<img src="${state.user.photoURL}" class="profile-avatar-img" alt="Profile">`
            : `<div class="profile-avatar-placeholder">${(name[0] || 'U').toUpperCase()}</div>`}
        </div>
        <h3 class="profile-name">${name}</h3>
        <p class="profile-email">${email}</p>
        <span class="plan-badge">Free Plan</span>
      </div>
      <div class="stats-grid anim-fade-up">
        <div class="stat-card"><span class="stat-num">${state.checksToday}</span><span class="stat-label">Today</span></div>
        <div class="stat-card"><span class="stat-num">${left}</span><span class="stat-label">Remaining</span></div>
        <div class="stat-card"><span class="stat-num">${APP_CONFIG.freeChecksPerDay}</span><span class="stat-label">Daily Limit</span></div>
      </div>
      <div class="upgrade-card anim-fade-up">
        <div class="upgrade-badge">PRO</div>
        <h3>Upgrade to Pro</h3>
        <p>Unlimited checks, priority analysis, and full deep reports</p>
        <ul class="upgrade-features">
          <li>✅ Unlimited daily checks</li>
          <li>✅ Priority AI processing</li>
          <li>✅ Deep crypto analysis</li>
          <li>✅ Full website reports</li>
          <li>✅ Unlimited check history</li>
        </ul>
        <button class="btn-primary btn-full" onclick="window.showUpgrade()">Get Pro — $4.99/month</button>
      </div>
      ${state.installPrompt ? `
        <button class="btn-secondary btn-full install-btn" onclick="window._install()">
          📱 Install SafeSignal App
        </button>` : ''}
      <button class="btn-danger btn-full" onclick="if(confirm('Sign out?')) window._signOut()">Sign Out</button>
      ${bottomNav('profile')}
    </div>`);
}

window._signOut = doSignOut;

window.showUpgrade = function() {
  document.getElementById('modal-overlay').style.display = 'flex';
  document.getElementById('modal-box').innerHTML = `
    <h3 style="font-family:var(--font-display);font-size:20px;font-weight:700;margin-bottom:8px">🚀 SafeSignal Pro</h3>
    <p style="color:var(--text2);font-size:14px;margin-bottom:20px">Upgrade to remove limits and unlock full analysis.</p>
    <ul style="list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
      ${['Unlimited daily checks','Priority AI processing','Deep crypto analysis','Full website reports','Unlimited history']
        .map(f => `<li style="color:var(--text);font-size:14px">✅ ${f}</li>`).join('')}
    </ul>
    <button class="btn-primary btn-full" onclick="showToast('Pro coming soon! Stay tuned.','info');window.closeModal()">
      Get Pro — $4.99/month
    </button>
    <button class="btn-ghost" onclick="window.closeModal()">Maybe later</button>`;
};

window.closeModal = function() { document.getElementById('modal-overlay').style.display = 'none'; };

// ============================================================
// 23. PWA
// ============================================================
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.installPrompt = e; });

window._install = async function() {
  if (!state.installPrompt) { showToast('Already installed or not supported.', 'info'); return; }
  state.installPrompt.prompt();
  const { outcome } = await state.installPrompt.userChoice;
  if (outcome === 'accepted') showToast('SafeSignal installed!', 'success');
  state.installPrompt = null;
};

function registerSW() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ============================================================
// 24. Bootstrap
// ============================================================
registerSW();
renderSplash();

onAuthStateChanged(auth, async (user) => {
  state.user = user;
  if (user) {
    // Mark onboarding as done so a logged-out returning user always
    // lands on the login page instead of seeing onboarding again
    localStorage.setItem('ss_onboarded', '1');
    await loadCheckCount();
  }
  setTimeout(() => handleRoute(), user === null ? 1800 : 400);
});
