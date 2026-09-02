# Demo Execution & Run-Sheet

The final code must support this exact 90-second incident scenario:

1.  **[00:00]** Call starts. 4 human engineers are connected. Agent is connected (Ambient Mode).
2.  **[00:15]** Akthar speaks: "Database is dropping connections."
3.  **[00:20]** Agent parses as `[HYPOTHESIS]`. Internal check reveals DB is fine. Agent flags `[CONTRADICTION]` silently on UI.
4.  **[00:35]** Ashrith speaks: "Ingress pods are OOMing."
5.  **[00:40]** Agent diagnoses the true root cause (Ingress Port Mismatch 8080 -> 8000).
6.  **[00:50]** Agent stages the fix. The Red HITL Guardrail Card appears on all screens.
7.  **[00:55]** Sarah (Lead) verbalizes: "EchoSphere, authorize patch" OR clicks the `[1-Click Hotfix]` button.
8.  **[01:00]** API returns 200 OK. UI turns Emerald. Incident resolves.
