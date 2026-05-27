---
description: Always-on MAU APP workspace rule for Antigravity. Keeps Antigravity aligned with Codex and AGENTS.md.
alwaysApply: true
---

# MAU APP Antigravity Rule

This rule is a lightweight Antigravity entrypoint. The full project instruction remains:

@../../AGENTS.md

## Required Behavior

- Treat `AGENTS.md` as the single source of truth for MAU APP architecture, folder routing, security, progress reports, and delivery rules.
- Before editing files, read `AGENTS.md`, inspect `git status`, identify affected scope, then read the matching folder agent:
  - `astro/frontend_agent.md` for web frontend.
  - `materialize-fastapi/backend_agent.md` for backend/API/database/integrations.
  - `desktop-app/desktop_agent.md` for desktop WPF.
  - `mobile-app/mobile_agent.md` for mobile.
  - `mobile-app/nativewind_agent.md` when mobile UI/styling is affected.
- Keep backend FastAPI as the source of truth. Web, mobile, and desktop are clients only.
- Never write to DB2, DB3, or DB4. Store derived/cache/log data only in DB1 when needed.
- Use minimal, safe changes. Do not overwrite work from Codex, Antigravity, or the user without checking diffs and explaining the reason.
- If a rule changes here, update `AGENTS.md`. If a rule changes in `AGENTS.md`, update this file when the Antigravity summary is affected.
- Create or update `docs/report-progress/progress-YYYY-MM-DD.md` when adding new files or changing major application flows, API contracts, database/migrations, auth/permissions, integrations, or cross-module refactors.

## Output Expectations

- Summarize changed files, verification performed, gap/risk, and next step.
- Keep technical explanations practical and aligned with the existing project structure.
