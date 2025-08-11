# Ketchup (Prototype)

This is a ready-to-deploy version of the Ketchup demo.

## Quick Deploy (no coding required)
1. Go to https://github.com and create a new repository (public is fine).
2. Click **Add file → Upload files**, drag the entire folder contents here, and **Commit**.
3. Go to https://vercel.com → New Project → Import your GitHub repo.
4. Vercel should detect **Vite** automatically. Click **Deploy**.
5. Share your link (something like `https://ketchup-yourname.vercel.app`).

## Optional: Supabase (cloud sync)
- In Vercel → Settings → Environment Variables add:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON`
- Create tables with the SQL inside `src/App.tsx`.
- If you skip this, the app still works using your browser's local storage.

