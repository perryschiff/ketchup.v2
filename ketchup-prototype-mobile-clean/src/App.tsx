import React, { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, Star, Clock, ChevronRight, SlidersHorizontal, Info, Calendar, Sparkles, X, Check, Flame, Filter, Shield, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@supabase/supabase-js";

// --- Helpers ---
const FREQUENCIES = [
  { id: "weekly", label: "Weekly", days: 7 },
  { id: "biweekly", label: "Every 2 weeks", days: 14 },
  { id: "monthly", label: "Monthly", days: 30 },
  { id: "quarterly", label: "Every 3 months", days: 90 },
  { id: "semiannual", label: "Every 6 months", days: 182 },
  { id: "yearly", label: "Yearly", days: 365 },
] as const;

type FreqId = typeof FREQUENCIES[number]["id"] | "custom";

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
  const cadenceDays = getCadenceDays(c);
  const overdue = Math.max(0, daysSince(c.lastContacted) - cadenceDays);
  const newsBoost = (c.signals?.length || 0) * 10;
  const affinity = c.affinity ?? 0;
  return overdue * 1.5 + newsBoost * 1.2 + affinity;
}

function getCadenceDays(c: Contact) {
  if (c.frequency === "custom" && c.customIntervalDays) return c.customIntervalDays;
  return FREQUENCIES.find((f) => f.id === c.frequency)?.days ?? 30;
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
  customIntervalDays?: number;
  affinity?: number; // 0-10 subjective
  signals?: Signal[];
  sources?: string[]; // e.g., ["gmail","linkedin"]
  included?: boolean;
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
  { id: "6", name: "Jordan Lee", relationship: "Coworker", phone: TEST_PHONE, frequency: "quarterly",
    lastContacted: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(), affinity: 4,
    signals: [{ type: "promotion", when: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(), note: "New role announcement" }],
    sources: ["linkedin"], included: true },
  { id: "7", name: "Riya Singh", relationship: "Friend", phone: TEST_PHONE, frequency: "yearly",
    lastContacted: new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString(), affinity: 6,
    signals: [{ type: "moved", when: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(), note: "Moved to Chicago" }],
    sources: ["instagram"], included: true },
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
    customIntervalDays: r.custom_interval_days ?? undefined,
    lastContacted: r.last_contacted || undefined,
    affinity: r.affinity ?? undefined,
    included: r.included ?? true,
    signals: [],
  }));
}

async function saveContacts(cs: Contact[], profile?: Profile) {
  if (!supabase || !profile) { try { localStorage.setItem(LS_KEY, JSON.stringify(cs)); } catch {} return; }
  const rows = cs.map(c => ({
    id: c.id.startsWith?.("local-") ? undefined : c.id,
    user_id: profile.id,
    name: c.name,
    relationship: c.relationship ?? null,
    phone: c.phone ?? null,
    frequency: c.frequency,
    custom_interval_days: c.customIntervalDays ?? null,
    last_contacted: c.lastContacted ?? null,
    affinity: c.affinity ?? null,
    included: c.included ?? true,
  }));
  await supabase.from("contacts").upsert(rows, { onConflict: "id" });
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
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Frequency" />
      </SelectTrigger>
      <SelectContent>
        {FREQUENCIES.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.label}
          </SelectItem>
        ))}
        <SelectItem value="custom">Custom</SelectItem>
      </SelectContent>
    </Select>
  );
}

function PersonRow({ c, onChange }: { c: Contact; onChange: (c: Contact) => void }) {
  const cadenceDays = getCadenceDays(c);
  const showCustom = c.frequency === "custom";
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
        {nextDueDays(c.lastContacted, cadenceDays).toString()}d left
      </div>
      <div className="col-span-3 space-y-2">
        <FrequencySelect
          value={c.frequency}
          onChange={(v) => onChange({ ...c, frequency: v as FreqId, customIntervalDays: v === "custom" ? c.customIntervalDays ?? 30 : undefined })}
        />
        {showCustom && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Input
              type="number"
              min={1}
              className="h-8 w-20 rounded-lg text-xs"
              value={c.customIntervalDays ?? 30}
              onChange={(e) => onChange({ ...c, customIntervalDays: Number(e.target.value || 1) })}
            />
            days
          </div>
        )}
      </div>
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
              {c.frequency === "custom" ? "Custom cadence" : FREQUENCIES.find(f=>f.id===c.frequency)?.label}
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
              <Button className="w-full rounded-2xl" disabled={!tel}>
                <Phone className="w-4 h-4 mr-1"/> Call
              </Button>
            </a>
            <a href={sms} target="_self" className="w-full">
              <Button variant="secondary" className="w-full rounded-2xl" disabled={!sms}>
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

type OnboardingStep = "profile" | "select" | "frequency";

function Onboarding({
  onDone,
  availableContacts,
}: {
  onDone: (payload: { name?: string; selected: Contact[]; defaultFrequency: FreqId; customIntervalDays?: number }) => void;
  availableContacts: Contact[];
}) {
  const [name, setName] = useState("");
  const [step, setStep] = useState<OnboardingStep>("profile");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [defaultFrequency, setDefaultFrequency] = useState<FreqId>("monthly");
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(30);
  const minRequired = 5;
  const isCustom = defaultFrequency === "custom";
  const selectedContacts = useMemo(
    () => availableContacts.filter((c) => selectedIds.includes(c.id)),
    [availableContacts, selectedIds],
  );

  function toggleContact(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function handleNextFromProfile() {
    setStep("select");
  }

  function handleNextFromSelect() {
    if (selectedIds.length < minRequired) return;
    setStep("frequency");
  }

  function handleFinish() {
    const selected = selectedContacts.map((c) => ({
      ...c,
      included: true,
      frequency: defaultFrequency,
      customIntervalDays: defaultFrequency === "custom" ? customIntervalDays : undefined,
    }));
    onDone({ name: name || undefined, selected, defaultFrequency, customIntervalDays: isCustom ? customIntervalDays : undefined });
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

        {step === "profile" && (
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Your profile</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4"/>
                <Input placeholder="Your name (optional)" value={name} onChange={(e)=>setName(e.target.value)} className="rounded-xl"/>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Shield className="w-4 h-4"/> No password needed; we’ll create an anonymous profile.
              </div>
              <div className="flex gap-2">
                <Button className="rounded-xl" onClick={handleNextFromProfile}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "select" && (
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Choose your Ketchup list</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select at least {minRequired} contacts to get started. You can edit this later.
              </p>
              <div className="space-y-2">
                {availableContacts.map((c) => {
                  const selected = selectedIds.includes(c.id);
                  const initials = c.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleContact(c.id)}
                      className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left ${selected ? "border-primary bg-primary/5" : "border-muted"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">{initials}</div>
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.relationship || "—"}</div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{selected ? "Selected" : "Tap to add"}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{selectedIds.length} selected</span>
                {selectedIds.length < minRequired && (
                  <span>Select at least {minRequired} contacts.</span>
                )}
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" className="rounded-xl" onClick={() => setStep("profile")}>Back</Button>
                <Button className="rounded-xl" disabled={selectedIds.length < minRequired} onClick={handleNextFromSelect}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "frequency" && (
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Set your default cadence</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose how often you’d like to catch up. You can customize each contact later.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <FrequencySelect value={defaultFrequency} onChange={(v) => setDefaultFrequency(v as FreqId)} />
                {isCustom && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Input
                      type="number"
                      min={1}
                      className="w-24 rounded-xl"
                      value={customIntervalDays}
                      onChange={(e) => setCustomIntervalDays(Number(e.target.value || 1))}
                    />
                    days
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" className="rounded-xl" onClick={() => setStep("select")}>Back</Button>
                <Button className="rounded-xl" onClick={handleFinish}>Finish</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground text-center">You can change everything later in Settings.</div>
      </div>
    </div>
  );
}

function Wireframes() {
  return (
    <div className="space-y-8 px-4 sm:px-0">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Wireframes</h2>
        <p className="text-sm text-muted-foreground">Draft flows with screen names, primary CTAs, and empty/error states.</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Onboarding flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">1. Welcome</p>
              <p className="text-muted-foreground">Headline, value props, and short preview of swipe flow.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Get started</span></p>
              <p className="text-xs text-muted-foreground">Secondary: “I already have an account”</p>
            </div>
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">2. Permissions</p>
              <p className="text-muted-foreground">Request contacts + notifications permission.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Allow access</span></p>
              <p className="text-xs text-muted-foreground">Error: “Permission denied” → show Settings deep link.</p>
            </div>
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">3. Native contact picker</p>
              <p className="text-muted-foreground">Show OS picker with search and recent contacts.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Select contacts</span></p>
              <p className="text-xs text-muted-foreground">Empty: “No contacts found” with invite options.</p>
            </div>
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">4. Minimum selection validation</p>
              <p className="text-muted-foreground">Confirm at least 5 contacts selected.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Continue</span></p>
              <p className="text-xs text-muted-foreground">Error: “Select at least 5 contacts” + counter.</p>
            </div>
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">5. Frequency selection</p>
              <p className="text-muted-foreground">Set default cadence + optional per-contact overrides.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Save cadence</span></p>
              <p className="text-xs text-muted-foreground">Secondary: “Skip for now”</p>
            </div>
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">6. Confirmation</p>
              <p className="text-muted-foreground">Summary of selected contacts + cadence + first session preview.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Start swiping</span></p>
              <p className="text-xs text-muted-foreground">Empty state: “No contacts yet” → re-open picker.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Swipe flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">Contact card</p>
              <p className="text-muted-foreground">Name, photo, last contact, and context signals.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Swipe right = Reach out</span></p>
              <p className="text-xs text-muted-foreground">Secondary: “Tap for details”</p>
            </div>
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">Swipe left</p>
              <p className="text-muted-foreground">Defer contact, optionally snooze for a week.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Snooze 7 days</span></p>
              <p className="text-xs text-muted-foreground">Empty: “All caught up” end-of-stack screen.</p>
            </div>
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">Swipe right</p>
              <p className="text-muted-foreground">Reveal actions to call or text.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Call now</span></p>
              <p className="text-xs text-muted-foreground">Secondary: “Send text”</p>
            </div>
          </div>
          <div className="rounded-xl border border-dashed p-4 space-y-2">
            <p className="font-semibold">Call/Text actions</p>
            <p className="text-muted-foreground">Action sheet with quick notes, last message preview, and “log interaction”.</p>
            <p className="text-xs">Primary CTA: <span className="font-medium">Done — log this</span></p>
            <p className="text-xs text-muted-foreground">Error: “No phone number” → prompt to add contact info.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Manage list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">Manage list home</p>
              <p className="text-muted-foreground">Search, filters, and contact cards with cadence.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Add contacts</span></p>
              <p className="text-xs text-muted-foreground">Empty: “No contacts yet” → open picker.</p>
            </div>
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">Edit contact</p>
              <p className="text-muted-foreground">Update name, phone, relationship, and cadence.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Save changes</span></p>
              <p className="text-xs text-muted-foreground">Error: “Missing phone/email” validation.</p>
            </div>
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">Add/remove contacts</p>
              <p className="text-muted-foreground">Multi-select add flow + swipe to remove.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Confirm selection</span></p>
              <p className="text-xs text-muted-foreground">Error: “Fewer than 5 contacts” with counter.</p>
            </div>
            <div className="rounded-xl border border-dashed p-4 space-y-2">
              <p className="font-semibold">Update frequency</p>
              <p className="text-muted-foreground">Bulk update cadence for multiple contacts.</p>
              <p className="text-xs">Primary CTA: <span className="font-medium">Apply cadence</span></p>
              <p className="text-xs text-muted-foreground">Empty: “No contacts selected” prompt.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main ---
export default function KetchupApp() {
  const [tab, setTab] = useState<"session" | "people" | "wireframes">("session");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<Contact[]>([]);
  const [picked, setPicked] = useState<Contact | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUpNext, setShowUpNext] = useState<boolean>(false); // mobile toggle

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
  useEffect(() => { (async () => { await saveContacts(contacts, profile ?? undefined); })(); }, [contacts, profile]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return contacts.filter(c => (c.included ?? true) && c.name.toLowerCase().includes(q));
  }, [contacts, query]);

  const ordered = useMemo(() => ([...filtered].sort((a,b) => scoreContact(b) - scoreContact(a))), [filtered]);

  function startSession() { setQueue(ordered); setTab("session"); }
  function updateContact(updated: Contact) { setContacts(prev => prev.map(c => c.id === updated.id ? updated : c)); }

  async function handleOnboardDone(payload: { name?: string; selected: Contact[]; defaultFrequency: FreqId; customIntervalDays?: number }) {
    try {
      const p = await signInAnon(payload.name);
      setProfile(p);
      setContacts(payload.selected);
      localStorage.setItem("ketchup.onboarded", "1");
      setShowOnboarding(false);
    } catch (e) {
      console.error(e);
      const localP = { id: crypto.randomUUID(), display_name: payload.name } as Profile;
      localStorage.setItem("ketchup.profile.v1", JSON.stringify(localP));
      setProfile(localP);
      setContacts(payload.selected);
      localStorage.setItem("ketchup.onboarded", "1");
      setShowOnboarding(false);
    }
  }

  // Gate entire app behind onboarding
  if (showOnboarding) return <Onboarding onDone={handleOnboardDone} availableContacts={seedContacts} />;

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
            <Button variant={tab==="wireframes"?"default":"ghost"} className="rounded-xl flex-1" onClick={()=>setTab("wireframes")}>Wireframes</Button>
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
            <div className="flex items-center gap-2">
              <Input placeholder="Search people" value={query} onChange={(e)=>setQuery(e.target.value)} className="rounded-xl"/>
              <Button className="rounded-xl" onClick={startSession}>Start Session</Button>
            </div>
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

        {tab === "wireframes" && <Wireframes />}
      </div>

      <AnimatePresence>{picked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ActionSheet c={picked} onClose={()=>{ setPicked(null); setQueue((q)=> q.slice(1)); }} />
        </motion.div>
      )}</AnimatePresence>

      <footer className="max-w-5xl mx-auto mt-8 sm:mt-10 text-center text-xs text-muted-foreground space-y-1 px-4 sm:px-0 pb-6">
        <div>Prototype. Data lives in your browser unless Supabase is configured.</div>
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
