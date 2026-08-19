## Context

Quatro achados de causas independentes, agrupados porque nenhum sozinho justifica uma change e
todos são acabamento visível sem decisão arquitetural nova:

1. **Cabeçalho colado ao topo.** `produto/[id].tsx:191` usa `paddingTop: espaco.xs` (4dp, o
   menor token da escala) para o wrapper do `BotaoVoltar`. `correcao-bordas-do-sistema`
   (Ordem 3) corrige o inset do sistema; este achado é o respiro *depois* do inset — os dois
   são complementares, não o mesmo problema.
2. **Assimetria de peso visual no par consumir/repor.** `BotaoReporRapido` é círculo preenchido
   (`botao-repor-rapido.tsx:57-73`); `StepperConsumo` é só contorno fino
   (`stepper-consumo.tsx:74-91`). Mesma ação do KPI K4, dois pesos diferentes.
3. **"Outra quantidade" quebra com fonte ampliada.** Três `Botao` em `flex:1`
   (`produto/[id].tsx:221-239`) sem `numberOfLines`; o rótulo mais longo dos três estoura.
4. **Ajuste no Modo Compra só por toque longo.** `item-compra.tsx:51`. O projeto já resolveu
   exatamente este padrão em `produto/[id].tsx:219-238`, com o comentário "gesto invisível não
   pode ser o único acesso (FRONTEND §10)" — nunca replicado no Modo Compra.

## Goals / Non-Goals

**Goals:**

- Cabeçalho com respiro perceptível, além do inset.
- Par consumir/repor com o mesmo peso visual.
- Botão de rótulo longo sobrevive a fonte ampliada sem quebrar o grupo.
- Ajuste de quantidade/preço no Modo Compra alcançável sem gesto invisível.

**Non-Goals:**

- Redesenhar a paleta ou introduzir novo token de cor — os quatro itens usam tokens já
  existentes (`tema.action.azulejo`, escala `espaco`).
- Mudar o gesto de toque longo em si — ele continua funcionando, ganha um caminho visível ao
  lado, não é substituído.
- Resolver A-09/A-10/A-13 (posição de CTA fora de alcance) — é `correcao-acoes-fora-de-
  alcance`, escopo diferente (posição, não peso visual ou affordance de gesto).

## Decisions

### 1. Respiro do cabeçalho: token maior, não valor mágico

`paddingTop: espaco.xs` vira `espaco.md` (ou `espaco.lg`, a decidir por comparação visual
contra `FRONTEND-DESIGN`) no wrapper do `BotaoVoltar`, em todas as telas empilhadas que o
usam (mesma lista de telas do requisito "Botão de voltar desenhado no conteúdo"). Continua
sendo um token da escala, nunca um pixel fixo — consistente com a regra geral do projeto.

### 2. `StepperConsumo` ganha preenchimento, espelhando `BotaoReporRapido`

O círculo de 40px do "−" passa a ter `backgroundColor` num tom que sinalize "ação secundária,
mas presente" — não necessariamente o mesmo `action.azulejo` do "+" (que sinalizaria ação
primária), mas preenchido o bastante para não competir por invisibilidade com o contorno atual.
Critério de aceite: contraste mensurável equivalente ao mínimo já exigido para texto secundário
sobre fundo, não "parecido visualmente".

Alternativa descartada: só trocar a cor da borda para uma mais forte. Mantém a assimetria
estrutural (preenchido vs. contorno) que é a causa real do "some" — cor mais forte de contorno
ainda lê como elemento secundário/desabilitado.

### 3. "Outra quantidade": `numberOfLines={1}` não é suficiente sozinho — decidir com teste visual

`numberOfLines={1}` sem ajuste de fonte trunca com reticências, o que é aceitável mas pode
cortar informação relevante ("Outra quant..."). Alternativa: reduzir levemente o tamanho da
fonte só neste botão sob fonte ampliada (prop nativa de ajuste de tamanho do RN). A escolha
entre as duas fica para a tarefa de implementação, verificada visualmente nos dois temas com a
fonte do sistema no maior nível suportado.

### 4. Affordance de ajuste no Modo Compra: mesmo padrão de `produto/[id].tsx`

Um elemento visível e tocável (ícone ou texto curto, ex. "Ajustar") ao lado de cada linha do
Modo Compra, chamando a mesma função hoje só acessível por `onLongPress={onAjustar}`
(`item-compra.tsx:51`). Reaproveita a `SheetAjusteCompra` já existente — só ganha um segundo
gatilho.

Alternativa descartada: swipe para revelar a ação. Não existe gesto de deslizar em nenhum
componente do projeto hoje, e a direção "linha d'água" declara explicitamente "sem swipe" para
a ação principal — abrir precedente de swipe aqui, mesmo para ação secundária, introduziria um
padrão de gesto novo que o design system não tem em nenhum outro lugar.

## Risks / Trade-offs

- **[Mudar o padding do cabeçalho em ~9 telas ao mesmo tempo]** → Mesmo padrão já usado em
  `correcao-bordas-do-sistema` (mudança de token, não de estrutura); diff pequeno por tela.
  Screenshots dos dois temas, antes e depois, como evidência.

- **[Preencher o "−" pode se confundir visualmente com o "+" se a cor escolhida for próxima
  demais]** → Escolher explicitamente uma cor que sinalize "ação secundária presente", não
  clonar `action.azulejo`. Verificação nos dois temas.

- **[Adicionar um segundo gatilho de ajuste no Modo Compra pode competir com o gesto principal
  de marcar o item]** → O gatilho novo é um elemento à parte da área de toque principal da
  linha (mesmo raciocínio de `produto/[id].tsx`, onde os botões extras não competem com nenhum
  gesto do caminho crítico — o Modo Compra não faz parte do KPI K4).

## Migration Plan

Sem migração de dados nem de schema. Só `presentation/` e `app/produto/[id].tsx`.

## Open Questions

- Valor exato do token de respiro do cabeçalho (`espaco.md` vs `espaco.lg`) — decidir por
  comparação visual contra `FRONTEND-DESIGN-app-estoque-de-casa.md` na implementação.
- Cor de preenchimento do "−" — decidir na implementação, dentro dos tokens de
  `tokens.ts` (nenhum hex novo).
