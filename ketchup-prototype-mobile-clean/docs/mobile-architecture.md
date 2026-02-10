# Mobile Architecture (v1)

## Platform Decision
**React Native (Expo).**
- Best fit for iOS + Android delivery with a native contact picker and swipe UI.
- High iteration speed with Expo; can eject later if deeper native integrations are required.

## Repo Setup (v1)
- Initialize Expo app with TypeScript.
- Add navigation (`@react-navigation/native`).
- Add gesture handling + animation (`react-native-gesture-handler`, `react-native-reanimated`).
- Configure linting/formatting (ESLint + Prettier).
- Document local run steps for iOS + Android.

## Contact Picker Integration Approach
- **Primary:** `expo-contacts` for permissions + contact retrieval.
- Normalize contacts into internal `Contact` model:
  - `id`, `name`, `phoneNumbers`, `photoUri`.

## Local Storage Strategy
- **MVP:** `AsyncStorage` for lightweight preferences and onboarding flags.
- **Structured data:** `expo-sqlite` for contacts + frequency settings.

## Navigation Structure (v1)
- **Root Stack**
  - Onboarding (stack)
  - Main (stack)
- **Main Stack**
  - Swipe Deck (home)
  - Manage List
  - Contact Detail (optional)

## Swipe UI Library
- **Recommendation:** `react-native-gesture-handler` + `react-native-reanimated` (custom deck).

## Architecture Outline (Text Diagram)

```
[Expo App]
   |
   |-- UI Layer
   |     |-- Swipe Deck
   |     |-- Manage List
   |
   |-- Navigation Layer
   |     |-- Root Stack (Onboarding -> Main)
   |
   |-- Data Layer
   |     |-- Contacts Service (expo-contacts)
   |     |-- Local Store
   |           |-- AsyncStorage (prefs, flags)
   |           |-- SQLite (contacts, frequencies)
```
