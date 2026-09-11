---
name: clean-architecture
description: Decision rules from Robert C. Martin's Clean Architecture for keeping business rules independent of frameworks, databases, and delivery mechanisms — dependency direction, ports/adapters, use-case boundaries, testability of core policy. Use this whenever adding a new use case, wiring a repository/adapter, deciding where a piece of logic belongs (domain vs application vs infrastructure vs presentation), or reviewing whether a dependency arrow points the wrong way — even if the user just says "onde isso deveria morar" or "isso está vazando pra fora do domínio". See reference.md for the full book-derived reference when doing a deep architectural audit.
license: MIT (rules distilled from https://github.com/ciembor/agent-rules-books, mini version)
---

# OBEY Clean Architecture by Robert C. Martin

## When to use

Use when adding, changing, reviewing, or refactoring code whose business rules should survive changes in frameworks, databases, delivery mechanisms, services, devices, vendors, deployment shape, or schedule pressure.

## Primary bias to correct

Do not let details become the architecture. Business policy stays independent, dependencies point inward, and volatile mechanisms remain replaceable.

## Decision rules

- Preserve independent business rules, inward dependencies, testability, and replaceable details even when the immediate feature would be shorter without them.
- Source dependencies must point inward toward higher-level policy. Domain and use cases must not import frameworks, databases, web handlers, queues, external service clients, UI types, or other details.
- Put enterprise rules and invariants in entities or equivalent domain objects; put application-specific orchestration in focused use cases.
- Pass plain request and response models across use-case boundaries. Do not pass web requests, framework contexts, ORM rows, database-bound structures, or framework response objects into or out of core policy.
- Treat frameworks, databases, web delivery, messaging, filesystems, clocks, service clients, networks, devices, and vendors as outer-layer details behind ports, gateways, presenters, mappers, or adapters.
- Inner layers own the interfaces they need; outer layers implement them. Object construction and concrete wiring belong in the composition root or other outer-layer main component.
- Keep adapters humble. Controllers, endpoints, presenters, gateway adapters, service listeners, and hardware adapters translate external formats to use-case calls and back; they do not own business decisions.
- Organize by use case, feature, or business capability before generic technical buckets. The structure should reveal domain intent and application actions.
- Choose boundaries by volatility, policy importance, substitution value, testability, and cost. Use the lightest enforceable boundary, including partial boundaries, when full deployment or runtime separation is too expensive.
- Do not merge unrelated use cases or eliminate duplication when sharing would couple actors, change reasons, team ownership, deployment needs, or release pressure.
- Use structured code, dependency inversion, role-sized interfaces, substitutable implementations, controlled mutation, acyclic components, and stability-directed dependencies to protect policy from volatile details.
- Enforce boundaries with package structure, dependency rules, build constraints, tests, visibility, or narrow APIs. A diagram, service split, package name, or shared `common` folder is not enough.
- Test entities, use cases, and boundary contracts first, without the real framework, database, network, external service, or target hardware. Test adapters separately at the seams.
- Preserve behavior while improving dependency direction. Prefer incremental boundary extraction over rewrites, and call out architectural debt when it cannot be fixed safely now.

## Trigger rules

- When urgent delivery would skip architecture, state the future change, test, replacement, or operational cost before accepting the shortcut.
- When framework annotations, request/response objects, serializers, ORM rows, schemas, vendor SDKs, config, environment reads, device registers, or transport formats enter core policy, move translation outward.
- When controllers, jobs, handlers, views, presenters, gateways, repositories, SQL, service listeners, scripts, or hardware adapters contain business branching or validation, move the rule inward.
- When a use case instantiates infrastructure, calls a volatile dependency directly, or depends on a concrete implementation, introduce a policy-owned port and wire the concrete detail at the edge.
- When a `*Service`, utility folder, shared module, base package, or generic `core` package becomes an escape hatch, split by use case, role, or ownership and restore dependency direction.
- When an adapter bypasses a use case, a presenter reads persistence directly, or infrastructure is both imported by and importing inward code, restore the intended boundary.
- When service boundaries, process boundaries, remote calls, deployment boundaries, or embedded hardware appear, still verify source dependencies, data ownership, I/O cost, and policy independence.
- When tests need the framework, database, network, service, or hardware to verify business rules, move tests to use cases/entities with fakes or add a stable boundary contract.
- When a compromise is unavoidable, keep it at the outermost layer possible, document the violation, avoid normalizing it, and preserve a path to separation.

## Final checklist

- Business rules independent from frameworks, databases, UI, services, devices, and vendors?
- Dependencies point inward, with ports owned by inner policy and concrete details outside?
- Entities guard invariants and focused use cases orchestrate one application action?
- Boundaries explicit and enforced in code, tests, packages, or build rules?
- Controllers, presenters, gateways, service listeners, and adapters humble?
- Structure reveals use cases and business capabilities instead of generic technical buckets?
- Core tests run fast without real delivery, persistence, network, external service, or hardware?
- Details remain replaceable without rewriting business rules?

## This project (Repor)

`CLAUDE.md` já implementa a regra de dependência desta skill como Layered feature-based com Ports & Adapters: `presentation/ → application/ → domain/`, `domain/` zero import de React/Expo/Drizzle/SQLite, `infrastructure/` é a única camada que conhece SQLite, e `application/` depende sempre da interface em `ports/`, nunca de `SQLiteProdutoRepository` diretamente. `npm run verificar:fronteiras` já é o teste de conformidade automático. Use esta skill para a lente de decisão mais fina — por exemplo, ao decidir se uma regra nova de conversão de embalagem pertence a `domain/produto/` ou vazou para o caso de uso — não para reintroduzir a regra de camadas que já está fixada.
