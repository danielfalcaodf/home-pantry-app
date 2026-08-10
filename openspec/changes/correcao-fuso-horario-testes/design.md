## Context

O código de produção formata (`toLocaleDateString('pt-BR')`) e agrupa (`strftime('%Y-%m', ..., 'localtime')`) datas em hora local por decisão consciente — o repositório falso replica o mesmo comportamento com getters locais de `Date`. As fixtures de dois testes, porém, usam `Date.UTC(...)`, assumindo UTC. Em `TZ=America/Sao_Paulo` (UTC-3), meia-noite UTC cai no dia/mês anterior local, e os testes falham.

## Goals / Non-Goals

**Goals:**
- `npm test` verde e determinístico em qualquer máquina.
- Registrar em spec que o ambiente de teste tem fuso fixado.

**Non-Goals:**
- Mudar qualquer comportamento de produção de data/hora.
- Migrar o app para UTC (contraria o requisito "Agrupamento por fuso horário local" de `gasto-mensal`).

## Decisions

- **Fuso fixado: `America/Sao_Paulo`, não UTC.** UTC faria os testes atuais passarem sem tocar nas fixtures, mas esconderia exatamente a classe de bug que o QA pegou: o usuário-alvo do app está em UTC-3, e rodar a suíte no fuso dele exercita o desalinhamento UTC×local. As fixtures é que são corrigidas para expressar a intenção no fuso local.
- **Onde fixar: `globalSetup`/`process.env.TZ` na config do Jest** (os dois projetos, `domain` e `app`), antes de qualquer import — `TZ` precisa estar definido antes do primeiro uso de `Date` pelo V8/ICU.
- **Fixtures**: trocar `Date.UTC(2026, 7, 3)` por um construtor local equivalente (`new Date(2026, 7, 3).getTime()`) ou instante UTC deslocado que caia no dia certo local, mantendo o cenário de cada teste.

## Risks / Trade-offs

- [Fuso com horário de verão histórico] → `America/Sao_Paulo` não tem mais DST desde 2019; fixtures usam datas ≥ 2026, sem ambiguidade.
- [Outro teste passar a falhar com o TZ novo] → rodar a suíte completa na change; qualquer falha nova é a mesma classe de bug e é corrigida aqui.
