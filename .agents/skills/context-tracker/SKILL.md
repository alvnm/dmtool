---
name: context-tracker
description: Track this session's context-window usage (estimated) and keep an append-only log at .freebuff/context-log.md. Use when the user asks how much context remains/is used, mentions "context window", "tokens", "cuánto queda", or when a session grows long and the user should consider starting fresh.
---

# Context Window Tracker

Estimate how much of the model's context window this session is using, show a breakdown, and record it in a log file. **Freebuff does not expose exact token counts to the agent**, so every number here is an estimate. Never present an estimate as an exact measurement — always label it "(estimated)".

## Constants (edit for your model)

Defined at the top of `.freebuff/context-log.md`; read them from there before computing:

- `CONTEXT_LIMIT` — total window in tokens. Default `200000`. Adjust to the model in use.
- `BASELINE_SYSTEM` — one-time cost of the system prompt, tool schemas, and skill inventory, invisible in the transcript. Default `25000`. Only recalibrate if the user reports a real number (e.g. from a `/context`-style UI readout).
- `CHARS_PER_TOKEN` — `4` for English/code/JSON, `3.3` for Spanish prose. Weight mixed sessions at ~`3.8`.

## Method

1. Read the constants and the last entry from `.freebuff/context-log.md` (create it if missing, with the header block from the Log format below).
2. Estimate the conversation: sum the characters of the visible transcript — user messages, assistant messages, tool results, file contents read this session — and divide by `CHARS_PER_TOKEN`.
3. Total = `BASELINE_SYSTEM` + conversation estimate. Compute `used%` of `CONTEXT_LIMIT`.
4. Break down the estimate into: system+tools (the baseline), conversation text, and tool results/files (the big JSON/HTML dumps usually dominate — call these out by name so the user sees what to avoid).

## Output

Render a bar plus the breakdown, e.g.:

```
Context (estimated): 42k / 200k tokens — 21% [███..............]
  system+tools   ~25k
  tool results   ~12k  (biggest: GitHub tree JSON)
  messages        ~5k
```

Then append one entry to the log (see below).

## Thresholds

- `< 50%` — healthy; no advice needed.
- `50–75%` — mention that a cleanup or `/handoff` becomes worthwhile soon.
- `75–90%` — recommend wrapping up the current thread and starting a new session; offer `/handoff`.
- `> 90%` — urgent: finish the current step, avoid loading large files, and start a new session.

Never block or abort work because of these thresholds; they are informational. Do not re-run this tracker unprompted more than once per exchange.

## Log format (`.freebuff/context-log.md`, gitignored)

```markdown
# Context log — <project>

Constants: CONTEXT_LIMIT=200000 BASELINE_SYSTEM=25000 CHARS_PER_TOKEN=3.8

## 2026-10-17T22:30Z — session-1 (MiMo v2.6 Flash Fast)
- used: ~42k/200k (21%, estimated)
- breakdown: system+tools ~25k · tool results ~12k · messages ~5k
- note: heaviest was the GitHub tree JSON fetch
```

Append newest entries at the bottom of the file; never rewrite history. Timestamps in ISO-8601 UTC.