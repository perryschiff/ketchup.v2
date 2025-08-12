import React, { useState, useEffect } from "react";
import SwipeableContactCards from "./components/SwipeableContactCards"; // adjust path if needed
import Onboarding from "./components/Onboarding"; // adjust path if needed
import { ensureAnonSession, logTouch } from "./lib/supabaseClient"; // <-- NEW

function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Runs once after mount to restore state if needed
  useEffect(() => {
    // If you want to auto-login even before onboarding, uncomment:
    // ensureAnonSession();
  }, []);

  async function handleFinishOnboarding(name: string) {
    setDisplayName(name);
    setShowOnboarding(false);
    await ensureAnonSession(name); // <-- NEW
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
