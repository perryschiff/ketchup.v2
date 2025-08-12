# Ketchup (Mobile-Optimized, Clean Build)
- Onboarding appears **before** the app UI
- Mobile-first layout; edge-to-edge swipe card on phones
- Up Next list toggle on phones
- All demo contacts use +1 401-477-2209
- Vite + React plugin configured for Vercel

## Deploy steps
1) Upload these files (the **contents**, not the folder) to your GitHub repo root.
2) In Vercel → Project → Settings → General: **Root Directory** blank.
3) Deploy (Framework Preset should auto-detect as **Vite**; Output Directory `dist`).

Optional: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON` env vars for cloud sync.
