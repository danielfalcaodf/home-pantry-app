---
name: openspec-update-change
description: Update an OpenSpec change by revising its existing planning artifacts and keeping them coherent with one another. Use when the user wants to revise a change's plan, fold new decisions into it, or reconcile its artifacts after an edit. Never edits code.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.6.0"
---

Revise a change's existing planning artifacts and keep them coherent. Never edit code.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes sorted by most recently modified. Then use the **AskUserQuestion tool** to let the user select which change to update.

   Present the top 3-4 most recently modified changes as options, showing:
   - Change name
   - Schema (from `schema` field if present, otherwise "spec-driven")
   - Status (e.g., "0/5 tasks", "complete", "no tasks")
   - How recently it was modified (from `lastModified` field)

   Mark the most recently modified change as "(Recommended)" since it's likely what the user wants to update.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Get the change's artifacts**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand current state. The response includes:
   - `schemaName`: The workflow schema being used (e.g., "spec-driven")
   - `artifacts`: Array of artifacts with their status ("done", "ready", "blocked")
   - `isComplete`: Boolean indicating if all artifacts are complete
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context. Use these instead of assuming repo-local paths.

   The artifact ids and paths come from the active schema - do NOT assume them, and do NOT branch on hardcoded artifact names. Custom schemas must work unchanged.

   The files to edit are `artifactPaths.<id>.existingOutputPaths` - the concrete files that exist on disk, already glob-expanded for glob artifacts (e.g. `specs/**/*.md`). Do NOT write to `resolvedOutputPath`: for a glob artifact it is still the glob pattern, not a real file.

3. **Understand the request**
   - If the user asked for a specific revision ("the design now uses X"), that is the starting edit.
   - If they only said "update" / "make this coherent", treat it as a coherence review: read the existing artifacts and check them against each other for contradictions, gaps, and duplication.
   - **If invoked because `/opsx:test` reported failures** (the mandatory feedback loop of this
     project): this always targets a **current, already implemented** change (never an archived
     one). Register in `tasks.md` the additional code adjustments that must be made before
     proceeding, as new unchecked tasks, and reflect any design/scope consequence in the other
     artifacts. The change can only be archived after these tasks are done and `/opsx:test`
     passes 100%.

4. **Read and reconcile**
   - Read the artifact(s) the request touches and the change's other existing artifacts.
   - Apply the requested edit. Then check every other existing artifact against it - in ANY direction: an edit to a later artifact may require revising an earlier one, not only the other way around. Build order is a useful reading order, not a constraint on which artifacts may be revised.
   - Note everything that is now inconsistent, missing, or contradictory.
   - If the request reorders or adds tasks in `tasks.md`, re-check: does a task now depend on
     a later-numbered one? Fix the ordering, don't just flag it. For a New Feature, the TDD
     order (tests before implementation) must survive the revision; for a Bug Fix, the
     order fix → bug proof → edge cases must survive it.
   - If the request expands scope (new files, new feature area touched), run `openspec list
     --json` and check the other active changes the same way `/opsx:propose` does — same
     feature dir, `schema.ts`/migrations, route under `app/`, or capability spec. If a new
     overlap appears, use **AskUserQuestion** with the same three options (sequence after /
     parallel-but-recorded / stop and revise scope), record the resolution in `proposal.md`,
     and update this change's row (and only this row, unless the user explicitly asks to
     reorder others) in `openspec/changes/ORDER.md`.
   - If the update makes this change no longer depend on what `ORDER.md` says it depends on
     (or introduces a new dependency), fix that row too — `ORDER.md` must always match the
     latest `proposal.md`, never a stale snapshot from when the change was first proposed.
   - Revise only files that already exist (`existingOutputPaths`). Do NOT create artifacts that don't exist yet, and do NOT invent new files under a glob artifact - note them and point the user to `/opsx:continue` to create them.
   - If the change is already coherent, say so and make no edits.

5. **Confirm and apply, one artifact at a time**
   - Show each proposed revision and why. Write only after the user confirms.
   - If the user rejects a revision, do not write it - leave that artifact unchanged.
   - When a substantial rewrite is needed, get that artifact's rules and template first:
     ```bash
     openspec instructions <artifact-id> --change "<name>" --json
     ```

6. **Point to the next step (guidance only - NEVER act on it)**
   - Artifacts still missing -> suggest `/opsx:continue` to create them.
   - Change already implemented (tasks checked off / already applied) -> the code may no longer match the revised plan; suggest `/opsx:apply` to carry the delta into code.
   - Everything done and implemented -> suggest `/opsx:archive`.

**Output**

After each invocation, show:
- Which artifacts were revised (and which proposed revisions were rejected)
- Anything deferred to `/opsx:continue` (not-yet-created artifacts or files)
- Where the change stands and the recommended next command

**Guardrails**
- Planning artifacts only - NEVER edit implementation code. If the revised plan implies code changes, stop and point to `/opsx:apply`.
- Use the artifact ids and paths reported by `openspec status`; never branch on hardcoded artifact names.
- Edit only the concrete files in `existingOutputPaths`; never write to a glob `resolvedOutputPath`.
- Do not advance the build frontier: no new artifacts, no new files under glob artifacts - that is `/opsx:continue`'s job.
- Confirm every edit with the user before writing.
- If the request changes the change's *intent* rather than refining it, recommend starting fresh with `/opsx:new` (the "Update vs. Start Fresh" heuristic).
- A `tasks.md` revision must never leave a forward reference (task depending on a later task)
  nor break the test flow of the change type (TDD-first for feature; fix → proof → edge cases for bug).
- A scope expansion that creates a new overlap with another active change must be flagged and
  resolved (or explicitly recorded) before writing - never silently.
- If this change's row in `openspec/changes/ORDER.md` no longer matches the revised
  `proposal.md` (dependency added, removed, or changed), update that row in the same run.
- Test failures reported by `/opsx:test` MUST be registered here as new tasks before any further
  code work — never fix silently without updating the change.
