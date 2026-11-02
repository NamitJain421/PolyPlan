# AI assistant setup

The assistant currently adds online assessment entries from your messages. The default model runs locally using Ollama. The website and AI server must be running on your Mac; a static deployment alone does not run the AI server.

1. Install and open [Ollama for Mac](https://ollama.com/download/mac).
2. In a terminal run `ollama pull qwen2.5:3b`. The model download is several gigabytes.
3. In the PolyPlan folder run `npm install` and `npm run dev:restart`.
4. Open http://localhost:5173 and select **Assistant**. For example: “Add my Nvidia OA. It has two coding questions and is due 2027-01-15.”
5. The entry appears in Internships → Online assessments. Edit it there if needed. Dates without an explicit ISO year, month, and day remain in the notes for you to confirm.

The local model can make mistakes; review the new entry. If it cannot find a company in your message, it asks you to send the message again including the company. Your message is processed locally by Ollama, and your saved workspace is not automatically sent to the model.

## Optional OpenAI API

Copy `.env.example` to `.env` and set `POLYPLAN_AI_PROVIDER=openai`, `POLYPLAN_AI_MODEL=gpt-4.1-mini`, and `OPENAI_API_KEY` privately on your computer. Restart PolyPlan. Never commit your key or put it in a `VITE_` variable. Each request sends your message to OpenAI after your confirmation and may incur API charges. A configured key does not prove the API account works.

The server is designed for local use; do not expose it as a public multi-user service. A live model is required to verify the actual AI response. Automated tests use mock provider responses.
