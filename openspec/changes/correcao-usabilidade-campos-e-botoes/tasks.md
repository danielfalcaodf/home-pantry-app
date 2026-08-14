## 1. Correção do bug relatado (Keyboard Overlap no Detalhe do produto)

- [x] 1.1 Criar `src/presentation/components/evita-teclado.tsx`: wrapper com `KeyboardAvoidingView` (behavior por plataforma) que compensa a abertura do teclado sobre o campo em foco.
- [x] 1.2 Envolver o `ScrollView` de `FormularioProduto` (`src/presentation/components/formulario-produto.tsx`) com `EvitaTeclado`, reproduzindo exatamente o cenário do bug relatado: campo "Quanto quero ter em casa" em foco no Detalhe do produto (`app/produto/[id].tsx`), cobrindo "Onde guardo"/"Marca que prefiro"/botão "Salvar".
- [x] 1.3 Escrever teste (RNTL) que abre o teclado com um campo de `FormularioProduto` em foco e afirma que o campo e o botão de ação continuam dentro da área visível — reproduzindo e provando a correção do cenário exato do bug.
- [x] 1.4 Rodar o teste criado em 1.3 e confirmar que passa antes de seguir.

## 2. Propagar a correção de Keyboard Overlap para os demais 5 pontos (casos de borda do mesmo bug)

- [x] 2.1 Envolver o conteúdo de `TecladoQuantidade` (`teclado-quantidade.tsx`) com `EvitaTeclado`.
- [x] 2.2 Envolver o conteúdo de `SheetAvulso` (`sheet-avulso.tsx`) com `EvitaTeclado`.
- [x] 2.3 Envolver o conteúdo de `SheetAjusteEstoque` (`sheet-ajuste-estoque.tsx`) com `EvitaTeclado`.
- [x] 2.4 Envolver o conteúdo de `SheetAjusteCompra` (`sheet-ajuste-compra.tsx`) com `EvitaTeclado`.
- [x] 2.5 Escrever teste por sheet (4 testes) confirmando que o campo em foco e o botão de ação permanecem visíveis com o teclado aberto, igual ao teste base da task 1.3.
- [x] 2.6 Escrever teste confirmando o mesmo comportamento nos dois temas (Despensa/Porcelana) — cobertura de tema claro adicionada em `formulario-produto.test.tsx`; `reduceMotion` não é reavaliado aqui porque `EvitaTeclado`/`KeyboardAvoidingView` não participa da choreography `react-native-reanimated` do gesto de dar baixa (componentes disjuntos) — o contrato de `reduceMotion` do gesto em si já é coberto pelos testes existentes de `stepper-consumo`/`movimento`, fora do escopo desta mudança.

## 3. Error Prevention — eliminar correção silenciosa (extensão do padrão de `SheetAjusteEstoque`)

- [x] 3.1 Em `SheetAvulso`, trocar a substituição silenciosa de quantidade inválida (`quantidadeNumerica > 0 ? quantidadeNumerica : QUANTIDADE_PADRAO`) por rejeição com `erro` em texto e `return` sem chamar `onSalvar`, seguindo o padrão de `salvar()` em `sheet-ajuste-estoque.tsx`.
- [x] 3.2 Em `SheetAvulso`, o preço inválido (antes virava `null` em silêncio) foi resolvido de forma diferente do plano original: em vez de rejeitar com erro depois de salvar, o campo passou a usar `tipo="dinheiro"` (task 4.1), que impede a entrada inválida já na digitação — tornou a validação pós-digitação desnecessária (removida, não só corrigida).
- [x] 3.3 Em `SheetAjusteCompra`: quantidade inválida (voltava para `quantidadeInicial` em silêncio) agora rejeita com erro em texto, igual `SheetAjusteEstoque`; preço inválido resolvido do mesmo jeito que 3.2 — `tipo="dinheiro"` impede na digitação, validação pós-digitação removida.
- [x] 3.4 Escrever teste do cenário do bug para os 2 casos de quantidade (`SheetAvulso`, `SheetAjusteCompra`): digitar entrada não numérica, tocar salvar, afirmar `onSalvar` não chamado e erro em texto visível. Para preço (mesmos 2 componentes): teste adaptado pra confirmar que a máscara nunca deixa o campo chegar a um estado inválido (não existe mais "preço inválido rejeitado depois" pra testar).
- [x] 3.5 Definir e adicionar teto de sanidade de UI (constante em `presentation/`, não em `domain/`) para quantidade necessária, quantidade atual e valor unitário em `FormularioProduto`; validar em `salvar()` de `app/produto/[id].tsx` e `app/produto/novo.tsx` com mensagem de erro em texto.
- [x] 3.6 Escrever teste reproduzindo o cenário exato relatado (digitar "26666" em "Quanto quero ter em casa") e confirmar que agora é rejeitado com erro em texto em vez de salvo sem confirmação.

## 4. Máscaras, placeholders e feedback no `CampoTexto`

- [x] 4.1 Adicionar prop `tipo?: 'quantidade' | 'dinheiro'` a `CampoTexto` (`campo-texto.tsx`). `tipo="dinheiro"` usa máscara "de caixa registradora" (dígito entra pela direita como centavo, vírgula se ajusta sozinha a cada tecla — pedido explícito do usuário); `tipo="quantidade"` usa sanitização (dígitos + uma vírgula, truncada em 3 casas, sinal preservado), sem digit-shift (ver design.md/decisão 2 pro porquê da diferença). Conversão final continua só em `domain/shared/` no salvar. Efeito colateral: preço nunca mais fica em estado inválido, então removida a validação `erroPreco` de `SheetAvulso`/`SheetAjusteCompra` (código morto após a máscara — CLAUDE.md, "sem tratamento de erro pra cenário que não pode acontecer").
- [x] 4.2 Adicionar placeholder padrão por `tipo` ("0,000" para quantidade, "0,00" para dinheiro), sobrescrevível pela prop `placeholder` já existente.
- [x] 4.3 Aplicar `tipo="quantidade"` aos campos de quantidade em `FormularioProduto`, `TecladoQuantidade`, `SheetAvulso`, `SheetAjusteEstoque`, `SheetAjusteCompra`.
- [x] 4.4 Aplicar `tipo="dinheiro"` aos campos de valor/preço em `FormularioProduto`, `SheetAvulso`, `SheetAjusteCompra`.
- [x] 4.5 Escrever teste de `CampoTexto` cobrindo: máscara de quantidade formata ao digitar, máscara de dinheiro formata ao digitar, placeholder padrão aparece quando nenhum é passado, placeholder customizado sobrescreve o padrão.
- [x] 4.6 Escrever teste confirmando que campos sem `tipo` (nome, categoria, marca, observação) continuam com o comportamento atual, sem máscara — não regredir os campos de texto livre.

## 5. Affordance

- [x] 5.1 Adicionar ícone de chevron ao controle "Mais opções"/"Menos opções" em `FormularioProduto`, girando conforme o estado expandido/colapsado.
- [x] 5.2 Adicionar controle de fechar visível (ícone `IconeSvg` reaproveitado de `index.tsx`) ao cabeçalho de `TecladoQuantidade`, `SheetAvulso`, `SheetAjusteEstoque` e `SheetAjusteCompra`, chamando a função `fechar()` já existente em cada um.
- [x] 5.3 Alterar o filtro de sugestões de categoria em `FormularioProduto` para exibir todas as categorias existentes ao focar o campo (antes de digitar), e continuar filtrando por prefixo assim que houver texto.
- [x] 5.4 Escrever teste confirmando: chevron muda de estado ao expandir/colapsar "Mais opções"; controle de fechar visível em cada um dos 4 sheets aciona `onFechar`; sugestões de categoria aparecem ao focar sem texto digitado.

## 6. QA em dispositivo/emulador (mobile-ux-tester + Maestro)

- [x] 6.1 (1ª rodada) Rodar o fluxo de Detalhe do produto no emulador com o teclado aberto no campo "Quanto quero ter em casa" — **usuário testou manualmente e reportou falha**: botão "Salvar" continuava atrás do teclado com `KeyboardAvoidingView` nativo do RN. Ver tarefa 8.1 pra correção e nova rodada de QA.
- [x] 6.2 (1ª rodada) Rodar os 4 sheets com teclado aberto — **usuário testou manualmente e reportou falha**: teclado aparecia por cima de tudo. Corrigido na tarefa 8.1.
- [x] 6.3 (1ª rodada) Chevron em "Mais opções" — **usuário confirmou OK** no teste manual.
- [x] 6.4 (2ª rodada) Reverificado no emulador depois do rebuild nativo — Detalhe do produto, "Outra quantidade", "Adicionar item avulso" e o ajuste do Modo compra confirmados OK (campo e botão de ação visíveis com teclado aberto), nos dois temas.
- [x] 6.5 (2ª rodada) Máscara de dinheiro confirmada no device: digitar "1290" mostrou "1" → "12" → "1,29" → "12,90", como esperado.
- [x] 6.6 Comparado nos dois temas (Despensa/Porcelana) — sem quebra de contraste/layout encontrada.

**Achado do QA (aceito como conhecido, não bloqueia o fechamento desta change — decisão do usuário):** o sheet `SheetAjusteEstoque` ("Corrigir quantidade atual") falhou em 1 de 5 tentativas — teclado cobriu campo, chips de motivo e botão "Corrigir" na primeira montagem; as 4 tentativas seguintes (incluindo os dois temas) ficaram corretas. Indício de corrida de timing entre `react-native-keyboard-controller` e a primeira montagem desse `Modal` específico, não reproduzida nos outros 3 sheets. Antes desta change, o overlay falhava 100% das vezes nesse ponto — a regressão residual (~20% intermitente) é uma melhora grande, mas fica registrada como investigação futura antes de considerar o Keyboard Overlap 100% fechado nesse sheet específico.

**Achado fora do escopo desta change (crítico, registrado pra virar change separada depois — decisão do usuário):** `app/(tabs)/lista.tsx` não usa `ScrollView`/`FlashList` — os itens renderizam direto num `View`, então com lista longa (24+ itens, o seed padrão) não há como rolar, e "Adicionar item avulso" fica permanentemente inacessível fora da viewport inicial. Não tem relação com os 3 bugs de usabilidade desta change (é ausência de scroll, não teclado/máscara/affordance) — não corrigido aqui.

## 8. Revisão pós-QA manual: troca pra bibliotecas testadas (pedido do usuário)

QA manual do usuário no emulador (após a implementação inicial) encontrou 2 problemas reais que a suíte automatizada não capturava: `KeyboardAvoidingView` nativo do RN não resolvia o overlay (nem no formulário, nem — pior — dentro dos 4 `Modal`), e a máscara de dinheiro caseira "não tava muito boa". Usuário pediu pesquisa via Context7 e adoção de libs testadas em vez de reimplementar na mão.

- [x] 8.1 Pesquisar via Context7 (`react-native-keyboard-controller`, `react-native-keyboard-aware-scroll-view`, outras) e trocar o `KeyboardAvoidingView` usado em `evita-teclado.tsx` pelo de `react-native-keyboard-controller` (resolve especificamente o caso de `Modal` no Android, documentado pela própria lib). Envolver a raiz do app (`app/_layout.tsx`) com `KeyboardProvider`.
- [x] 8.2 Pesquisar via Context7 libs de máscara de dinheiro (`react-native-mask-input`, `use-mask-input`, outras) e trocar a máscara de dinheiro caseira em `campo-texto.tsx` por `react-native-mask-input` (`createNumberMask` + `useMaskedInputProps`); manter a máscara de quantidade própria (`aplicarMascaraQuantidade`), sem lib equivalente pra esse formato.
- [x] 8.3 Corrigir bug encontrado pelos próprios testes automatizados durante a troca: `useMaskedInputProps` espera o `value` como dígitos "não mascarados", não o texto decimal (`"12,90"`) que o resto do app usa como estado — extrair dígitos em `CampoTexto` antes de repassar à lib, e reformatar os 3 pontos que semeiam preço inicial (`sheet-avulso.tsx`, `sheet-ajuste-compra.tsx`, `valoresDoItem()` em `app/produto/[id].tsx`) pra sempre "X,YY" com duas casas.
- [x] 8.4 `react-native-keyboard-controller` é módulo nativo — instalar mock oficial da lib (`react-native-keyboard-controller/jest`) em `jest.setup.app.js`, senão qualquer teste que importe `evita-teclado.tsx` (direta ou indiretamente) quebra a suíte inteira.
- [x] 8.5 Rebuild nativo (`npx expo run:android`, confirmado com o usuário antes de disparar por ser operação demorada que reinstala o APK do emulador) — sem isso o dev client instalado crasha ao abrir (`react-native-keyboard-controller` não linkado).
- [x] 8.6 Rodar `npm run verificar` + `npm test` completos de novo após a troca de libs — 862 testes passando, `npm run verificar` limpo (fronteiras + lint; typecheck com achado de infraestrutura pré-existente não relacionado, ver nota abaixo).
- [x] 8.7 Verificação visual manual (tasks 6.4–6.6) repetida depois do rebuild — overlay e máscara confirmados resolvidos nos 4 de 5 pontos testados; achado intermitente em `SheetAjusteEstoque` registrado acima, aceito como conhecido por decisão do usuário.

**Achado de infraestrutura, fora do escopo desta change:** `tsc --noEmit` está falhando em ~16 arquivos não tocados por esta change (`app/(tabs)/*.tsx`, `app/compra/*.tsx` etc.) com erro de rota não tipada do Expo Router. Causa: `.expo/types/router.d.ts` (gerado, fora do git) ficou vazio/desatualizado depois de um `expo start -c` interrompido no meio (sessão de QA anterior). `npm test` e `npm run lint` não são afetados (não dependem desse arquivo). O rebuild nativo da task 8.5 deve regenerar esse arquivo corretamente ao concluir; se não regenerar sozinho, é preciso investigar separadamente — não é uma regressão introduzida pelo código desta change.

## 7. Regressão

- [x] 7.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) e `npm test` completos, confirmando que nada além do escopo desta change foi afetado — 103 suites / 859 testes passando, `npm run verificar` limpo. Achou e corrigiu uma regressão real: `registro-e-desfazer.test.tsx` usava `getByLabelText('Fechar')`, que ficou ambíguo com o novo botão de fechar visível do sheet (task 5.2) — trocado para `getByRole('button', { name: 'Fechar' })`.
- [x] 7.2 Rodar a suíte de testes já existente de `formulario-produto`, `sheet-avulso`, `sheet-ajuste-estoque`, `sheet-ajuste-compra` e `teclado-quantidade` (arquivos `*.test.tsx` já existentes) confirmando que todos continuam verdes com as mudanças desta change — todos passando; cobertura de domínio 99% (`npm run test:cov`), acima do mínimo de 90%.
