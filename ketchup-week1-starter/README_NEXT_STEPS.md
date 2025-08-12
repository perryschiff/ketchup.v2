
# Ketchup — Week 1 Starter

This includes:
- `vercel.json` (locks build commands)
- Supabase schema + RLS
- Supabase client helper (`supabaseClient.ts`)

## Branching Strategy
1. Create branch: `git checkout -b feat/supabase-week1`
2. Add these files on that branch.
3. Open PR into `main` for a preview deployment.
4. Merge when ready.

## Setup Steps
1. Create Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Enable Anonymous sign-in in Supabase Auth settings.
4. Add env vars in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON`
5. In `App.tsx`, import:
```ts
import { ensureAnonSession, logTouch } from "@/lib/supabaseClient";
```
Call `ensureAnonSession()` on onboarding finish, and `logTouch()` in Call/Text buttons.

## Result
- `vercel.json` ensures stable builds.
- Supabase ready for persistence & logging touches.
