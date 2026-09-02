# Agent Logic & Analytical Core

**Architecture Flow:**
1. Agora RTC ingests 16kHz PCM audio.
2. Deepgram Nova-3 (STT) streams transcripts via Agora RTM.
3. The LLM Brain parses transcripts in real-time, matching spoken words against internal system diagnostic mocks (HolmesGPT).
4. If a contradiction is found (e.g., "DB is down" vs. "DB CPU is 2.1%"), the Agent suppresses false paths.
5. If the root cause is isolated (e.g., Ingress port 8080 vs 8000 mismatch), the Agent triggers the HITL (Human-in-the-Loop) Guardrail UI and stages the patch.

**Decision Thresholds:**
*   **Silence Directive:** The AI must remain silent 95% of the time.
*   **Interruption Limit:** When the AI does speak (via MiniMax TTS), it must use a maximum of 15 words.
