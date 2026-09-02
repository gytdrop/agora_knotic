# Enterprise Aesthetic & UI Constraints

**Visual Identity:** The UI must reflect a high-stakes, professional "Dark Mode" War Room. 

**Tailwind CSS Rulebook:**
*   **Backgrounds:** Use `bg-zinc-900`, `bg-zinc-950`, or `#1A1C1E`. NEVER use pure `bg-black`.
*   **Containers & Cards:** Use `bg-zinc-800` with subtle borders (`border-zinc-700`) and slight opacity (`bg-zinc-900/80` with `backdrop-blur-md`).
*   **Typography:** Use sans-serif (Inter, Geist) for main UI. Use `font-mono` ONLY for terminal outputs and code snippets inside the HITL capsule.
*   **Color Coding (Strict):**
    *   `[FACT]` = `emerald` (e.g., `text-emerald-400`, `bg-emerald-950/40`)
    *   `[HYPOTHESIS]` = `amber` (e.g., `text-amber-400`, `bg-amber-950/40`)
    *   `[CONTRADICTION]` & `[HITL ACTION]` = `rose` (e.g., `text-rose-400`, `bg-rose-950/50`)

**Prohibited Elements (HARD FAIL):**
*   No glowing drop shadows (`shadow-[0_0_15px_rgba(...)]`).
*   No neon green/matrix hacker aesthetics.
*   No bouncing, pulsing, or distracting animations outside of the subtle 1-Click Hotfix button transition.
