# Enterprise Aesthetic & UI Constraints (Google Meet Theme)

**Visual Identity:** The UI must reflect a sleek, professional Google Meet dark mode War Room (`#202124` / `#171717`).

**Google Meet Typography & Color Rulebook:**
*   **Backgrounds:** Use Google Dark Charcoal (`#202124`, `bg-zinc-950`, or `#171717`). NEVER use pure `bg-black`.
*   **Video Tiles & Containers:** Use Google Meet dark surface cards (`#28292c` or `bg-zinc-900/90`) with rounded corners (`rounded-2xl` / `rounded-xl`) and clean dark borders (`border-zinc-800`).
*   **Typography:** Google Sans / Inter (`font-sans`) for all UI titles, participant labels, and control buttons. Use `font-mono` ONLY for terminal outputs, CLI commands, and code snippets inside the HITL capsule.
*   **Participant Tile Badges:** Bottom-left semi-transparent pill labels (`bg-zinc-900/80 backdrop-blur-md rounded-md text-xs font-medium text-zinc-100`).
*   **Active Speaker Highlight:** Google Blue/Teal ring (`ring-2 ring-blue-500` or `border-blue-500`).
*   **Color Coding (Strict Tag-Only Rule):**
    Colors are applied **strictly to top header tag badges**, keeping card bodies clean and neutral:
    *   `[FACT]` tag badge = `emerald` (`text-emerald-400`, `bg-emerald-950/60 border-emerald-800/60`)
    *   `[HYPOTHESIS]` tag badge = `amber` (`text-amber-400`, `bg-amber-950/60 border-amber-800/60`)
    *   `[CONTRADICTION]` & `[HITL ACTION]` tag badge = `rose` (`text-rose-400`, `bg-rose-950/60 border-rose-800/60`)

**Prohibited Elements (HARD FAIL):**
*   No glowing drop shadows (`shadow-[0_0_15px_rgba(...)]`).
*   No neon green / matrix hacker aesthetics.
*   No full-card color background fills.
*   No bouncing, pulsing, or distracting animations outside of the subtle 1-Click Hotfix button transition.
