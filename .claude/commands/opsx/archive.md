---
name: "OPSX: Archive"
description: Archive a completed change in the experimental workflow
allowed-tools: Bash(openspec:*)
category: Workflow
tags: [workflow, archive, experimental]
---

Archive a completed change in the experimental workflow.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name after `/opsx:archive` (e.g., `/opsx:archive add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context
   - `artifacts`: List of artifacts with their status (`done` or other)

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Prompt user for confirmation to continue
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Prompt user for confirmation to continue
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Enforce the test gate (hard block)**

   This command always operates on a **current, implemented** active change — never an archived
   one. A change can ONLY be archived if 100% of the `/opsx:test` flow passed (TDD, QA
   E2E/integration/regression for New Feature; bug scenario + edge cases + regression for
   Bug Fix).

   - If the test flow was not run in this conversation (or its result is not visible), run it
     now via the `openspec-test-change` skill — or ask the user for the `/opsx:test` verdict.
   - If any block failed or was skipped: **STOP. Do not archive.** Point to `/opsx:update` to
     register the pending adjustments, then back to `/opsx:apply` and `/opsx:test`.
   - Unlike the artifact/task warnings above (which the user may override), this gate is NOT
     overridable by confirmation.

5. **Assess delta spec sync state**

   Use `artifactPaths.specs.existingOutputPaths` from status JSON to check for delta specs. If none exist, proceed without sync prompt.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `openspec/specs/<capability>/spec.md`
   - Determine what changes would be applied (adds, modifications, removals, renames)
   - Show a combined summary before prompting

   **Prompt options:**
   - If changes needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke openspec-sync-specs for change '<name>'. Delta spec analysis: <include the analyzed delta spec summary>"). Proceed to archive regardless of choice.

6. **Perform the archive**

   Create an `archive` directory under `planningHome.changesDir` if it doesn't exist:
   ```bash
   mkdir -p "<planningHome.changesDir>/archive"
   ```

   Generate target name using current date: `YYYY-MM-DD-<change-name>`

   **Check if target already exists:**
   - If yes: Fail with error, suggest renaming existing archive or using different date
   - If no: Move `changeRoot` to the archive directory

   ```bash
   mv "<changeRoot>" "<planningHome.changesDir>/archive/YYYY-MM-DD-<name>"
   ```

7. **Remove the change from the order registry**

   First capture this change's `Ordem` number `<NN>` from `openspec/changes/ORDER.md` — it
   defines the PR branch name in the next step. Then, if `ORDER.md` has a row for this change,
   remove that row. Do not renumber or otherwise touch the remaining rows — their relative
   order is unaffected by one change leaving. If a remaining row's "Depende de" pointed at the
   change just archived, replace it with "— (`<change>` archived on YYYY-MM-DD)" so the
   dependency history isn't silently lost.

8. **Create the Pull Request (mandatory, immediately after a successful archive)**

   The PR must contain absolutely everything done in the change: implementation code, tests,
   the change's planning artifacts (now under `archive/`), spec syncs, and the `ORDER.md`
   update.

   - The branch name MUST respect the chronological ORDER of the changes:
     `change/<NN>-<change-name>` (NN = the `Ordem` captured in step 7, two digits).
   - Create the branch, commit all the work of the change, push, and open the PR with
     `gh pr create`, summarizing what the change did and the `/opsx:test` verdict (100% green).
   - If `git`/`gh` state prevents this (dirty tree with unrelated files, missing remote), stop
     and ask the user instead of guessing.

9. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location
   - Spec sync status (synced / sync skipped / no delta specs)
   - Test gate status (`/opsx:test` 100% green)
   - Whether it was removed from `openspec/changes/ORDER.md` (and whether any remaining row's
     dependency was updated)
   - PR created: branch `change/<NN>-<name>` and URL
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs
**Tests:** ✓ /opsx:test 100% green
**ORDER.md:** row removed (Ordem <NN>)
**PR:** change/<NN>-<name> → <PR URL>

All artifacts complete. All tasks complete.
```

**Output On Success (No Delta Specs)**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/
**Specs:** No delta specs

All artifacts complete. All tasks complete.
```

**Output On Success With Warnings**

```
## Archive Complete (with warnings)

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/
**Specs:** Sync skipped (user chose to skip)

**Warnings:**
- Archived with 2 incomplete artifacts
- Archived with 3 incomplete tasks
- Delta spec sync was skipped (user chose to skip)

Review the archive if this was not intentional.
```

**Output On Error (Archive Exists)**

```
## Archive Failed

**Change:** <change-name>
**Target:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/

Target archive directory already exists.

**Options:**
1. Rename the existing archive
2. Delete the existing archive if it's a duplicate
3. Wait until a different date to archive
```

**Guardrails**
- Always prompt for change selection if not provided
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings - just inform and confirm — EXCEPT the `/opsx:test` gate,
  which is a hard block: a change whose test flow is not 100% green can NEVER be archived
- Always remove the archived change's row from `openspec/changes/ORDER.md` if present - a
  stale row for a change that no longer exists is worse than no registry at all
- Always create the PR immediately after a successful archive, on branch
  `change/<NN>-<change-name>` — the branch name respects the chronological order registered
  in `ORDER.md`
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync is requested, use the Skill tool to invoke `openspec-sync-specs` (agent-driven)
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
