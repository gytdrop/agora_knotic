# Enterprise Aesthetic & UI Constraints

**Visual Identity:** The UI must reflect a high-stakes, professional "Dark Mode" War Room. 

**Tailwind CSS Rulebook:**
*   **Backgrounds:** Use `bg-zinc-900`, `bg-zinc-950`, or `#1A1C1E`. NEVER use pure `bg-black`.
*   **Containers & Cards:** Use neutral dark zinc (`bg-zinc-900/90` or `bg-zinc-800`) with subtle dark borders (`border-zinc-800/80`). NEVER fill entire card backgrounds with bright tinted colors.
*   **Typography:** Use sans-serif (Inter, Geist) for main UI. Use `font-mono` ONLY for terminal outputs, CLI commands, and code snippets inside the HITL capsule.
*   **Color Coding (Strict Tag-Only Rule):**
    Colors are applied **strictly to top header tag badges**, keeping card bodies clean and neutral:
    *   `[FACT]` tag badge = `emerald` (`text-emerald-400`, `bg-emerald-950/60 border-emerald-800/60`)
    *   `[HYPOTHESIS]` tag badge = `amber` (`text-amber-400`, `bg-amber-950/60 border-amber-800/60`)
    *   `[CONTRADICTION]` & `[HITL ACTION]` tag badge = `rose` (`text-rose-400`, `bg-rose-950/60 border-rose-800/60`)

**Prohibited Elements (HARD FAIL):**
*   No glowing drop shadows (`shadow-[0_0_15px_rgba(...)]`).
*   No neon green / matrix hacker aesthetics.
*   No full-card color background fills (causes eye strain).
*   No bouncing, pulsing, or distracting animations outside of the subtle 1-Click Hotfix button transition.
