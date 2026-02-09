# Ketchup v1 Engineering Backlog

## Epic 1: Project setup (2–3 days)
- Initialize Expo app with TypeScript.
- Add navigation + gesture libraries.
- Configure linting/formatting.
- Document local run steps (iOS/Android).

## Epic 2: Contact import + permissions (4–6 days)
- Implement permission prompt + blocked state.
- Integrate native contact picker (multi-select).
- Enforce minimum contact selection (>=5).
- Normalize contact data into local model.

## Epic 3: Frequency settings (3–5 days)
- Preset selector UI + custom interval input.
- Persist per-contact frequency settings.
- Edit frequency post-setup.

## Epic 4: Swipe deck + actions (5–7 days)
- Swipe card UI with left/right gestures.
- Reveal call/text actions on right swipe.
- Handle missing phone numbers.

## Epic 5: Manage list (3–5 days)
- Add contacts from picker.
- Remove contacts from list.
- Update frequency from list.

## Epic 6: Analytics instrumentation (2–3 days)
- Implement onboarding, swipe, action, and list edit events.
- Add common metadata to all events.

## Epic 7: QA + pre-beta readiness (3–5 days)
- Execute functional + regression tests.
- Validate persistence across restarts.
- Device matrix testing (iOS 16/17, Android 12/13).

## Dependencies
- Contact permissions + picker before onboarding completion.
- Local storage before list management + swipe deck.
