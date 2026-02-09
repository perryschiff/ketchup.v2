# Ketchup v1 PRD

## 1. Overview
**Product name:** Ketchup  
**Mission:** Help people stay connected by surfacing the right person at the right time during spare moments.  
**Platforms:** iOS + Android (React Native / Expo).  
**Primary metric:** Weekly Active Users (WAU).

## 2. Target user & use case
**Target user:** Busy people who want to maintain relationships but often forget to reach out.  
**Core scenario:** During a free moment, a user opens Ketchup, swipes through a curated list of contacts, and chooses someone to call or text.

## 3. Objectives & success metrics
**Primary:** WAU growth post-launch.  
**Secondary:**
- Onboarding completion rate.
- Avg. contacts added per user.
- % of sessions with at least one call/text action.

## 4. MVP scope (v1)
### Must-have
1. Account setup (lightweight for v1; device-scoped identity is acceptable).
2. Curated contact import using native contact picker.
3. Minimum selection requirement (e.g., at least 5 contacts).
4. Per-contact frequency selection:
   - Presets: weekly, every 2 weeks, monthly, every 3 months, every 6 months, yearly.
   - Custom interval input (days).
5. Swipe card experience:
   - Swipe left = skip.
   - Swipe right = reveal call/text actions.
6. Call or text actions (open native dialer/SMS composer).
7. Manage list post-setup (add/remove contacts, edit frequency).

### Out of scope (explicit)
- Social data ingestion (Gmail/LinkedIn/Instagram).
- External event-based prioritization.
- Cloud sync across devices.
- Notifications/reminders (planned for later).

## 5. UX flows
### Onboarding
1. Welcome → “Get started”.
2. Contact permission prompt.
3. Native contact picker (multi-select).
4. Validation: require minimum contact count to proceed.
5. Frequency selection (bulk or per contact).
6. Confirmation → enter swipe flow.

### Swipe flow
- Show contact card (name, photo, primary phone).  
- Swipe left: skip.  
- Swipe right: reveal call/text action buttons.  
- Tap call/text: open native apps.

### Manage list
- Add/remove contacts via picker.
- Edit frequency per contact.

## 6. Functional requirements
- Import only selected contacts.
- Enforce minimum contact count.
- Allow frequency presets + custom intervals.
- Persist selections and frequency locally.
- Provide call/text actions even if frequency isn’t “due.”
- Handle missing phone numbers with disabled action or clear error.

## 7. Non-functional requirements
- Responsive swipe performance (60 FPS target on mid-tier devices).
- Graceful permission denial handling with “Go to Settings” CTA.
- Offline-first behavior for core flows.

## 8. Risks & mitigations
- **Permission denial:** Provide blocked state + Settings CTA.
- **Contact overload:** Require minimum, encourage curated list.
- **Frequency confusion:** Inline helper text and presets.

## 9. Acceptance criteria (v1)
- User can complete onboarding after selecting >= minimum contacts.
- User can set frequency presets/custom interval for each contact.
- User can swipe through list and trigger call/text actions.
- User can add/remove contacts and edit frequency after onboarding.
- App persists list and preferences across restarts.

## 10. Testing plan (v1)
See `TEST_CHECKLIST.md` for functional/regression coverage and device matrix.
