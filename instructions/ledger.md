# Conversation Parsing Data Structure

The real-time parsing side-drawer relies on a strict data payload broadcasted via Agora RTM. The UI expects this exact schema for rendering:

```json
{
  "timestamp": "12:30:15",
  "speaker": "Akthar",
  "text": "Database is locked up.",
  "tag": "HYPOTHESIS", 
  "status": "SUPPRESSED",
  "reason": "HolmesGPT shows healthy DB connection pools."
}
```

Valid Tags: `[FACT]`, `[HYPOTHESIS]`, `[CONTRADICTION]`, `[ACTION]`.

### UI Rendering Rules (Tag-Only Colors):
*   **Card Containers:** Must stay neutral dark zinc (`bg-zinc-900/90 border-zinc-800`). Full card color fills are prohibited to prevent visual eye strain.
*   **Tag Badges:** Colors are applied **ONLY to the header tag badges**:
    *   `[FACT]` = Emerald badge (`bg-emerald-950/60 text-emerald-400 border-emerald-800/60`)
    *   `[HYPOTHESIS]` = Amber badge (`bg-amber-950/60 text-amber-400 border-amber-800/60`)
    *   `[CONTRADICTION]` = Rose badge (`bg-rose-950/60 text-rose-400 border-rose-800/60`)
    *   `[ACTION]` = Rose badge (`bg-rose-950/60 text-rose-400 border-rose-800/60`)
