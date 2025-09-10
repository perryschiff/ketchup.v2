
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL;
  const anon = (import.meta as any).env?.VITE_SUPABASE_ANON;
  if (!url || !anon) return null;
  if (_client) return _client;
  _client = createClient(url, anon);
  return _client;
}

export async function ensureAnonSession(displayName?: string): Promise<string | null> {
  const s = getSupabase();
  if (!s) return null;
  try {
    const { data: { user } } = await s.auth.getUser();
    if (user) return user.id;
    const authAny = s.auth as any;
    if (typeof authAny.signInAnonymously === "function") {
      const { data, error } = await authAny.signInAnonymously();
      if (error) throw error;
      const newUser = data?.user;
      if (!newUser) return null;
      await s.from("profiles").upsert({ id: newUser.id, display_name: displayName || null });
      return newUser.id;
    }
    return null;
  } catch (e) {
    console.error("ensureAnonSession error", e);
    return null;
  }
}

export async function logTouch(contactId: string | null, action: "call" | "text"): Promise<void> {
  const s = getSupabase();
  if (!s) return;
  try {
    const { data: { user } } = await s.auth.getUser();
    if (!user) return;
    await s.from("touches").insert({
      user_id: user.id,
      contact_id: contactId,
      action
    });
  } catch (e) {
    console.error("logTouch error", e);
  }
}
