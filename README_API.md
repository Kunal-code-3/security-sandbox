AI Simulator Integration

1. Install dependencies:

```bash
npm install
```

2. Credentials and behavior

- If you provide a Google key (set `GOOGLE_API_KEY` in `.env` or configure `GOOGLE_APPLICATION_CREDENTIALS`), the server will attempt to use the Google Generative API (Gemini/text-bison style) to generate questions.
- If you provide an OpenAI key (`OPENAI_API_KEY`), the server will use OpenAI as a fallback.
- If no API credentials are present, the server automatically uses a deterministic mock generator so the UI remains fully functional for testing.

Example `.env` (do NOT commit):

```
OPENAI_API_KEY=sk-xxxx
# or
GOOGLE_API_KEY=AIza... or set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

3. Run server:

```bash
npm start
```

4. Open the simulator in your browser:

http://localhost:3000/ai-simulator.html

Notes:
- The server writes a lightweight `ai-usage.log` for request tracking and maintains an in-memory usage summary at `/api/status`.
- The server includes a basic rate limiter. For production you should add authentication, robust billing/token accounting, and stricter quotas.
- Never commit `.env` or service-account files to source control.
