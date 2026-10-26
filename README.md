# PolyPlan

A responsive personal organizer with browser-local storage, editable sample data, custom spaces, calendar and agenda filtering, next actions, in-app reminders, and JSON backups.

## Develop

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

## Production

```sh
npm run build
npm run preview
```

Deploy `dist/` to a static website host. No account or external API is required. Google Fonts is optional; system fonts are used if unavailable.

## Privacy and reminders

Data is stored in this browser's localStorage. Use Settings → Export backup before clearing browser data or switching devices. Sample relative or incomplete dates are deliberately unscheduled, with the original context preserved in notes. Dates and times use the device's local timezone.

Reminders are evaluated while the app is open. Real SMS is not implemented: it needs a secure server, persistent task scheduling, an SMS provider, verified recipient consent, and delivery/error handling. Never embed SMS credentials or a personal phone number in public frontend code. The UI explicitly identifies SMS as not connected.

## Validation

Production build and Chromium interaction checks passed: task creation with date/time, reload persistence, completion, reopening, deletion, SMS status, and mobile horizontal-overflow check.
