# AI matching setup

PolyPlan now has actual model-backed matching in addition to quick local rules. The website and Chrome/Edge extension use the same local backend. Nothing is sent for AI processing until you click **Check with AI** or **Ask AI**. The default is Ollama running on your own Mac. OpenAI is optional. This is not an autonomous application bot: every model suggestion is unchecked and you review before filling or submitting.

## Option 1: local Ollama (default; no API key)

1. Download and install the Mac app from https://ollama.com/download/mac and open it. Follow its command-line installation prompt. Reopen your VS Code terminal if `ollama` is not found.
2. Download the default model once (roughly a few GB; disk/RAM requirements depend on the model):

   ```sh
   ollama pull qwen2.5:3b
   ```

3. In your PolyPlan folder, update and restart:

   ```sh
   git pull origin main
   npm install
   npm run dev:restart
   ```

4. Open http://localhost:5173 → Internships → My profile. Keep Ollama running. Click **Check AI connection**; it must say the local model is ready.
5. Add your answers or instructions, type an application question, and click **Check with AI**. You can supply dropdown options one per line. Review the source, supporting text, and suggestion. A small local model may take a minute and can abstain or make a wrong match; review remains necessary.

The default model is `qwen2.5:3b`. To use another installed Ollama model, copy `.env.example` to `.env`, set `POLYPLAN_AI_MODEL` to its exact installed name, and restart PolyPlan. A larger instruction model may handle harder wording better but needs more memory. The backend uses local port 11434 and an explicit context window. It has a request-size limit to avoid silently truncating your saved information. Shorten long notes or scan fewer questions if you reach it. No training or fine-tuning is required.

## Option 2: OpenAI API (requires a key and paid API access)

Create a local `.env` file (copy `.env.example`) with:

```dotenv
POLYPLAN_AI_PROVIDER=openai
POLYPLAN_AI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=your-key-entered-privately-on-your-computer
```

Never paste your actual key into chat, browser profile fields, an extension, or Git. Never prefix it with `VITE_`. Restart with `npm run dev:restart`. The key stays in the local Node process. A configured key is not proof of API access; a successful model request is the functional check. ChatGPT subscriptions and API billing are separate. Each model request may incur usage charges.

OpenAI processing sends the requested application labels/options plus your saved answers and profile facts to OpenAI. It does not send your résumé file or the whole page. The app and extension ask for confirmation before a cloud-model request. Review current OpenAI data handling and billing settings for your account. Ollama processing stays local after the model download.

## Use AI while filling a real application

1. Go to `chrome://extensions` (or `edge://extensions`), click Reload on PolyPlan Application Helper, and accept the new localhost permission if prompted.
2. Download your current autofill profile from PolyPlan and import it into the extension again.
3. Keep PolyPlan running at **http://localhost:5173**. Open an employer's application and click the extension → Scan.
4. Click **Ask AI about remaining questions**. This handles up to 30 eligible unresolved fields per request. A cloud provider requires confirmation; a local provider requires a running model.
5. Read the proposed answer, saved source, and supporting quote. Check the suggestions you approve, then Fill selected fields. Nothing is submitted.

Saved instruction paragraphs such as “Always say LinkedIn; if unavailable, Instagram; otherwise Other” are not pasted literally into forms. They are sent to the selected model to resolve against the actual available options. The server accepts only answers quoting your saved facts, and dropdown answers must match both a supplied option and supporting text. Unknown, conflicting, unsupported, or ungrounded outputs are discarded. Programming and spoken languages are distinct. Eligibility/pay/sponsorship questions retain exact-label restrictions. The model cannot invent work history, years of experience, or other applicant facts.

## Current boundaries and validation

The model backend runs with `npm run dev` / `dev:restart`. Static `dist/` hosting or `npm run preview` alone does not run it. Remote/network clients are blocked from these AI endpoints; this version is for one Mac, not a public multi-user AI service. Don't publish the Vite server as a production backend. There is no user database or cloud sync.

Provider request formatting, source-grounding, option validation, abstention, browser preview refresh, and extension dropdown handling are tested with fixtures and mocked model responses. No live model inference was verified in the development environment because it has neither Ollama/model files nor an API credential. Your connection test and first successful Check with AI request verify the selected model on your Mac. AI suggestions still require human review and may be wrong.
