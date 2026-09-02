# Strict Project Boundaries & Constraints

1.  **No Merged Responsibilities:** AI assistants writing code must NEVER alter WebRTC audio logic when tasked with UI components, and vice-versa. Respect the directory ownership defined in `resume.md`.
2.  **No Extraneous Packages:** Do not install heavy state management libraries (Redux) or animation libraries (Framer Motion) unless explicitly authorized. Rely on React state and Tailwind CSS transitions.
3.  **Cross-Platform Enforcement:** The project must run identically on Linux (Arch) and Windows. Rely exclusively on `.env.local` for environment variables. Ensure LF line endings are maintained.
4.  **No Voice Hallucinations:** The backend AI prompt must be explicitly constrained to prevent the agent from chatting casually with engineers.
5.  **Tag-Only Color Palette (No Full Card Background Fills):** Card containers must remain neutral dark zinc (`bg-zinc-900/90 border-zinc-800`). Color coding (emerald, amber, rose) is restricted strictly to header tag badges to eliminate eye strain.
