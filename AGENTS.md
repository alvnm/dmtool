## Agent skills

### Issue tracker

Local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles recorded as a `Status:` line per issue. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Context window tracker

Whenever the user asks how much context/session memory is used or left ("context", "tokens", "cuánto queda"), or when a session grows noticeably long, run the `context-tracker` skill in `.agents/skills/context-tracker/`: it estimates usage, renders a bar with a breakdown, and appends an entry to `.freebuff/context-log.md` (gitignored). Estimates only — never claim exact token counts; Freebuff does not expose them to the agent.