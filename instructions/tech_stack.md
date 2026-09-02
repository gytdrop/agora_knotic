# EchoSphere Technical Architecture

**Core Framework:**
*   **Next.js 14 (App Router):** All server logic resides in `app/api/`. React Server Components (RSC) are preferred unless client-side state (`use client`) is required for WebRTC/UI interactivity.
*   **React 18 & TypeScript:** Strict typing required for all Agora RTM payloads and component props.

**Voice & AI Infrastructure:**
*   **Agora RTC (Real-Time Communication):** Used strictly for raw audio transport between human engineers and the AI agent. Target latency: <300ms.
*   **Agora Conversational AI:** Manages the STT/LLM/TTS pipeline.
    *   *STT (Speech-to-Text):* Deepgram Nova-3.
    *   *TTS (Text-to-Speech):* MiniMax.
*   **Agora RTM (Real-Time Messaging):** Used as a secondary data channel to broadcast the agent's internal reasoning (`[CONTRADICTION]`, `[FACT]`) to the React frontend without relying on audio streams.

**Deployment Constraints:**
*   **Cross-Platform:** Code must execute flawlessly on Arch Linux and Windows. Rely strictly on `pnpm` and `.env.local`. Do not write OS-specific shell scripts in `package.json`.
