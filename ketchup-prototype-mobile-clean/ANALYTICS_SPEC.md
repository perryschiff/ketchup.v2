# Analytics Spec

## Required common fields (all events)

| Field | Type | Requirement | Notes |
| --- | --- | --- | --- |
| `user_id` | string | **Required** | Stable, app-level user identifier. Use the authenticated user ID if available; otherwise a temporary anonymous ID that later resolves to the user. |
| `session_id` | string | **Required** | Unique per app session (e.g., UUID). Regenerate on cold start or after inactivity timeout. |
| `timestamp` | string (ISO-8601) | **Required** | Client time in UTC, e.g. `2025-01-15T18:42:11.123Z`. |
| `app_version` | string | **Required** | App release version, e.g., `1.2.3`. |
| `platform` | string | **Required** | Client platform, e.g., `ios`, `android`, `web`. |
| `device_os_version` | string | **Required** | OS version on the device, e.g., `iOS 17.3`, `Android 14`. |

## Onboarding events

| Event name | When it fires | Properties (in addition to required common fields) |
| --- | --- | --- |
| `onboarding_started` | User begins onboarding flow. | `entry_point` (string, e.g., `first_launch`, `settings`). |
| `contacts_permission_granted` | OS contacts permission approved. | `permission_status` (string, `granted`), `prompt_type` (string, e.g., `system_prompt`, `settings_redirect`). |
| `contacts_permission_denied` | OS contacts permission declined. | `permission_status` (string, `denied`), `prompt_type` (string, e.g., `system_prompt`, `settings_redirect`), `denial_reason` (string, optional, e.g., `user_dismissed`, `never_ask_again`). |
| `contacts_selected_count` | User confirms number of contacts selected during onboarding. | `selected_count` (number), `total_available` (number, optional), `source` (string, e.g., `device_contacts`, `manual_entry`). |
| `onboarding_completed` | User finishes onboarding flow successfully. | `completion_method` (string, e.g., `full`, `skipped_optional`), `time_to_complete_seconds` (number). |

## Engagement (swiping and actions)

| Event name | When it fires | Properties (in addition to required common fields) |
| --- | --- | --- |
| `swipe_left` | User swipes left on a contact card. | `contact_id` (string), `position` (number, card index), `deck_id` (string, optional). |
| `swipe_right` | User swipes right on a contact card. | `contact_id` (string), `position` (number, card index), `deck_id` (string, optional). |
| `call_tapped` | User taps the call action from a contact card or detail view. | `contact_id` (string), `surface` (string, e.g., `card`, `detail`), `phone_number_present` (boolean). |
| `text_tapped` | User taps the text/SMS action from a contact card or detail view. | `contact_id` (string), `surface` (string, e.g., `card`, `detail`), `phone_number_present` (boolean). |

## Preferences and list editing

| Event name | When it fires | Properties (in addition to required common fields) |
| --- | --- | --- |
| `frequency_set` | User sets their catch-up frequency. | `frequency_type` (string, `preset` or `custom`), `preset_value` (string, optional, e.g., `weekly`, `monthly`), `custom_days` (number, optional). |
| `list_edit_add` | User adds a contact to their list. | `contact_id` (string), `source` (string, e.g., `search`, `suggested`, `contacts_import`). |
| `list_edit_remove` | User removes a contact from their list. | `contact_id` (string), `source` (string, e.g., `list`, `detail`). |
