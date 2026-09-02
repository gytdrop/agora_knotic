# UI Structure & Color Distribution Rules

**Core Aesthetic Principle:**
The War Room UI must be clean, professional, and dark-mode neutral. To prevent visual clutter and eye fatigue during high-stress Sev-1 calls, **FULL CARD COLOR BACKGROUNDS ARE STRICTLY PROHIBITED**.

## 1. Typography Rule (Montserrat & Helvetica)
*   **Montserrat & Helvetica ONLY:** All UI text, titles, participant badges, and controls must strictly use **Montserrat** and **Helvetica** (`font-sans`).
*   `font-mono` is restricted exclusively to CLI commands, terminal logs, and JSON code snippets.

## 2. Card Container Rule
*   All cards, panels, and container boxes MUST use clean, subtle neutral backgrounds (`#28292c`, `bg-zinc-900/90`, `bg-zinc-900/60`, or `bg-zinc-900`) with subtle dark borders (`border-zinc-800/80`).
*   **NEVER** fill an entire card background with tinted green/emerald, yellow/amber, or red/rose colors.

## 3. Strict Tag-Only Color Coding
Color coding is applied **ONLY to the small header tag badges** at the top of cards:

*   **`[FACT]`**
    *   Container: Neutral (`bg-[#28292c] border-zinc-800`)
    *   Tag Badge: Emerald text/pill (`bg-emerald-950/60 text-emerald-400 border border-emerald-800/60`)

*   **`[HYPOTHESIS]`**
    *   Container: Neutral (`bg-[#28292c] border-zinc-800`)
    *   Tag Badge: Amber text/pill (`bg-amber-950/60 text-amber-400 border border-amber-800/60`)

*   **`[CONTRADICTION]`**
    *   Container: Neutral (`bg-[#28292c] border-zinc-800`)
    *   Tag Badge: Rose text/pill (`bg-rose-950/60 text-rose-400 border border-rose-800/60`)

*   **`[HITL GUARDRAIL / ACTION]`**
    *   Container: Neutral (`bg-[#28292c] border-zinc-800`)
    *   Header Capsule Badge: Rose text/pill (`bg-rose-950/60 text-rose-400 border border-rose-800/60`)
    *   Action Button: Rose button (`bg-rose-600 hover:bg-rose-500 text-white`), turning Emerald upon 200 OK execution.
