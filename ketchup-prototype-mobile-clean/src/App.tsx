import React, { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, Star, Clock, ChevronRight, UserPlus, SlidersHorizontal, Info, Calendar, Sparkles, X, Check, Flame, Filter, BellRing, Shield, LogOut, User, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@supabase/supabase-js";
import { logTouch } from "@/lib/supabaseClient";

// --- Helpers ---
const FREQUENCIES = [
  { id: "weekly", label: "Weekly", days: 7 },
  { id: "biweekly", label: "Every 2 weeks", days: 14 },
  { id: "monthly", label: "Monthly", days: 30 },
  { id: "quarterly", label: "Quarterly", days: 90 },
  { id: "semiannual", label: "Every 6 months", days: 182 },
] as const;

type FreqId = typeof FREQUENCIES[number]["id"];

function daysSince(dateStr?: string) {
  if (!dateStr) return 9999;
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function nextDueDays(lastContacted?: string, cadenceDays = 30) {
  const since = daysSince(lastContacted);
  return Math.max(0, cadenceDays - since);
}

function scoreContact(c: Contact) {
  const cadenceDays = FREQUENCIES.find(f => f.id === c.frequency)?.days ?? 30;
  const overdue = Math.max(0, daysSince(c.lastContacted) - cadenceDays);
  const newsBoost = (c.signals?.length || 0) * 10;
  const affinity = c.affinity ?? 0;
  return overdue * 1.5 + newsBoost * 1.2 + affinity;
}

function telHref(num?: string) { return num ? `tel:${num}` : undefined; }
function smsHref(num?: string, text?: string) {
  if (!num) return undefined;
  const encoded = encodeURIComponent(text || "Hey! Free now, want to catch up?");
  return `sms:${num}?&body=${encoded}`;
}

// --- Types ---
export type Signal = { type: "birthday" | "promotion" | "moved" | "new_child" | "anniversary"; when: string; note?: string };
export type Contact = {
  id: string;
  name: string;
  handle?: string;
  phone?: string;
  avatar?: string;
  relationship?: string;
  lastContacted?: string; // ISO
  frequency: FreqId;
  affinity?: number; // 0-10 subjective
  signals?: Signal[];
  sources?: string[]; // e.g., ["gmail","linkedin"]
  included?: boolean;
};

type NewContactForm = {
  name: string;
  phone: string;
  frequency: FreqId;
};

// --- Demo Data ---
// All demo contacts use the same test number: +1 401-477-2209
const TEST_PHONE = "+14014772209";
const seedContacts: Contact[] = [
  { id: "1", name: "Mom", relationship: "Family", phone: TEST_PHONE, frequency: "weekly",
    lastContacted: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(), affinity: 10,
    signals: [{ type: "anniversary", when: new Date().toISOString(), note: "Parents' anniversary this week" }],
    sources: ["contacts"], included: true },
  { id: "2", name: "Aiden Chen", relationship: "Friend", phone: TEST_PHONE, frequency: "biweekly",
    lastContacted: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(), affinity: 7,
    signals: [{ type: "promotion", when: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), note: "Promoted to Staff" }],
    sources: ["linkedin"], included: true },
  { id: "3", name: "Priya Patel", relationship: "Cousin", phone: TEST_PHONE, frequency: "semiannual",
    lastContacted: new Date(Date.now() - 200 * 24 * 3600 * 1000).toISOString(), affinity: 6,
    signals: [{ type: "moved", when: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(), note: "Moved to Austin" }],
    sources: ["instagram"], included: true },
  { id: "4", name: "Samir Gupta", relationship: "Brother", phone: TEST_PHONE, frequency: "biweekly",
    lastContacted: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), affinity: 9,
    signals: [], sources: ["contacts"], included: true },
  { id: "5", name: "Taylor Jones", relationship: "Friend", phone: TEST_PHONE, frequency: "monthly",
    lastContacted: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString(), affinity: 5,
    signals: [{ type: "birthday", when: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(), note: "Birthday in 10 days" }],
    sources: ["calendar"], included: true },
];

// --- Storage (Local + Optional Supabase) ---
const LS_KEY = "ketchup.contacts.v2";
const LS_PROFILE = "ketchup.profile.v1";
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnon = (import.meta as any).env?.VITE_SUPABASE_ANON;
const supabase = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;

type Profile = { id: string; display_name?: string };

async function getSessionProfile(): Promise<Profile | null> {
  try {
    if (!supabase) {
      const local = localStorage.getItem(LS_PROFILE);
      return local ? JSON.parse(local) : null;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("id, display_name").eq("id", user.id).maybeSingle();
    return data as any as Profile;
  } catch { return null; }
}

async function signInAnon(displayName?: string): Promise<Profile> {
  if (!supabase) {
    const p = { id: crypto.randomUUID(), display_name: displayName };
    localStorage.setItem(LS_PROFILE, JSON.stringify(p));
    return p;
  }
  const { data, error } = await (supabase.auth as any).signInAnonymously?.();
  if (error) throw error;
  const user = data?.user;
  if (!user) throw new Error("No user after anon signin");
  await supabase.from("profiles").upsert({ id: user.id, display_name: displayName }).select();
  return { id: user.id, display_name: displayName };
}

async function loadContacts(profile?: Profile): Promise<Contact[]> {
  if (!supabase || !profile) {
    try {
      const s = localStorage.getItem(LS_KEY);
      if (!s) return seedContacts;
      const parsed: Contact[] = JSON.parse(s);
      return parsed.length ? parsed : seedContacts;
    } catch { return seedContacts; }
  }
  const { data, error } = await supabase.from("contacts").select("id,name,relationship,phone,frequency,last_contacted,affinity,included").eq("user_id", profile.id).order("name");
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    relationship: r.relationship || undefined,
    phone: r.phone || undefined,
    frequency: (r.frequency || "monthly") as FreqId,
    lastContacted: r.last_contacted || undefined,
    affinity: r.affinity ?? undefined,
    included: r.included ?? true,
    signals: [],
  }));
}

async function saveContacts(cs: Contact[], profile?: Profile): Promise<Contact[] | null> {
  if (!supabase || !profile) { try { localStorage.setItem(LS_KEY, JSON.stringify(cs)); } catch {} return null; }
  const rows = cs.map(c => ({
    id: c.id.startsWith?.("local-") ? undefined : c.id,
    user_id: profile.id,
    name: c.name,
    relationship: c.relationship ?? null,
    phone: c.phone ?? null,
    frequency: c.frequency,
    last_contacted: c.lastContacted ?? null,
    affinity: c.affinity ?? null,
    included: c.included ?? true,
  }));
  const { data, error } = await supabase
    .from("contacts")
    .upsert(rows, { onConflict: "id" })
    .select("id,name,relationship,phone,frequency,last_contacted,affinity,included");
  if (error) throw error;
  if (!data?.length) return [];
  return data.map((r: any) => ({
    id: r.id as string,
    name: r.name as string,
    relationship: (r.relationship ?? undefined) as string | undefined,
    phone: (r.phone ?? undefined) as string | undefined,
    frequency: (r.frequency || "monthly") as FreqId,
    lastContacted: (r.last_contacted ?? undefined) as string | undefined,
    affinity: (r.affinity ?? undefined) as number | undefined,
    included: (r.included ?? true) as boolean,
    signals: [],
  }));
}

// --- Nudges (Browser Notifications) ---
function canNotify() { return "Notification" in window; }
async function requestNotifyPermission(): Promise<NotificationPermission> {
  if (!canNotify()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
}
function startNudgeTimer(minutes: number, onTick?: ()=>void) {
  let lastId: any;
  function tick() {
    onTick?.();
    if (canNotify() && Notification.permission === "granted") {
      new Notification("Free to Ketchup?", { body: "Swipe a couple contacts now", tag: "ketchup-nudge" });
    }
    lastId = setTimeout(tick, minutes * 60 * 1000);
  }
  lastId = setTimeout(tick, minutes * 60 * 1000);
  return () => clearTimeout(lastId);
}

// --- UI Components ---
function SignalBadge({ sig }: { sig: Signal }) {
  const map = {
    birthday: { label: "Birthday", icon: <Calendar className="w-3.5 h-3.5" /> },
    promotion: { label: "Promotion", icon: <Sparkles className="w-3.5 h-3.5" /> },
    moved: { label: "Moved", icon: <Flame className="w-3.5 h-3.5" /> },
    new_child: { label: "New child", icon: <Star className="w-3.5 h-3.5" /> },
    anniversary: { label: "Anniversary", icon: <Calendar className="w-3.5 h-3.5" /> },
  } as const;
  const m = map[sig.type];
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      {m.icon}
      {m.label}
    </Badge>
  );
}

function FrequencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[160px]">
        <SelectValue placeholder="Frequency" />
      </SelectTrigger>
      <SelectContent>
        {FREQUENCIES.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PersonRow({ c, onChange }: { c: Contact; onChange: (c: Contact) => void }) {
  return (
    <div className="grid grid-cols-12 items-center gap-2 p-2 rounded-xl hover:bg-muted/50">
      <div className="col-span-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
          {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </div>
        <div>
          <div className="font-medium">{c.name}</div>
          <div className="text-xs text-muted-foreground">{c.relationship || "—"}</div>
        </div>
      </div>
      <div className="col-span-3 text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="w-4 h-4" />
        {nextDueDays(c.lastContacted, FREQUENCIES.find(f=>f.id===c.frequency)?.days).toString()}d left
      </div>
      <div className="col-span-3"><FrequencySelect value={c.frequency} onChange={(v)=>onChange({...c, frequency: v as any})} /></div>
      <div className="col-span-1 text-right">
        <Button variant={c.included ? "default" : "secondary"} size="sm" onClick={()=>onChange({...c, included: !c.included})}>
          {c.included ? "On" : "Off"}
        </Button>
      </div>
    </div>
  );
}

function SwipeCard({ c, onSkip, onPick }: { c: Contact; onSkip: ()=>void; onPick: ()=>void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);
  const likeOpacity = useTransform(x, [60, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -60], [1, 0]);

  const onDragEnd = (_: any, info: any) => {
    const threshold = 120;
    if (info.offset.x > threshold) onPick();
    else if (info.offset.x < -threshold) onSkip();
  };

  return (
    <motion.div
      className="relative"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd}
    >
      <Card className="w-full sm:max-w-md sm:mx-auto shadow-lg rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="truncate">{c.name}</span>
            <span className="text-xs text-muted-foreground">{c.relationship || ""}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64 sm:h-72 rounded-2xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center text-6xl font-semibold">
            {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div className="flex flex-wrap gap-2">
            {c.signals?.slice(0,3).map((sig, i) => (
              <SignalBadge key={i} sig={sig} />
            ))}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last chatted {daysSince(c.lastContacted)}d ago
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              {FREQUENCIES.find(f=>f.id===c.frequency)?.label}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button variant="secondary" onClick={onSkip} className="rounded-2xl text-base py-3">
              <X className="w-5 h-5 mr-1"/> Skip
            </Button>
            <Button onClick={onPick} className="rounded-2xl text-base py-3">
              <Check className="w-5 h-5 mr-1"/> Ketchup
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Overlays */}
      <motion.div className="absolute -top-3 left-3" style={{ opacity: nopeOpacity }}>
        <Badge variant="destructive">Nope</Badge>
      </motion.div>
      <motion.div className="absolute -top-3 right-3" style={{ opacity: likeOpacity }}>
        <Badge>Let’s chat</Badge>
      </motion.div>
    </motion.div>
  );
}

function ActionSheet({ c, onClose }: { c: Contact; onClose: ()=>void }) {
  const sms = smsHref(c.phone);
  const tel = telHref(c.phone);
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
              {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </span>
            Reach out to {c.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <a href={tel} target="_self" className="w-full">
              <Button
                className="w-full rounded-2xl"
                disabled={!tel}
                onClick={() => { if (tel) void logTouch(c.id, "call"); }}
              >
                <Phone className="w-4 h-4 mr-1"/> Call
              </Button>
            </a>
            <a href={sms} target="_self" className="w-full">
              <Button
                variant="secondary"
                className="w-full rounded-2xl"
                disabled={!sms}
                onClick={() => { if (sms) void logTouch(c.id, "text"); }}
              >
                <MessageCircle className="w-4 h-4 mr-1"/> Text
              </Button>
            </a>
          </div>
          <div className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5"/>
            Tip: Ketchup surfaces people when you have a few free minutes—like on a walk or cooldown. Swipe right to reach out now, left to defer.
          </div>
          <div className="pt-1 text-right">
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Onboarding({ onDone, onImportSeed }: { onDone: (name?: string)=>void; onImportSeed: ()=>void }) {
  const [name, setName] = useState("");
  const [nudgeMins, setNudgeMins] = useState(30);
  const [notifyState, setNotifyState] = useState<NotificationPermission | "unsupported">("default");

  async function enableNotify() {
    if (!canNotify()) { setNotifyState("unsupported"); return; }
    const res = await requestNotifyPermission();
    setNotifyState(res);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center font-bold">K</div>
          <div>
            <h1 className="text-2xl font-semibold">Welcome to Ketchup</h1>
            <p className="text-sm text-muted-foreground">Quick catch-ups that actually happen.</p>
          </div>
        </div>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base">Your profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4"/>
              <Input placeholder="Your name (optional)" value={name} onChange={(e)=>setName(e.target.value)} className="rounded-xl"/>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Shield className="w-4 h-4"/> No password needed; we can create an anonymous account.
            </div>
            <div className="flex gap-2">
              <Button className="rounded-xl" onClick={()=>onDone(name || undefined)}>Continue</Button>
              <Button variant="secondary" className="rounded-xl" onClick={onImportSeed}><Upload className="w-4 h-4 mr-1"/>Load demo contacts</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BellRing className="w-4 h-4"/> Nudges</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Let Ketchup gently nudge you when you’re likely free.</p>
            <div className="flex items-center gap-2">
              <Input type="number" className="w-24 rounded-xl" value={nudgeMins} onChange={(e)=>setNudgeMins(parseInt(e.target.value || "0"))} />
              <span className="text-muted-foreground">minutes between nudges</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={enableNotify} className="rounded-xl">Enable notifications</Button>
              <span className="text-xs text-muted-foreground">{notifyState === "granted" ? "Enabled" : notifyState === "denied" ? "Blocked" : notifyState === "unsupported" ? "Not supported by this browser" : "Ask your browser"}</span>
            </div>
            <div className="text-right">
              <Button className="rounded-xl" onClick={()=>onDone(name || undefined)}>Finish</Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-center">You can change everything later in Settings.</div>
      </div>
    </div>
  );
}

// --- Main ---
export default function KetchupApp() {
  const [tab, setTab] = useState<"session" | "people">("session");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<Contact[]>([]);
  const [picked, setPicked] = useState<Contact | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stopNudges, setStopNudges] = useState<null | (()=>void)>(null);
  const [showUpNext, setShowUpNext] = useState<boolean>(false); // mobile toggle
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactForm, setNewContactForm] = useState<NewContactForm>({ name: "", phone: "", frequency: "monthly" });
  const [addContactError, setAddContactError] = useState<string | null>(null);

  // boot
  useEffect(() => {
    (async () => {
      const p = await getSessionProfile();
      if (p) setProfile(p);
      const cs = await loadContacts(p ?? undefined);
      setContacts(cs);
      const seen = localStorage.getItem("ketchup.onboarded");
      if (!seen) setShowOnboarding(true);
    })();
  }, []);

  // show up next by default on >= sm screens
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const apply = () => setShowUpNext(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // persist
  useEffect(() => {
    (async () => {
      const saved = await saveContacts(contacts, profile ?? undefined);
      if (!saved?.length) return;
      if (!contacts.some(c => c.id.startsWith?.("local-"))) return;

      const existingIds = new Set(contacts.filter(c => !c.id.startsWith?.("local-")).map(c => c.id));
      const inserted = saved.filter(c => !existingIds.has(c.id));
      if (!inserted.length) return;

      const normalizeLower = (value?: string | null) => (value ? value.trim().toLowerCase() : "");
      const normalize = (value?: string | null) => (value ? value.trim() : "");
      const contactKey = (c: Contact) => [
        normalizeLower(c.name),
        normalizeLower(c.relationship),
        normalize(c.phone),
        c.frequency,
        c.lastContacted ?? "",
        c.affinity != null ? String(c.affinity) : "",
        (c.included ?? true) ? "1" : "0",
      ].join("|");

      const replacementMap = new Map<string, Contact[]>();
      for (const contact of inserted) {
        const key = contactKey(contact);
        const arr = replacementMap.get(key);
        if (arr) arr.push(contact);
        else replacementMap.set(key, [contact]);
      }

      if (!replacementMap.size) return;

      setContacts(prev => {
        let changed = false;
        const next = prev.map(contact => {
          if (!contact.id.startsWith?.("local-")) return contact;
          const key = contactKey(contact);
          const arr = replacementMap.get(key);
          const replacement = arr?.shift();
          if (replacement) {
            if (!arr?.length) replacementMap.delete(key);
            changed = true;
            return { ...contact, id: replacement.id };
          }
          return contact;
        });
        return changed ? next : prev;
      });
    })();
  }, [contacts, profile]);

  // simple background nudge timer
  useEffect(() => { if (!stopNudges) return; return stopNudges; }, [stopNudges]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return contacts.filter(c => (c.included ?? true) && c.name.toLowerCase().includes(q));
  }, [contacts, query]);

  const ordered = useMemo(() => ([...filtered].sort((a,b) => scoreContact(b) - scoreContact(a))), [filtered]);

  function startSession() { setQueue(ordered); setTab("session"); }
  function updateContact(updated: Contact) { setContacts(prev => prev.map(c => c.id === updated.id ? updated : c)); }

  const resetNewContactForm = () => {
    setNewContactForm({ name: "", phone: "", frequency: "monthly" });
    setAddContactError(null);
  };

  const handleAddContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = newContactForm.name.trim();
    if (!name) {
      setAddContactError("Please enter a name.");
      return;
    }
    const phone = newContactForm.phone.trim();
    const newContact: Contact = {
      id: `local-${crypto.randomUUID()}`,
      name,
      phone: phone ? phone : undefined,
      frequency: newContactForm.frequency,
      included: true,
      signals: [],
    };
    setContacts(prev => [...prev, newContact]);
    resetNewContactForm();
    setShowAddContact(false);
  };

  const handleToggleAddContact = () => {
    setShowAddContact((prev) => {
      const next = !prev;
      if (!next) {
        resetNewContactForm();
      } else {
        setAddContactError(null);
      }
      return next;
    });
  };

  async function handleOnboardDone(name?: string) {
    try {
      const p = await signInAnon(name);
      setProfile(p);
      localStorage.setItem("ketchup.onboarded", "1");
      setShowOnboarding(false);
      const stop = startNudgeTimer(45);
      setStopNudges(() => stop);
    } catch (e) {
      console.error(e);
      const localP = { id: crypto.randomUUID(), display_name: name } as Profile;
      localStorage.setItem("ketchup.profile.v1", JSON.stringify(localP));
      setProfile(localP);
      localStorage.setItem("ketchup.onboarded", "1");
      setShowOnboarding(false);
    }
  }

  function handleImportSeed() { setContacts(seedContacts); }

  // Gate entire app behind onboarding
  if (showOnboarding) return <Onboarding onDone={handleOnboardDone} onImportSeed={handleImportSeed} />;

  const top = queue[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-0 sm:p-8">
      <div className="max-w-5xl mx-auto grid gap-4 sm:gap-6">
        <header className="flex items-center justify-between px-4 py-3 sm:px-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="font-bold">K</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-semibold">Ketchup</h1>
              <p className="text-xs text-muted-foreground">Stay connected, effortlessly</p>
            </div>
          </div>
          <div className="inline-flex w-full sm:w-auto rounded-2xl p-1 bg-muted justify-between sm:justify-start max-w-xs">
            <Button variant={tab==="session"?"default":"ghost"} className="rounded-xl flex-1" onClick={()=>setTab("session")}>Session</Button>
            <Button variant={tab==="people"?"default":"ghost"} className="rounded-xl flex-1" onClick={()=>setTab("people")}>People</Button>
          </div>
        </header>

        {tab === "session" && (
          <div className="grid sm:grid-cols-2 gap-6 items-start px-0 sm:px-0">
            <div className="space-y-4 px-4 sm:px-0">
              <h2 className="text-lg font-medium flex items-center gap-2 px-1"><Sparkles className="w-5 h-5"/> I’m free right now</h2>
              {queue.length === 0 && (
                <Card className="rounded-2xl">
                  <CardContent className="p-6 text-sm text-muted-foreground space-y-4">
                    <p>Start a quick catch-up session. We’ll prioritize people based on your preferred cadence and fresh life events.</p>
                    <div className="flex items-center gap-3">
                      <Button onClick={startSession} className="rounded-2xl">Start Session</Button>
                      <Button variant="secondary" onClick={()=>setTab("people")} className="rounded-2xl">Edit People</Button>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2">
                      <BellRing className="w-4 h-4"/> Enable notifications in Settings to get gentle nudges.
                    </div>
                  </CardContent>
                </Card>
              )}

              <AnimatePresence mode="popLayout">
                {top && (
                  <SwipeCard
                    key={top.id}
                    c={top}
                    onSkip={() => setQueue((q) => q.slice(1))}
                    onPick={() => setPicked(top)}
                  />
                )}
              </AnimatePresence>

              {queue.length > 1 && (
                <div className="text-xs text-muted-foreground text-center">{queue.length - 1} more in queue</div>
              )}
            </div>

            <div className="space-y-3 px-4 sm:px-0">
              {/* Mobile toggle for Up Next */}
              <div className="sm:hidden">
                <Button className="w-full rounded-2xl" variant="secondary" onClick={()=>setShowUpNext(v=>!v)}>
                  {showUpNext ? 'Hide up next' : 'Show up next'}
                </Button>
              </div>

              {showUpNext && (
                <>
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Filter className="w-4 h-4"/> Up next (priority)</h3>
                  <div className="space-y-2">
                    {ordered.slice(0,6).map((c) => {
                      const initials = c.name.split(" ").map(p=>p[0]).slice(0,2).join("");
                      return (
                        <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-card border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">{initials}</div>
                            <div>
                              <div className="text-sm font-medium leading-tight">{c.name}</div>
                              <div className="text-[11px] text-muted-foreground">{c.relationship || "—"}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/>{daysSince(c.lastContacted)}d</div>
                            <div className="hidden sm:flex items-center gap-1"><Star className="w-3.5 h-3.5"/>{Math.round(scoreContact(c))}</div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2">
                    <Button onClick={startSession} className="w-full rounded-2xl">Refresh Priority</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "people" && (
          <div className="space-y-4 px-4 sm:px-0">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search people"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                className="rounded-xl flex-1 min-w-[200px]"
              />
              <Button className="rounded-xl" onClick={startSession}>Start Session</Button>
              <Button
                type="button"
                variant={showAddContact ? "default" : "secondary"}
                className="rounded-xl flex items-center gap-2"
                onClick={handleToggleAddContact}
              >
                <UserPlus className="w-4 h-4" />
                {showAddContact ? "Close" : "Add Person"}
              </Button>
            </div>

            {showAddContact && (
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <form className="space-y-4" onSubmit={handleAddContactSubmit}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Full name"
                        value={newContactForm.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewContactForm((prev) => ({ ...prev, name: value }));
                          if (addContactError) setAddContactError(null);
                        }}
                        className="rounded-xl"
                        autoFocus
                      />
                      <Input
                        placeholder="Phone (optional)"
                        value={newContactForm.phone}
                        onChange={(e) => setNewContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                        type="tel"
                        className="rounded-xl"
                      />
                      <div className="sm:col-span-2">
                        <FrequencySelect
                          value={newContactForm.frequency}
                          onChange={(v) => setNewContactForm((prev) => ({ ...prev, frequency: v as FreqId }))}
                        />
                      </div>
                    </div>
                    {addContactError && (
                      <div className="text-xs text-destructive">{addContactError}</div>
                    )}
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-xl"
                        onClick={() => { resetNewContactForm(); setShowAddContact(false); }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="rounded-xl">Add Contact</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="grid grid-cols-12 text-[11px] uppercase tracking-wide text-muted-foreground px-2 pb-2">
                  <div className="col-span-5">Person</div>
                  <div className="col-span-3">Next Due</div>
                  <div className="col-span-3">Frequency</div>
                  <div className="col-span-1 text-right">In List</div>
                </div>
                <div className="space-y-1">
                  {ordered.length === 0 && <EmptyState />}
                  {ordered.map((c) => (
                    <PersonRow key={c.id} c={c} onChange={updateContact} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <AnimatePresence>{picked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ActionSheet c={picked} onClose={()=>{ setPicked(null); setQueue((q)=> q.slice(1)); }} />
        </motion.div>
      )}</AnimatePresence>

      <footer className="max-w-5xl mx-auto mt-8 sm:mt-10 text-center text-xs text-muted-foreground space-y-1 px-4 sm:px-0 pb-6">
        <div>Prototype. Data lives in your browser unless Supabase is configured. Notifications are client-only demo nudges.</div>
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="ghost" className="rounded-xl" onClick={()=>setShowOnboarding(true)}>Settings</Button>
          {supabase && (
            <Button size="sm" variant="ghost" className="rounded-xl" onClick={()=>supabase.auth.signOut()}><LogOut className="w-3.5 h-3.5 mr-1"/>Sign out</Button>
          )}
        </div>
      </footer>
    </div>
  );
}
