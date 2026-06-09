---
name: Gemini model selection
description: Which Gemini model to use in the api-server chat route and why gemini-1.5-flash broke.
---

The api-server uses `@google/generative-ai` (NOT the newer `@google/genai`) to call Gemini.

**Rule:** Use `gemini-2.0-flash` as the model name. `gemini-1.5-flash` returns a 404 ("not found for API version v1beta") on the user's API key.

**Why:** `gemini-1.5-flash` was deprecated and removed from the v1beta endpoint. `gemini-2.0-flash` is the correct current model for this use case.

**How to apply:** Any time the chat route model name needs changing, edit `artifacts/api-server/src/routes/chat.ts` and restart the `artifacts/api-server: API Server` workflow. The API server rebuilds on every start (esbuild → dist/).
