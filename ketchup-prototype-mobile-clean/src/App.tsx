import React, { useState, useEffect } from "react";
import { ensureAnonSession, logTouch } from "./lib/supabaseClient"; // <-- NEW
import { ensureAnonSession, logTouch } from "@/lib/supabaseClient";


function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Runs once after mount to restore state if needed
  useEffect(() => {
    // If you want to auto-login even before onboarding, uncomment:
    // ensureAnonSession();
  }, []);

async function handleOnboardDone(name?: string) {
  try {
    // existing logic...
    const p = await signInAnon(name);
    setProfile(p);
    localStorage.setItem("ketchup.onboarded", "1");
    setShowOnboarding(false);

    // NEW: make sure a Supabase anon session exists
    await ensureAnonSession(name);

    const stop = startNudgeTimer(45);
    setStopNudges(() => stop);
  } catch (e) {
    console.error(e);
    const localP = { id: crypto.randomUUID(), display_name: name } as Profile;
    localStorage.setItem("ketchup.profile.v1", JSON.stringify(localP));
    setProfile(localP);
    localStorage.setItem("ketchup.onboarded", "1");
    setShowOnboarding(false);
    // Safe to call even if env vars are missing
    await ensureAnonSession(name);
  }
}


  // Call handler for Call button
  function handleCall(contactId: string, phone: string) {
    logTouch(contactId, "call"); // <-- NEW
    window.location.href = `tel:${phone}`;
  }

  // Call handler for Text button
  function handleText(contactId: string, phone: string) {
    logTouch(contactId, "text"); // <-- NEW
    window.location.href = `sms:${phone}`;
  }

<div className="grid grid-cols-2 gap-3">
  <Button
    className="w-full rounded-2xl"
    disabled={!tel}
    onClick={() => {
      logTouch(c.id, "call");
      if (tel) window.location.href = tel;
    }}
  >
    <Phone className="w-4 h-4 mr-1" /> Call
  </Button>

  <Button
    variant="secondary"
    className="w-full rounded-2xl"
    disabled={!sms}
    onClick={() => {
      logTouch(c.id, "text");
      if (sms) window.location.href = sms;
    }}
  >
    <MessageCircle className="w-4 h-4 mr-1" /> Text
  </Button>
</div>



  if (showOnboarding) {
    return <Onboarding onFinish={handleFinishOnboarding} />;
  }

  return (
    <div className="app">
      <SwipeableContactCards
        onCall={handleCall}   // pass our handler down
        onText={handleText}   // pass our handler down
      />
    </div>
  );
}

export default App;
