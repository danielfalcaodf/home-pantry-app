## 1. Correção do bug relatado (Keyboard Overlap no Detalhe do produto)

- [ ] 1.1 Criar `src/presentation/components/evita-teclado.tsx`: wrapper com `KeyboardAvoidingView` (behavior por plataforma) que compensa a abertura do teclado sobre o campo em foco.
- [ ] 1.2 Envolver o `ScrollView` de `FormularioProduto` (`src/presentation/components/formulario-produto.tsx`) com `EvitaTeclado`, reproduzindo exatamente o cenário do bug relatado: campo "Quanto quero ter em casa" em foco no Detalhe do produto (`app/produto/[id].tsx`), cobrindo "Onde guardo"/"Marca que prefiro"/botão "Salvar".
- [ ] 1.3 Escrever teste (RNTL) que abre o teclado com um campo de `FormularioProduto` em foco e afirma que o campo e o botão de ação continuam dentro da área visível — reproduzindo e provando a correção do cenário exato do bug.
- [ ] 1.4 Rodar o teste criado em 1.3 e confirmar que passa antes de seguir.

## 2. Propagar a correção de Keyboard Overlap para os demais 5 pontos (casos de borda do mesmo bug)

- [ ] 2.1 Envolver o conteúdo de `TecladoQuantidade` (`teclado-quantidade.tsx`) com `EvitaTeclado`.
- [ ] 2.2 Envolver o conteúdo de `SheetAvulso` (`sheet-avulso.tsx`) com `EvitaTeclado`.
- [ ] 2.3 Envolver o conteúdo de `SheetAjusteEstoque` (`sheet-ajuste-estoque.tsx`) com `EvitaTeclado`.
- [ ] 2.4 Envolver o conteúdo de `SheetAjusteCompra` (`sheet-ajuste-compra.tsx`) com `EvitaTeclado`.
- [ ] 2.5 Escrever teste por sheet (4 testes) confirmando que o campo em foco e o botão de ação permanecem visíveis com o teclado aberto, igual ao teste base da task 1.3.
- [ ] 2.6 Escrever teste confirmando o mesmo comportamento com `reduceMotion` do sistema ligado e nos dois temas (Despensa/Porcelana) — a mudança de `KeyboardAvoidingView` não deve interferir na choreography de movimento já existente no gesto de dar baixa.

## 3. Error Prevention — eliminar correção silenciosa (extensão do padrão de `SheetAjusteEstoque`)

- [ ] 3.1 Em `SheetAvulso`, trocar a substituição silenciosa de quantidade inválida (`quantidadeNumerica > 0 ? quantidadeNumerica : QUANTIDADE_PADRAO`) por rejeição com `erro` em texto e `return` sem chamar `onSalvar`, seguindo o padrão de `salvar()` em `sheet-ajuste-estoque.tsx`.
- [ ] 3.2 Em `SheetAvulso`, aplicar a mesma correção ao preço inválido (hoje vira `null` em silêncio).
- [ ] 3.3 Em `SheetAjusteCompra`, aplicar a mesma correção à quantidade inválida (hoje volta para `quantidadeInicial` em silêncio) e ao preço inválido (hoje vira `null` em silêncio).
- [ ] 3.4 Escrever teste do cenário do bug para cada um dos 4 casos (2.1–2.4 acima, quantidade e preço em `SheetAvulso` e `SheetAjusteCompra`): digitar entrada não numérica, tocar salvar, e afirmar que `onSalvar`/`onFechar` não foi chamado com um valor diferente do digitado, e que o erro em texto aparece.
- [ ] 3.5 Definir e adicionar teto de sanidade de UI (constante em `presentation/`, não em `domain/`) para quantidade necessária, quantidade atual e valor unitário em `FormularioProduto`; validar em `salvar()` de `app/produto/[id].tsx` e `app/produto/novo.tsx` com mensagem de erro em texto.
- [ ] 3.6 Escrever teste reproduzindo o cenário exato relatado (digitar "26666" em "Quanto quero ter em casa") e confirmar que agora é rejeitado com erro em texto em vez de salvo sem confirmação.

## 4. Máscaras, placeholders e feedback no `CampoTexto`

- [ ] 4.1 Adicionar prop `tipo?: 'quantidade' | 'dinheiro'` a `CampoTexto` (`campo-texto.tsx`), aplicando formatação em tempo real reaproveitando `formatarNumero`/`domain/shared/quantidade.ts` (quantidade) e `formatarBRL`/`deTextoDigitado`/`domain/shared/dinheiro.ts` (dinheiro) — sem duplicar parsing/conversão fora do domínio.
- [ ] 4.2 Adicionar placeholder padrão por `tipo` ("0,000" para quantidade, "0,00" para dinheiro), sobrescrevível pela prop `placeholder` já existente.
- [ ] 4.3 Aplicar `tipo="quantidade"` aos campos de quantidade em `FormularioProduto`, `TecladoQuantidade`, `SheetAvulso`, `SheetAjusteEstoque`, `SheetAjusteCompra`.
- [ ] 4.4 Aplicar `tipo="dinheiro"` aos campos de valor/preço em `FormularioProduto`, `SheetAvulso`, `SheetAjusteCompra`.
- [ ] 4.5 Escrever teste de `CampoTexto` cobrindo: máscara de quantidade formata ao digitar, máscara de dinheiro formata ao digitar, placeholder padrão aparece quando nenhum é passado, placeholder customizado sobrescreve o padrão.
- [ ] 4.6 Escrever teste confirmando que campos sem `tipo` (nome, categoria, marca, observação) continuam com o comportamento atual, sem máscara — não regredir os campos de texto livre.

## 5. Affordance

- [ ] 5.1 Adicionar ícone de chevron ao controle "Mais opções"/"Menos opções" em `FormularioProduto`, girando conforme o estado expandido/colapsado.
- [ ] 5.2 Adicionar controle de fechar visível (ícone `IconeSvg` reaproveitado de `index.tsx`) ao cabeçalho de `TecladoQuantidade`, `SheetAvulso`, `SheetAjusteEstoque` e `SheetAjusteCompra`, chamando a função `fechar()` já existente em cada um.
- [ ] 5.3 Alterar o filtro de sugestões de categoria em `FormularioProduto` para exibir todas as categorias existentes ao focar o campo (antes de digitar), e continuar filtrando por prefixo assim que houver texto.
- [ ] 5.4 Escrever teste confirmando: chevron muda de estado ao expandir/colapsar "Mais opções"; controle de fechar visível em cada um dos 4 sheets aciona `onFechar`; sugestões de categoria aparecem ao focar sem texto digitado.

## 6. QA em dispositivo/emulador (mobile-ux-tester + Maestro)

- [ ] 6.1 Rodar o fluxo de Detalhe do produto no emulador com o teclado aberto no campo "Quanto quero ter em casa", confirmando visualmente que campo e botão "Salvar" não ficam cobertos (reprodução do print original).
- [ ] 6.2 Rodar os 4 sheets (Outra quantidade, Adicionar item avulso, Corrigir quantidade atual, Ajuste no modo compra) no emulador com teclado aberto, confirmando visualmente ausência de sobreposição e presença do controle de fechar.
- [ ] 6.3 Comparar screenshots dos dois temas (Despensa/Porcelana) para os pontos acima, confirmando que a mudança de `KeyboardAvoidingView` e os novos ícones não quebram contraste ou layout em nenhum tema.

## 7. Regressão

- [ ] 7.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) e `npm test` completos, confirmando que nada além do escopo desta change foi afetado.
- [ ] 7.2 Rodar a suíte de testes já existente de `formulario-produto`, `sheet-avulso`, `sheet-ajuste-estoque`, `sheet-ajuste-compra` e `teclado-quantidade` (arquivos `*.test.tsx` já existentes) confirmando que todos continuam verdes com as mudanças desta change.
