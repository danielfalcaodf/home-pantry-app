---
name: clean-code
description: Decision rules from Robert C. Martin's Clean Code for writing or reviewing readable, maintainable code — naming, function size, side effects, comments, tests as production code. Use this whenever writing new implementation code, reviewing a diff for readability, or the user asks to "clean up", "simplify naming", "make this more readable", or complains that a function/file is hard to follow, even if they don't mention the book by name. See reference.md for the full book-derived reference when doing a deep readability audit.
license: MIT (rules distilled from https://github.com/ciembor/agent-rules-books, mini version)
---

# OBEY Clean Code by Robert C. Martin

## When to use

Use when readability, local reasoning, and maintainable code shape are the main concerns, especially during everyday implementation and review.

## Primary bias to correct

Working code is not automatically clean code.

## Decision rules

- Treat cleanliness as part of delivery. Preserve behavior, leave touched code cleaner within scope, and do not add mess because the schedule is tight or a rewrite is promised.
- Write for local reasoning. A reader should understand the path without reconstructing hidden state, wide jumps, or naming trivia.
- Use precise names and one term per concept. Rename code when vocabulary hides intent, overloads meaning, or forces comments to compensate.
- Keep functions small, focused, and at one level of abstraction. Tell the story top-down so intent appears before detail.
- Keep parameters few and meaningful. Avoid boolean flags, output parameters, and grab-bag argument lists; model the concept instead.
- Separate commands from queries and eliminate hidden side effects. A function that answers should not also mutate behind the reader's back.
- Keep the happy path readable. Isolate error handling, invalid-state handling, and cleanup; prefer explicit optionality or typed results over null-like sentinel flow when the language supports it.
- Expose behavior rather than raw representation. Avoid train-wreck access, utility dumping grounds, and classes or modules with mixed responsibilities.
- Keep construction, framework, persistence, transaction, security, and vendor details outside business behavior.
- Make public APIs small, explicit, and hard to misuse. Encode boundary logic, required order, and likely changes where readers can see them.
- Use comments only for rationale, constraints, warnings, or external contracts. Do not narrate code instead of improving it.
- Treat tests as production code: readable, deterministic, aligned with the behavior or contract they protect, and backed by proportionate validation before calling the change done.
- Let design emerge through tests, duplication removal, expressiveness, and minimal structure; do not add needless abstractions or infrastructure.
- When touching code, remove the smell that most increases change cost, but do not silently broaden the task beyond the smallest cleanup that makes the requested change safe.

## Trigger rules

- When a function mixes setup, validation, computation, and side effects, split the phases.
- When a comment explains control flow, simplify names or structure before keeping the comment.
- When a function both mutates and answers, or hides a mode switch behind a flag, separate the responsibilities.
- When duplication, repeated switches, or primitive clusters appear, name the concept with an argument object, polymorphism, special case, or other small abstraction.
- When a boundary leaks framework, vendor, or persistence quirks inward, add or strengthen a local adapter.
- When async or concurrency enters, isolate threading policy, minimize shared mutable state, define shutdown, and test timing-sensitive behavior.
- When fixing a bug or changing behavior, add or update the test that protects the intended contract.
- When cleanup starts spreading into unrelated areas, cut back to the smallest refactor that keeps the requested change safe and readable.

## Final checklist

- Can a reader follow the change locally?
- Are names and APIs carrying the meaning without narration?
- Is mutation explicit and the happy path still clear?
- Did framework, persistence, vendor, and construction details stay behind boundaries?
- Did I remove at least one smell from the touched area?
- Do tests protect the changed behavior or contract?
- Did I actually run the relevant tests or checks for this change?

## This project (Repor)

`CLAUDE.md` já fixa boa parte disso como regra do repositório: nomes em português do domínio (`quantidadeAComprar`, não `calc()`), funções pequenas com um nível de abstração, sem comentário explicando o quê. Use esta skill para a lente de decisão mais fina (quando separar leitura de escrita, quando um parâmetro booleano virou modelagem ruim, quando um smell específico justifica ou não ampliar o escopo do diff) — não repita o que o `CLAUDE.md` já resolve.
