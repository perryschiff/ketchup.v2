# Ketchup v1 Execution Plan

## Goal
Turn the v1 PRD into a build-ready plan with clear owners, milestones, and concrete deliverables.

## Phase 0: Kickoff (1–2 days)
- Confirm v1 scope and acceptance criteria in `docs/v1-prd.md`.
- Review UX flows in `docs/v1-ux-flows.md` and align on screen list.
- Assign owners for mobile engineering, design, and QA.
- Define a 2–3 week sprint cadence and weekly demo time.

## Phase 1: Repo + Architecture (2–3 days)
- Initialize Expo RN repo with TypeScript.
- Add navigation, gesture, and animation libraries.
- Set up linting/formatting and basic CI (lint + typecheck).
- Document local run steps.

## Phase 2: Core Data + Contacts (4–6 days)
- Implement native contact picker with permissions.
- Enforce minimum selection (>=5) with validation UI.
- Normalize and persist selected contacts locally.

## Phase 3: Frequency + List Management (3–5 days)
- Preset frequency UI + custom interval input.
- Persist frequency per contact.
- Add/manage list post-setup (add/remove/edit frequency).

## Phase 4: Swipe + Actions (5–7 days)
- Swipe card UI with left/right gestures.
- Reveal call/text actions on right swipe.
- Handle missing phone numbers gracefully.

## Phase 5: Analytics + QA (3–5 days)
- Instrument onboarding, swipe, and actions per `ANALYTICS_SPEC.md`.
- Execute manual QA in `TEST_CHECKLIST.md`.
- Fix top issues and prepare pre-beta build.

## Deliverables by phase
- **Phase 1:** Repo + build instructions.
- **Phase 2:** Contact import + local storage working.
- **Phase 3:** Frequency settings + list management.
- **Phase 4:** Swipe flow + call/text actions.
- **Phase 5:** Analytics + pre-beta readiness.

## Weekly demo checklist
- Onboarding completion with minimum selection.
- Frequency setting + edit persistence.
- Swipe interactions + call/text actions.
- List edits reflected in swipe deck.

