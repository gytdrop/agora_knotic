---
trigger: always_on
---

# Worktree Environment Rules

The following rules must be strictly followed when operating in this workspace:

## 1. Repository Root Read-Only Policy
- The repository root (`/home/boris/Projects/agora`) is strictly **read-only** unless explicitly requested by the user.
- Do not edit, create, or delete any files in the repository root without explicit permission.

## 2. Active Development Environment
- Always assume this worktree (`/home/boris/Projects/agora/.worktrees/agent-engine-ops`) and its branch (`agent-engine-fixes`) are the active development environment.
- All code edits, tool invocations, package installations, builds, and test runs must occur within this worktree.
