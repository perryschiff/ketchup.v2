# Ketchup v1 UX Flows

## 1) Onboarding (curated contacts)
**Goal:** Build a curated Ketchup list with a minimum number of contacts and assign frequencies.

1. **Welcome**
   - CTA: “Get started”.
2. **Contacts permission prompt**
   - Copy: “Allow Ketchup to access your contacts so you can choose who to keep up with.”
   - Secondary: “Not now” → blocked state.
3. **Blocked state (permission denied)**
   - Header: “Contacts access required”.
   - Body: “Ketchup only uses selected contacts. Enable access to continue.”
   - CTA: “Go to Settings”.
4. **Contact picker (native)**
   - Multi-select; show selected count.
   - **Validation:** “Select at least 5 contacts to continue.”
5. **Frequency selection**
   - Option A: bulk preset for all, then per-contact edit.
   - Option B: per-contact inline selector.
   - Presets + custom interval (days).
6. **Confirmation**
   - Summary of selected contacts + frequencies.
   - CTA: “Start swiping”.

## 2) Swipe flow
**Goal:** Let users quickly decide who to reach out to.

- Card shows name, photo, primary phone.
- Swipe left: skip.
- Swipe right: reveal actions.
- Actions:
  - **Call** → open native dialer.
  - **Text** → open native SMS composer.
- Missing phone: disable action with tooltip (“No phone number available”).

## 3) Manage list (post-setup)
**Goal:** Edit curated list and frequencies.

- **Add contact** → native picker.
- **Remove contact** → remove from list + deck.
- **Edit frequency** → presets + custom interval.

## 4) Edge cases
- Fewer than minimum selected → block progression.
- Permission denied → blocked state + Settings CTA.
- Contact without phone number → action disabled.
- Duplicate phone numbers → normalize and choose primary.
