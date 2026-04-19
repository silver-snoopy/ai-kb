---
description: Karpathy-style health-check across the vault — contradictions, orphans, stale claims, missing cross-references, data gaps. Proposes fixes, waits for approval.
argument-hint: [<cert-id>|--all]
---

# /lint — vault health check

**Arguments:** `[<cert-id>|--all]` — scope of the lint. Default: `--all`.

## What to do

1. Parse `$ARGUMENTS`. Interpret missing arg as `--all`.
2. Load via `obsidian-mcp`:
   - `CLAUDE.md` (has the stale-terms list in "Stale-terms list" section)
   - `certs/*/meta.yaml` (all certs OR the one specified)
   - All `.md` files in scope:
     - `--all`: everything under `certs/`, `concepts/`, `prompts/`, `resources/`
     - `<cert-id>`: everything under `certs/<cert-id>/` plus `concepts/` (since concepts are referenced cross-cert)
3. Run 5 checks in order:

### Check 1 — Contradictions

For each factual claim in each note, look for semantically-similar claims in OTHER notes that differ materially. Focus on claims involving:
- Numeric specifics (context window sizes, token costs, question counts, model IDs)
- Definitions of named concepts
- Feature availability ("supported", "deprecated", "beta")

For each contradiction found, emit:
```
[CONTRADICTION] <topic>
  File A: <path-a>
    claim: "<quote>"
  File B: <path-b>
    claim: "<quote>"
  Which is correct? [show A / show B / skip / both wrong, research]
```

### Check 2 — Orphans

For every markdown file in scope (excluding `README.md`, `_lint/`, `dashboard.md`, `index.md`, `weakness-queue.md`, `_gaps.md`, `raw/**`):
- Count incoming wikilinks (files that link TO this one via `[[path]]` or markdown `[text](relative/path.md)`)
- Count outgoing wikilinks

If both are 0 → orphan. Emit:
```
[ORPHAN] <path>
  Note has no incoming or outgoing links.
  Options: [link from parent README / add links to referenced concepts / archive to _archive/ / skip]
```

### Check 3 — Stale claims

Parse the "Stale-terms list" section of `CLAUDE.md`. For each stale term, grep all in-scope notes.

If a stale term is mentioned without a nearby (same-paragraph) "superseded by" or "deprecated" qualifier → emit:
```
[STALE] <path>:<line>
  Mentions: "<term>"
  Context: "<sentence>"
  Options: [add "(superseded by <newer>)" annotation / update to <newer> / skip]
```

### Check 4 — Missing cross-references

For each concept that appears in 3+ cert-domain notes (detect by simple noun-phrase frequency: capitalized multi-word terms or common AI terms like "retrieval-augmented generation"), check if a note exists in `concepts/*/` whose filename matches (slugified).

If 3+ mentions but no concept note → emit:
```
[MISSING-CONCEPT] "<concept>"
  Mentioned in:
    - <path-1>
    - <path-2>
    - <path-3>+
  Options: [create stub concepts/<category>/<slug>.md / skip]
```

### Check 5 — Data gaps

For each cert with in-scope notes:
- Expected notes per domain ∝ domain weight. Rule of thumb: aim for ≥1 note per 5% of exam weight. So Domain 1 (27%) should have ≥5 notes, Domain 5 (15%) ≥3 notes.
- For each domain below its expected count, emit:
```
[GAP] certs/<cert>/<domain>/
  Weight: <N>% · Notes: <actual> · Recommended minimum: <expected>
  Suggested next topics (from meta.yaml resources if available):
    - <topic>
    - <topic>
  Options: [schedule capture session / skip for now]
```

4. Write all findings to `_lint/<YYYY-MM-DD>-report.md`:
   ```markdown
   ---
   date: <ISO-8601>
   scope: <cert-id or all>
   counts:
     contradictions: <N>
     orphans: <N>
     stale: <N>
     missing_concepts: <N>
     gaps: <N>
   ---

   # Lint Report — <date> (<scope>)

   ## Contradictions
   ...
   ## Orphans
   ...
   (etc.)
   ```

5. Walk user through each finding IN-SESSION:
   - Present the finding
   - Show the proposed fix
   - Wait for `y/n/skip` input
   - On `y`: apply the fix immediately (edit file, create stub, etc.)
   - On `n`: skip; record in report as "declined"
   - On `skip`: defer; record as "deferred"

6. After all findings processed, regenerate `index.md`:
   - Walk all `.md` files under `certs/*/domain-*/` and `concepts/`
   - For each: read frontmatter (or first non-frontmatter sentence as summary fallback)
   - Rewrite `index.md` with sorted rows + `_Last updated:_` header set to now
   - Also: if `index.md` is missing or last-updated is >7 days old → force regen regardless of whether this lint made changes

7. Final session output:
   ```
   ✓ Lint complete — <scope>
   Report: _lint/<date>-report.md
   Actions: <accepted> applied, <declined> declined, <deferred> deferred
   Index regenerated: <yes|no>
   ```

## Invariants

- **Never silently modify the vault.** Every fix is shown + approved before write.
- Always write the full report to `_lint/` even if user skips everything — it's the evidence of what was checked.
- `index.md` regeneration: after a lint that modified any file, OR on a forced cadence (`index.md` missing or older than 7 days).

## Usage examples

```
/lint                  # default: --all
/lint cca-f            # scope to one cert
/lint --all            # explicit
```
