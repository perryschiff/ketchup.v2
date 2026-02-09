# Mobile Architecture (Proposed)

## Platform Decision
**Recommendation: React Native (Expo).**
- Best fit for a mobile-first contact picker + swipe UI experience while keeping velocity high.
- Access to native contacts (iOS/Android) and local storage options with first-party/maintained libraries.
- Expo provides faster iteration and OTA updates; can eject later if deeper native integrations are needed.

**Alternatives considered**
- **Flutter:** Strong UI performance, but higher learning curve for the existing React stack and less direct code reuse.
- **Capacitor + React Web:** Faster reuse of web code, but contact access + swipe performance can be less consistent on low-end devices.

## Contact Picker Integration Approach
- **Primary:** Use Expo Contacts for permission + fetch contacts.
  - `expo-contacts` handles platform permissions and normalized contact retrieval.
  - Filter/normalize to the app’s internal `Contact` model (name, phone numbers, avatar).
- **Fallback / Advanced:** If deeper native access is needed (e.g., iOS CNContactStore tuning), eject to bare RN and use `react-native-contacts`.

## Local Storage Strategy
- **Default (MVP):** AsyncStorage for lightweight key-value data
  - Stores user preferences, onboarding completion, and cached “recently viewed” contact IDs.
- **Structured / Offline Cache:** SQLite (via `expo-sqlite`)
  - Stores contact metadata, interaction history, tags, and “swipe decisions.”
  - Enables fast querying for “Up Next” and analytics without network dependency.

## Navigation Structure
- **Library:** `@react-navigation/native`
- **Pattern:**
  - **Root Stack**
    - `Onboarding` (stack)
    - `Main` (tab)
  - **Main Tabs**
    - `Home` (swipe cards)
    - `Up Next` (queued contacts list)
    - `Profile/Settings`
  - **Nested Details**
    - `ContactDetail` pushed from Home/Up Next

## Swipe UI Library
- **Recommendation:** `react-native-gesture-handler` + `react-native-reanimated` (custom swipe card)
  - Highest performance, full control of gestures and animations.
  - Can recreate the web prototype behavior (edge-to-edge card, swipe actions, velocity thresholds).
- **Alternative:** `react-native-deck-swiper`
  - Faster to start but less flexible; may struggle with custom physics/stacking.

## One-Page Architecture Outline (Text Diagram)

```
[Expo App]
   |
   |-- UI Layer
   |     |-- Swipe Deck (gesture-handler + reanimated)
   |     |-- Up Next List
   |     |-- Contact Detail
   |
   |-- Navigation Layer (@react-navigation)
   |     |-- Root Stack (Onboarding -> Main Tabs)
   |     |-- Tabs (Home | Up Next | Settings)
   |
   |-- Data Layer
   |     |-- Contact Service (expo-contacts)
   |     |-- Local Store
   |           |-- AsyncStorage (prefs, flags)
   |           |-- SQLite (contacts, interactions)
   |
   |-- Optional Cloud Sync
         |-- Supabase (auth + sync when online)
```
