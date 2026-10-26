# PolyPlan

A responsive personal organizer with browser-local storage, editable sample data, custom spaces, calendar and agenda filtering, next actions, in-app reminders, and JSON backups.

## Develop

Requires Node.js 22.13+ (Node 24 LTS recommended).

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

In-app reminders are evaluated while the app is open. Optional SMS uses the separately running server described below. SMS remains off until configured and enabled. Never embed SMS credentials or a personal phone number in public frontend code.

## Validation

Production build and Chromium interaction checks passed: task creation with date/time, reload persistence, completion, reopening, deletion, SMS status, and mobile horizontal-overflow check.

## SMS connection (Twilio)

The app now includes a single-user SMS backend. No SMS is sent until you configure it and explicitly opt in. Node.js **22.13+** is required (Node 24 LTS recommended; SQLite is built into Node).

1. Create a Twilio account and obtain an SMS-capable sender number. Trial accounts generally require verifying the recipient. US sending may require toll-free verification or A2P registration; follow the Twilio console requirements. Twilio charges for numbers and messages.
2. Copy `.env.example` to `.env`. Enter your Account SID, Auth Token, sender, and your recipient number privately in that file. Use international `+countrycode` formatting. Generate `POLYPLAN_ACCESS_TOKEN` with `openssl rand -hex 32`. Never commit `.env`, share the token publicly, or prefix credentials with `VITE_`.
3. In one terminal, run `npm run server`. In another, run `npm run dev`.
4. Open Settings & reminders in PolyPlan. Paste the private connection key (not your Twilio Auth Token), check the connection, review the consent text, and enable reminders. The connection key lasts for this browser tab's session. It grants access to your personal scheduler: keep it private.
5. Add a task with a future date and time. A project defaults to 3 days before; homework to 1 day. Choose “On the due date” for a near-future test. After syncing, the server checks every 15 seconds. Provider acceptance is displayed separately from actual delivery. Check Twilio's console for delivery failures and opt-outs.

Only titles and computed reminder timestamps are synced; notes and your full workspace remain in the browser. Sync replaces the active server schedule. Use one browser as the scheduling source; other browsers are not a multi-device task sync. Editing/completing/deleting items updates the server while connected. If the key expires from your browser session, reconnect before editing schedules. The last successfully synced schedule remains active until disabled, even with the website closed. Failed syncs show a warning. Imported backups update that schedule when connected.

Date-only tasks remind at **9 AM in your device timezone**; date/time tasks use the entered local time, minus the chosen number of calendar days. The server receives an absolute timestamp. Past reminders on first sync are skipped. Outages longer than an hour skip missed reminders. Each task/time pair is claimed once; ambiguous provider failures are not automatically retried, to avoid duplicate texts. Check the provider console before rescheduling an unconfirmed reminder. Cancelled/completed tasks are removed from pending sends after a successful sync. A send already in progress cannot be recalled. Reply STOP to opt out through Twilio, and use “Turn off text reminders” to cancel pending schedules.

### Keeping SMS running online

Your laptop must stay awake with `npm run server` running for local reminders. To work while your laptop is closed, deploy the server to an **always-on Node host with a persistent disk** for `server-data/`. Put both the website and `/api/` behind the same HTTPS origin; proxy `/api/` to the backend on port 3001, and serve the built `dist/` files. Set `APP_ORIGIN` to that exact public HTTPS origin. Keep the backend bound to loopback behind the reverse proxy. Supply `.env` values through your host's secure environment settings and run only one scheduler instance. Do not use ephemeral/serverless storage for this implementation. Back up the database privately. Node processes must be restarted after a host reboot; configure the host's restart policy. A static website deployment alone does not run the SMS scheduler.

Run `npm test` for schedule validation and mocked Twilio request/error tests. No real messages are sent by tests. Live SMS delivery has not been validated without provider credentials.
