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

### R2 — Acessibilidade das 4 tabs, dois temas (2026-08-09, subagent mobile-ux-tester)

Dispositivo: `emulator-5554`, densidade 420dpi → limiar de alvo de toque de 48dp = 126px. Hierarquia real via `mcp__maestro__inspect_screen`; evidência visual em `qa/por-pr/evidencias/f6-r2/` (8 screenshots por tab×tema + 1 de restauração do tema). Nenhum dado de domínio alterado; tema restaurado para Escuro (Despensa) ao final, confirmado por screenshot.

| Critério | Despensa | Lista | Resumo | Configurações | Veredito |
|---|---|---|---|---|---|
| 1. Rótulos acessíveis completos | Passa | Passa | Passa | Passa | **Passa nas 4 tabs, 2 temas** — nenhum elemento com rótulo vazio/genérico/só-ícone; steppers carregam produto+quantidade+ação no `a11y` |
| 2. Alvo de toque ≥48×48dp | Passa (stepper e header no limite exato, 126px) | **Falha** — [[ACHADO-057]] | **Falha** — [[ACHADO-058]] | **Falha** — [[ACHADO-059]] | **Falha em 3 tabs de 4**, replicada nos dois temas |
| 3. Estado nunca só por cor (Despensa) | Passa — `a11y` inclui sempre `Cheio`/`Falta N`/`Acabou` junto da leitura numérica | n/a | n/a | n/a | **Passa** |
| 4. Contraste por amostragem | Sem par limítrofe nos 2 temas | idem | idem | idem | **Passa** por inspeção visual |
| 5. Vocabulário | **Falha (a11y falado)** — [[ACHADO-061]] | Passa | Passa | **Falha (texto visível)** — [[ACHADO-060]] | **Falha em 2 pontos** (1 visível, 1 só-leitor-de-tela) |
| 6. Estados vazios | n/a (40 itens) | n/a (33 itens) | n/a | n/a | Não aplicável — massa de dados atual não expõe estado vazio em nenhuma tab |

Achados abertos nesta rodada:
- **[[ACHADO-057]]** (média): "Compartilhar lista" e "Agrupar por categoria" no cabeçalho da tab Lista com 58px (22dp) de altura de toque — menos da metade do mínimo.
- **[[ACHADO-058]]** (média): "Configurações" no cabeçalho da tab Resumo, mesmo padrão (58px/22dp).
- **[[ACHADO-059]]** (média): três botões de seleção de tema em Configurações com 105px (40dp) de altura.
- **[[ACHADO-060]]** (baixa): texto visível "Conferência de estoque" em Configurações reintroduz o termo de sistema "estoque" onde o resto do app usa "Despensa".
- **[[ACHADO-061]]** (baixa): `accessibilityLabel` do stepper de decremento na Despensa fala "Registrar consumo de X" em vez do verbo documentado "Usei X" — diverge só para quem usa leitor de tela.

Nota de ambiente: um overlay de acessibilidade do próprio sistema/emulador (`a11y="Tools"`, ícone de engrenagem flutuante, bounds fixos `[42,1589][179,1726]`) aparece sobre a lista em várias telas — não é elemento do app Repor, não reportado como achado.
