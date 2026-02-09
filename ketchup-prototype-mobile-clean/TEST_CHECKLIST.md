# Pre-Beta Manual Test Checklist

## Functional test cases

### Permissions
- [ ] First launch requests Contacts permission; allow access and verify contact list loads.
- [ ] Deny Contacts permission and confirm the app shows a clear empty/blocked state with guidance.
- [ ] Re-open app after denial and verify the permission prompt does not loop; ensure user can re-attempt.
- [ ] Toggle Contacts permission in OS settings while app is backgrounded and confirm the UI updates after return.
- [ ] Grant/deny Call/Phone permission (Android) and verify behavior matches expectation when initiating a call.
- [ ] Grant/deny SMS permission (Android) and verify behavior matches expectation when sending a text.

### Minimum contact selection
- [ ] Attempt to proceed with fewer than the minimum required contacts; verify validation messaging.
- [ ] Select the minimum number of contacts and verify the app allows proceeding.
- [ ] Deselect a contact to drop below minimum; confirm the app blocks progression and shows feedback.
- [ ] Select beyond the minimum; verify the app allows extra selections without errors.

### Swipe actions
- [ ] Swipe right on a contact to trigger the primary action; verify the expected outcome and UI feedback.
- [ ] Swipe left on a contact to trigger the secondary action; verify expected outcome and UI feedback.
- [ ] Cancel a swipe mid-gesture and verify no action is triggered.
- [ ] Perform rapid consecutive swipes and ensure no accidental duplicate actions.

### Call/Text actions
- [ ] Tap Call action and verify the system call UI opens with the correct number.
- [ ] Cancel the call from the system UI and confirm the app remains stable.
- [ ] Tap Text action and verify the system SMS composer opens with the correct number.
- [ ] Send a message and ensure returning to the app is stable.
- [ ] Attempt call/text on a contact with missing phone number; verify an error or disabled state.

## Regression test cases

### List edit
- [ ] Add a contact to the list and confirm it appears immediately.
- [ ] Remove a contact and confirm it disappears from the list and selection count updates.

### Frequency settings
- [ ] Select each frequency preset and verify the UI reflects the chosen cadence.
- [ ] Switch between frequency presets and confirm only the latest selection is active.
- [ ] Enter a custom frequency interval within allowed bounds and verify it is accepted.
- [ ] Enter a custom frequency interval outside allowed bounds and verify validation messaging.
- [ ] Enter non-numeric or empty custom intervals and verify input validation behavior.

### Persistence
- [ ] Force close and relaunch; verify selected contacts persist.
- [ ] Reboot device and relaunch; verify selections persist.
- [ ] Log out/log in (if applicable) and confirm data integrity.
- [ ] Update app build (same data store) and confirm selections persist.
- [ ] Set different frequency settings per contact, restart the app, and confirm each contact retains its frequency.

## Device matrix

### iOS
- [ ] iOS 16 (e.g., iPhone 12/13)
- [ ] iOS 17 (e.g., iPhone 14/15)

### Android
- [ ] Android 12 (mid-tier device)
- [ ] Android 13 (mid-tier device)
- [ ] Low-end Android (Android 12/13, 2–3 GB RAM)

## Notes
- Record device model, OS version, and build number for each test run.
- Log any crashes, UI glitches, or unexpected permission behavior with steps to reproduce.
