---
description: F6 — KPI e acessibilidade em uso real para as telas de uma PR *(requer F4)*
argument-hint: [número da PR, 1-13 — se vazio, usa a próxima pendente]
---

Execute uma rodada da fase **F6** do plano de testes (`qa/PLANO-DE-TESTES.md`) para **uma PR**, sem alterar código de produção.

**Pré-requisito**: mesmo da F5 — emulador com development build funcional.

**PR alvo**: $ARGUMENTS (se vazio, use a próxima PR sem seção `## F6` em `qa/por-pr/PR-NN.md`)

Passos:

1. Releia `qa/por-pr/PR-<NN>.md` para saber quais telas essa PR introduziu ou alterou.
2. Invoque o subagent `mobile-ux-tester` via `/qa:ux <tela|fluxo>` — regra dele: nunca reportar defeito sem ter executado a interação de verdade no emulador.
3. Rode o que for aplicável a esta PR especificamente, sem repetir o que outra PR já cobriu:
   - Se a PR for a **6** (`dar-baixa-caminho-critico`): cronometrar KPI K4 separando abertura fria e gesto de registrar consumo (≤10s, ≤3 toques) — únicos números que vão para o repositório nesta fase.
   - Para qualquer PR com tela nova: escala de fonte do sistema a 200% nessa tela específica.
   - Reduzir movimento (reduceMotion) ligado: nível muda em fade curto, háptico permanece — só relevante em telas com a animação "linha d'água".
   - Auditar a tela nos dois temas (Despensa escuro / Porcelana claro) separadamente.
4. Anexe seção `## F6 — KPI e acessibilidade` a `qa/por-pr/PR-<NN>.md` com os números/observações reais.
5. Ressalva sempre presente: retorno tátil (`expo-haptics`) não é avaliável em emulador — registrar isso e não fingir que foi medido.
6. Defeitos encontrados viram achado em `qa/achados/`.
7. `git add qa/**` e commit.

Ao final, informe a próxima PR pendente de F6 e, se todas as PRs com tela já passaram, informe que resta só o ciclo real exportar → desinstalar → reinstalar → restaurar (exige aparelho físico ou é aceito em emulador — confirmar antes) e a task 9.2 (retorno tátil) permanentemente fora do escopo do emulador.
