# F6 — KPI e acessibilidade em uso real

Última fase do plano. Mede no app rodando o que as fases anteriores só garantiram estruturalmente: os KPIs do PRD (K4 em especial) e a acessibilidade real das telas, nos dois temas. Executada em 2026-08-09 sobre o development build já instalado no emulador `emulator-5554` (mesmo artefato de toda a campanha F4/F5), via subagent `mobile-ux-tester` + Maestro/adb.

**Restrição vigente**: nenhuma alteração em código de produção. Falha vira achado (`qa/achados/`), nunca correção inline.

## Roteiros

### R1 — KPI K4: caminho crítico de dar baixa

- **K4 (PRD)**: dar baixa em ≤ 3 toques e ≤ 10s, sem confirmação, sem spinner.
- Medir: nº de toques do estado "app aberto na Despensa" até o consumo registrado; tempo de relógio da sequência via timestamps de screenshot/execução.
- Medir também o caminho pelo detalhe do produto (abrir item → "Usei") e o teclado de quantidade ("Outra quantidade" → digitar → confirmar).
- Verificar ausência de spinner/diálogo no caminho e o toast como única resposta.

### R2 — Acessibilidade das 4 tabs (Despensa, Lista, Resumo, Configurações), dois temas

- Todo elemento interativo com rótulo acessível completo (nunca só "+", "-", "menos").
- Alvos de toque ≥ 48×48dp (bounds reais da hierarquia, inclusive stepper e "+").
- Estado nunca só por cor: os três canais do medidor (altura + cor da régua + rótulo textual) presentes na árvore de acessibilidade.
- Contraste dos pares principais nos dois temas (Despensa escuro / Porcelana claro) por amostragem de screenshot.
- Vocabulário: nenhum termo de domínio ("dar baixa", "movimento", "reposição") em nenhuma das 4 tabs.

### R3 — Acessibilidade das telas secundárias, dois temas

- Telas: `produto/[id]` (detalhe), `produto/novo` (cadastro), `produto/[id]/historico`, `conferencia`, `diagnostico`, `historico` (compras), `historico/[id]` (detalhe da compra), `compra/[id]` (modo compra, se alcançável sem fechar compra nova).
- Mesmos critérios de R2 (rótulos, alvos, canais redundantes, vocabulário).
- Botão voltar (`BotaoVoltar`) presente e com alvo ≥ 48dp em todas.
- Estados vazios como convite (nunca aviso seco) onde visíveis.

## Execução e resultados

### R1 — KPI K4 (2026-08-09, subagent mobile-ux-tester)

| Caminho | Toques | Tempo | Diálogo/spinner | Veredito K4 |
|---|---|---|---|---|
| Lista (stepper "−" direto na Despensa) | **1** | < 250ms até a mudança visível | Nenhum | **Passa** |
| Detalhe (item → "Usei") | 2 na teoria | ~330ms do toque em "Usei" ao toast | Nenhum — mas o caminho exige um passo de recuperação | **Falha na prática** — [[ACHADO-056]] |
| Teclado de quantidade ("Outra quantidade") | 4 + digitação | poucos segundos | Nenhum | Referência (caminho longo deliberado, não é violação) |

- **[[ACHADO-056]]** (crítica, novo — primeiro crítico em aberto da campanha): autofoco do campo "O que é" no detalhe do produto sobe o teclado sobre "Usei"/"Repus" em ~300ms; toque na posição de "Usei" acerta o IME (chegou a abrir seletor de emoji); Voltar fecha a **tela**, não o teclado. Única saída: botão "✓" do próprio IME. Quebra "nenhum elemento de UI pode competir com esse gesto" do K4.
- Vocabulário consistente nos 3 caminhos (botão "Usei" → toast "Anotado: …" → histórico "Você anotou…").
- Caminho principal (lista) é exemplar: 1 toque, latência imperceptível.
- Observação não investigada (candidata a verificação na R3): "Feijão" mostrou "Sem uso registrado nos últimos 30 dias" logo após consumo de 3 pacotes via bottom sheet — possível atraso/lacuna do resumo de histórico do detalhe.
- Massa de dados **integralmente restaurada** ao final (todos os consumos de medição revertidos via "+", contadores globais idênticos ao início).
