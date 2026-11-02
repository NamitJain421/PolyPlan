# PolyPlan

A personal organization workspace for tasks, calendars, internship applications, interview notes, online assessments, and personal information. Data is saved locally in your browser without an account.

## Start

Install Node.js 22.12 or newer. In this folder, run:

```sh
npm install
npm run dev
```

Open http://localhost:5173. Keep the terminal open. If PolyPlan is already running and you need to restart it, run `npm run dev:restart`. Use the same browser and address each time because local data is specific to that address.

## Your workspace

Use Dashboard and Calendar to manage tasks and dates. Create and organize your own spaces. Internships has tabs for Applications, Technical interviews, Behavioral interviews, Online assessments, and Personal information. Add, edit, delete, and search entries in each table. Application links are for tracking opportunities; PolyPlan does not apply or submit applications.

Use the Assistant button to add online assessments from a message. It uses your configured AI provider and asks you to provide a company if it cannot identify one. It does not infer an unspecified due date. You can edit or delete the resulting entry in the OA table. The chatbot currently supports adding online assessments; other actions are not yet implemented.

Your previous saved personal information and answers are still available under Personal information. Existing planner, internship and profile data remain in the same browser storage keys. Use the separate planner and internship backup controls to protect your data before clearing browser data or switching devices. A Git pull does not transfer browser data.

## AI setup

See [AI_SETUP.md](AI_SETUP.md) for the local Ollama setup or optional OpenAI configuration. Ollama and its model must be running for the Assistant. Model results should be checked for accuracy. The optional OpenAI provider sends the message you enter to OpenAI after confirmation and may incur API charges.

Run `npm test` and `npm run build` to validate changes.
