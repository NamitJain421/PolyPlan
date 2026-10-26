# PolyPlan

A personal workspace for classes, tasks, and internship applications. Data stays in your browser; no account or backend is required. SMS has been removed.

## Run on your Mac

Use Node.js 22.12+ (Node 24 LTS recommended). Open the repository folder in VS Code, then run:

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Keep the terminal running. Use `npm ci` instead of `npm install` for a repeatable clean install. Production: `npm run build`, then deploy the `dist/` folder to a static host; `npm run preview` checks the build locally. Google Fonts is optional and system fonts work offline.

## Planner

Create, rename, reorder, and delete custom spaces. Add tasks with optional class/category, dates, times, notes, priority, availability, and next actions. Calendar and list filters use your device timezone. In-app reminders are checked while the app is open. Sample relative or incomplete dates remain unscheduled until confirmed. Planner data uses `polyplan.v1` in localStorage.

## Internships

Open **Internships** in the main navigation. Applications, Technical, Behavioral, and Online Assessments have separate table tabs. Use Add new to create entries, Edit to update or delete them, the search box to find records, and table headings to sort. Technical and Behavioral columns match the provided spreadsheet structure. OA includes company, notes, link, due date, and status. Tables scroll horizontally on narrow screens.

Applications track company, role, link, status, reason/next action, deadline, applied date, and notes. “Saved for later” requires a short reason. Check Applied only after you have submitted on the employer's site. It records the current local date; you can edit historical dates. Interviewing/Offer/Rejected statuses retain an existing applied date. Opening or autofilling a form does **not** mark it as submitted. There are no invented application-history rows.

The entry form's **Read company & role from link** button uses public metadata from standard Greenhouse (`job-boards.greenhouse.io` or `boards.greenhouse.io`) and Lever (`jobs.lever.co`) links. Company board slugs may need correcting. It never overwrites company/role text you already entered. Other links, unavailable listings, and CORS/network restrictions fall back to manual entry. No employer account, private page, or login is scraped. Real external listings have not been validated without user-provided target links.

## Application autofill

A website cannot fill forms on a different website. The included Chrome/Edge extension performs review-first autofill from your saved profile on the application tab you choose. See [extension/README.md](extension/README.md) for installation and limits. A native Safari build is not included.

1. In Internships → My profile, enter your information and any exact questions/answers you approve.
2. Save, then download the private autofill profile. Never commit it or share it publicly.
3. Load the `extension` folder in your browser's developer extension screen and import the profile there.
4. Optionally select your résumé PDF/Word file in the extension. PolyPlan does not parse it, upload it to a server, or invent facts from it.
5. Open an employer application, scan, review proposed matches, and fill selected fields. Review the actual form and submit manually. Repeat for each application page.

This is a working common-field helper, **not universal end-to-end auto-apply**. It supports labeled standard fields, exact native dropdown matches, exact approved custom answers, and clearly labeled résumé uploads. Login, CAPTCHA, screening questions without approved answers, consents, demographic fields, custom widgets, repeated work-history blocks, and some embedded forms remain manual. No AI service or credentials are required.

To personalize the profile, gather your résumé, name/contact details, city and address as needed, LinkedIn/GitHub/portfolio links, school/degree/major and graduation date, and your own verified answers to work-authorization/sponsorship, availability, and relocation questions. Do not put passwords, SSN, or identity documents into the profile. Employer-specific eligibility and essay answers must be reviewed separately. Representative application links and your browser are needed to validate real-site coverage.

## Storage and backups

Planner tasks and the internship workspace use separate local browser storage keys (`polyplan.v1` and `polyplan.career.v1`). Planner Settings exports/imports planner data; Internships → Backup/Restore includes application tables, interview notes, and your application profile. Restore replaces only its corresponding workspace after confirmation. Back up **both** before changing devices or clearing browser data. A Git pull updates app code, not your personal browser data. The extension keeps a separate local profile/résumé copy; reimport after editing your profile. These files contain personal information. Exported private files are ignored by Git via filename patterns.

If an old SMS server is still running from an earlier version, stop its terminal with Control+C and disable its host service. Removing this UI does not stop a separately deployed old server. Do not delete private `.env` or server data without keeping any backup you need.

## Validation

`npm test` covers career-backup validation and supported listing URL parsing. `npm run build` checks the production bundle. Chromium interaction tests cover internship CRUD, saved reasons, application checkmarks, persistence, tables, profile export, and responsive overflow. Autofill tests use a local synthetic employer form, never submit it, and check that unsupported/sensitive/populated inputs remain unchanged. No live employer submission is performed.

## Saving reliably and finding your old data

Use **http://localhost:5173** consistently. The development and preview servers now use a strict port: if 5173 is occupied they stop with an error instead of silently starting on a new port with separate browser storage. Stop your previous Vite terminal with Control+C before starting another. `http://127.0.0.1:5173`, another port, a network IP, HTTPS, and another browser all have their own storage. If your previous work appears missing, reopen the exact old address/browser and export its backup, then import at the address you want to keep using. The app cannot read another origin's storage automatically.

Planner saves merge changed task records and fields into the latest stored workspace instead of writing an entire stale tab snapshot. Storage/focus events refresh idle views. This prevents an older tab's unrelated save from undoing completed/deleted tasks. This is still localStorage, not a transactional cloud database or a cross-device synchronization service; avoid simultaneous conflicting edits to the same field. Corrupt saved data is preserved and saves are blocked rather than silently replacing it. The save badge opens storage information. Browser profile deletion, private mode, clearing site data, storage eviction, and device loss can still remove data, so keep exported backups.

The application profile auto-saves as you type, including approved answers with nonempty question labels. You don't need a complete profile to track internships; enter only the facts you want reused for autofill. Save/download buttons remain for explicit confirmation and extension exports. Updates do not automatically refresh the extension's separate copy: export/import again after changing your profile.

**Apply assistant** is the first internship tab. Paste a link and choose Prepare application or Save for later. Supported public metadata is loaded where available; otherwise enter company and role in the form. Save the record, open its application link, and use the extension to review/fill on the employer's form. It cannot universally apply to every site, log in, infer your screening answers, or submit for you.

The technical, behavioral, and OA defaults are transcribed from the provided spreadsheet screenshots (3/2/5 actual rows; template examples excluded). Existing matching company/round entries and profile data are preserved. A stored migration marker ensures the defaults are inserted once and stay deleted after you remove them. Notes are editable; statuses/dates absent in the screenshots remain blank. An old backup is treated as intentional replacement and does not automatically re-add deleted defaults.
