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

Valid Tags: [FACT], [HYPOTHESIS], [CONTRADICTION], [ACTION].
UI must map FACT to emerald, HYPOTHESIS to amber, and CONTRADICTION to rose.
