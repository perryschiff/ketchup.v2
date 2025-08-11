# Ketchup (Mobile-Optimized Prototype)

Changes for mobile:
- Edge-to-edge swipe card on phones, constrained on tablets/desktops.
- Condensed header and full-width segment control on phones.
- "Up next" list hidden by default on phones with a toggle; always visible on larger screens.
- Onboarding comes before app UI.
- All demo contacts use +1 401-477-2209.

## Deploy
1. Upload these files to a new GitHub repo (upload the folder contents, not the zip).
2. On Vercel, create a New Project from that repo. Framework: Vite.
3. Deploy. Share the .vercel.app link.

(Optional) Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON` in Vercel → Settings → Environment Variables for cloud sync.
