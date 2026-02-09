# Release Readiness Notes

## App icon + splash
- **App icon**: Use a simple ketchup bottle glyph in the brand red with a transparent background so it stays crisp on light/dark themes. Provide square 1024×1024 source art for platform tooling.
- **iOS icon set**: Generate the full AppIcon asset catalog from the 1024×1024 source (20–1024 px sizes). Verify rounded-corner masking still reads at 60 px.
- **Android icon set**: Export adaptive icon foreground/background layers. Foreground should be the bottle, background the brand red. Provide legacy round/square fallbacks.
- **Splash screen**: Keep a flat brand-red background with a centered white bottle mark. Ensure the mark is vertically centered and sized to ~30–35% of the shortest screen dimension for consistency.
- **Dark mode**: Use the same splash (brand red + white mark) to avoid flashing between themes.

## Privacy disclosure and permissions copy
- **Privacy disclosure (store listing/app settings)**:
  - We only collect what we need to make the app work.
  - Your contacts stay on your device (cloud sync is **post-v1**).
  - We do not sell your data or share it with third parties for advertising.
  - You can request deletion of synced data at any time (**post-v1**).
- **Permissions copy**:
  - **Contacts**: “Allow Ketchup to access your contacts to show who you can keep up with. Contacts stay on your device unless you enable sync.”
  - **Notifications (post-v1)**: “Enable notifications to get reminders when it’s time to catch up.”
  - **Camera (optional, profile photo)**: “Allow camera access to take a profile photo. Photos are stored locally (cloud sync is **post-v1**).”

## Build signing steps
- **iOS**:
  1) Create or select an App ID and enable required capabilities.
  2) Create an App Store distribution certificate in Apple Developer.
  3) Create a provisioning profile tied to the App ID + distribution cert.
  4) In Xcode, set the bundle ID, select the team, and enable automatic signing.
  5) Archive → Distribute App → App Store Connect → Upload.
- **Android**:
  1) Create a keystore and store it in a secure location.
  2) Add signing configs to `gradle.properties` and `build.gradle`.
  3) Build a signed release AAB/ APK using the release signing config.
  4) Upload the AAB to Google Play Console.

## Internal testing steps
1) Run a smoke test on iOS and Android devices (or emulators) to verify onboarding, swipe interactions, and list management flows.
2) Verify permission prompts show the correct copy and that deny/allow paths behave as expected.
3) Test sync off/on flows to confirm data stays local unless enabled (**post-v1**).
4) Check UI layout on small and large screens (iPhone SE-class and large Android).
5) Verify offline behavior for core screens and graceful handling when network is unavailable.
6) Confirm notifications fire using a short reminder interval (**post-v1**).

## Feedback collection plan
- **Internal testers**: Recruit 5–10 testers with a mix of heavy/light contact lists.
- **Channel**: Use a shared feedback form (e.g., Google Form) and a dedicated Slack/Discord channel for quick notes.
- **Prompting**: Ask testers to complete a 10-minute task list (onboarding, add contacts, set reminder) and capture any friction.
- **Metrics**: Track completion rate, time-to-first-reminder, and number of contacts added.
- **Iteration**: Triage feedback weekly, fix top 3 issues, and repeat with a new build.
