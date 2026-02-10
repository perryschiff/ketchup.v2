# Ketchup (Mobile-Optimized, Clean Build)
- Onboarding appears **before** the app UI
- Mobile-first layout; edge-to-edge swipe card on phones
- Up Next list toggle on phones
- All demo contacts use +1 401-477-2209
- Vite + React plugin configured for Vercel

## Play on your phone (quick options)

### Option A: Share a hosted link (recommended for friends)
1) Push this repo to GitHub.
2) Deploy to Vercel (steps below).
3) Share the Vercel URL with friends to open on iOS/Android.

**Fastest path (Vercel CLI):**
```bash
npm install
npm run deploy:vercel
```
The CLI prints a live URL you can paste into iMessage/WhatsApp.

### Option B: Run locally on your phone (same Wi-Fi)
1) Install dependencies:
   ```bash
   npm install
   ```
2) Start the dev server on your network:
   ```bash
   npm run dev:host
   ```
3) On your phone (same Wi-Fi), open:
   ```
   http://<YOUR_COMPUTER_IP>:5173
   ```
   You can find your IP via:
   - macOS: `ipconfig getifaddr en0`
   - Windows: `ipconfig`
   - Linux: `hostname -I`

### Bonus: Add the app to your home screen
On iOS Safari or Android Chrome, use **Share → Add to Home Screen** for a full-screen, app-like experience.

## Deploy steps
1) Upload these files (the **contents**, not the folder) to your GitHub repo root.
2) In Vercel → Project → Settings → General: **Root Directory** blank.
3) Deploy (Framework Preset should auto-detect as **Vite**; Output Directory `dist`).

Optional: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON` env vars for cloud sync.
