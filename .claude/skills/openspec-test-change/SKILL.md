---
name: openspec-test-change
description: Execute the full automated test flow (TDD + QA) of a current, implemented OpenSpec change — the mandatory gate before archiving. Use when the user wants to validate that an implemented change delivered what was asked, before /opsx:archive.
allowed-tools: Bash(openspec:*), Bash(npm:*), Bash(npx:*), Bash(maestro:*)
license: MIT
compatibility: Requires openspec CLI, npm scripts of this repo, and Maestro for E2E.
metadata:
  author: home-pantry-app
  version: "1.0"
---

Execute the full automated test flow of an OpenSpec change. This is the mandatory quality gate
of this project: **a change can only be archived when 100% of this flow passes** (TDD, QA and
bug-context tests, according to the change type).

**Scope**: this skill always refers to the **current active changes** of this repository —
changes already **implemented** (tasks of `/opsx:apply` done or nearly done), never archived
ones. It validates that what the change asked for was actually delivered.

**Input**: Optionally a change name. If omitted, infer from conversation context; if ambiguous,
run `openspec list --json` and use **AskUserQuestion** (prefer changes with all/most tasks
checked — this gate runs after implementation).

**Steps**

1. **Select the change and read its plan**

   Run `openspec status --change "<name>" --json` and read the change's artifacts
   (`proposal.md`, `design.md`, `tasks.md`, delta specs). Identify:
   - The change type declared in `proposal.md` (`**Type:** New Feature` or `**Type:** Bug Fix`)
   - Which test tasks the change committed to in `tasks.md`
   - If tasks are still unchecked, warn: this gate validates an implemented change — incomplete
     implementation means the result will be reported as NOT ready.

2. **Build the test matrix for the change type**

   - **New Feature (TDD + QA)**:
     a. **TDD/unit**: run the unit suites touching the change (`npm run test:domain` always;
        `npm test` for the full Jest projects). The tests written BEFORE the implementation must
        now pass against the real code — that is the proof the change delivered what was asked.
     b. **Integration**: run the `infrastructure/`/`application/` Jest tests covering the
        communication of the feature with the rest of the system (repositories, transactions,
        migrations with in-memory SQLite; hooks with fake repository).
     c. **E2E (Maestro)**: run the `.maestro/` flow(s) that validate the complete journey of the
        feature on the emulator (via Maestro MCP or `maestro test`). If the change committed to
        an E2E flow that doesn't exist yet, create it first (see the `qa:e2e-pr` / `qa:test`
        skills) — a New Feature without its E2E journey covered does not pass this gate.
     d. **Regression**: run the FULL suite (`npm test`) plus `npm run verificar` (boundaries +
        lint + typecheck) to assure the change broke no existing behavior.

   - **Bug Fix**:
     a. Run the automated test for the **specific bug scenario** reported in the change — it
        must pass, proving the bug is resolved.
     b. Verify that the **mandatory edge-case tests** for the same context of the original bug
        exist and pass (other scenarios, boundary values, concurrent/adjacent paths). If they
        don't exist, create and implement them now — the gate does not pass without them.
     c. **Regression**: full suite (`npm test`) + `npm run verificar`.

3. **Execute and record results**

   Use the **TodoWrite tool** to track each block of the matrix. Run every block even if an
   earlier one fails (collect the full picture), except when a failure makes later blocks
   meaningless (e.g., typecheck broken).

4. **If ANY test fails — mandatory feedback loop**

   You MUST invoke `/opsx:update` (skill `openspec-update-change`) on this change to register
   which additional code adjustments are needed before proceeding: new unchecked tasks in
   `tasks.md`, plus any design/proposal consequence. Then stop and report. Never fix code
   silently without updating the change, and never declare the change ready.

5. **Report the verdict**

   - **100% pass** → the change is ready: "Test flow 100% green. The change can be archived
     with `/opsx:archive` (which will create the PR on branch `change/<NN>-<name>`)."
   - **Any failure** → the change is NOT ready: list the failures, confirm the `/opsx:update`
     registration, and state that `/opsx:archive` is blocked until this flow passes 100%.

**Output**

```
## Test flow — <change-name> (<Type>)

| Block | Result |
|---|---|
| TDD/unit (test:domain, test) | ✓ / ✗ detail |
| Integration (infrastructure/application) | ✓ / ✗ detail |
| E2E Maestro (complete journey) | ✓ / ✗ detail |
| Regression (full suite + verificar) | ✓ / ✗ detail |

Verdict: READY for /opsx:archive | NOT READY — adjustments registered via /opsx:update
```

(For Bug Fix, the blocks are: bug scenario / edge cases of the context / regression.)

**Guardrails**
- Always operate on a current active change, already implemented — never an archived one
- Never mark the change ready with any failing or skipped block; 100% means 100%
- Test failures ALWAYS go through `/opsx:update` before any further code work
- Never weaken, delete, or skip a test to make the gate pass — that requires an explicit user
  decision recorded via `/opsx:update`
- Respect the repo test conventions: domain = pure Jest without emulator; infrastructure =
  in-memory SQLite; application = RNTL with fake repository; E2E = Maestro on the dev build
- `npm run verificar` green is part of the gate — an architecture-boundary violation fails it
