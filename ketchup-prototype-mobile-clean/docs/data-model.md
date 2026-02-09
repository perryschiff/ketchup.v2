# Ketchup v1 Data Model

## Contact
Represents a device contact selected by the user.
- **id**: string (stable device contact identifier)
- **name**: string
- **phoneNumbers**: string[] (normalized E.164 if possible)
- **photoUri**: string | null

## KetchupListItem
Represents a contact included in the user’s curated list.
- **contactId**: string (foreign key to Contact)
- **frequencyType**: "preset" | "custom"
- **frequencyPreset**: "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual" | "yearly" | null
- **customIntervalDays**: number | null
- **createdAt**: ISO-8601 string
- **updatedAt**: ISO-8601 string

## Interaction (optional v1.1)
Captures user actions for future prioritization.
- **contactId**: string
- **type**: "swipe_left" | "swipe_right" | "call" | "text"
- **timestamp**: ISO-8601 string
