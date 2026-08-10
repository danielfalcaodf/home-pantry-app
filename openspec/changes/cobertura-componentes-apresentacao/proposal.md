**Type:** Bug Fix

## Why

A auditoria de qualidade F3 (`qa/achados/ACHADO-016`, `018`, `019`, `022`, `023`, `024`, `025`, `026`, `027`, `028`, `043`) encontrou onze componentes e hooks de `src/presentation/` e `src/application/tema/` cujo comportamento já está integralmente descrito nos specs existentes (`componentes-base`, `tema-e-tokens`, `cadastro-de-produto`, `tela-despensa`, `medidor-linha-dagua`, `movimento-do-gesto`, `registro-de-consumo`, `historico-do-produto`), mas que não têm nenhum teste automatizado provando esse comportamento — em alguns casos (`ACHADO-018`, `ACHADO-022`) apesar de o código já ter sido desenhado especificamente para ser testável (repositório injetável, lógica extraída). O "bug" aqui é a lacuna de cobertura, não uma divergência de comportamento: os componentes fazem o que o spec pede, mas nada impede uma regressão silenciosa da próxima PR — coreografia de gesto, cores distintas do histórico, filtro de sugestões de categoria e afins podem quebrar sem que `npm test` acuse. A "correção" é escrever os testes que faltam, incluindo os cenários de borda do mesmo contexto que a auditoria já nomeou junto de cada achado.

## What Changes

- Adicionar `toast.test.tsx` cobrindo substituição sem empilhamento, não bloqueio de interação com a tela por trás e barra de tempo visível (`ACHADO-016`).
- Adicionar `use-preferencia-de-tema.test.ts` (RTL `renderHook` + repositório fake) cobrindo persistência da escolha e leitura em nova montagem (`ACHADO-018`).
- Adicionar teste de `theme/movimento.ts` mockando `react-native-reanimated`/preferência de redução de movimento, confirmando `withTiming`/`DURACAO_FADE` em vez de `withSpring` (`ACHADO-019`).
- Adicionar `formulario-produto.test.tsx` cobrindo seção "mais opções" recolhida por padrão, filtro de sugestões de categoria pelo texto digitado e preenchimento exato do campo ao escolher uma sugestão (`ACHADO-022`).
- Adicionar `normalizar-busca.test.ts` cobrindo `casaComBusca('Açúcar', 'acucar')` e casos de borda (termo vazio, texto já normalizado) (`ACHADO-023`).
- Estender o teste de `app/produto/novo.tsx` (ou criar um novo) cobrindo a navegação "ver item existente" na duplicidade, confirmando o id de destino (`ACHADO-024`).
- Estender o `it.each` de conformidade em `medidor-e-item.test.tsx` com checagem de ausência de `shadowColor`/`shadowOpacity`/`elevation`/`borderRadius` divergente de zero em `item-despensa.tsx` (`ACHADO-025`).
- Adicionar teste de orquestração do gesto em `registro-e-desfazer.test.tsx` (ou arquivo dedicado) confirmando `Haptics.impactAsync` chamado ao toque, antes do callback de registro retornar (`ACHADO-026`).
- Espelhar em `registro-e-desfazer.test.tsx` o teste positivo de "Repus" no teclado de quantidade, análogo ao já existente para "Usei" (`ACHADO-027`).
- Estender `medidor-e-item.test.tsx` cobrindo a prop `animar` de `medidor-nivel.tsx` (`true`/`false`) e o caso de lista com dois itens onde só o alterado anima (`ACHADO-028`).
- Adicionar `cor-do-estado.test.ts` confirmando que `corDoMovimento` retorna três cores distintas dos tokens de tema (`ACHADO-043`).

Nenhum comportamento de produto muda — todo o trabalho é adicionar prova automatizada ao comportamento já especificado. Os deltas de spec desta change (seção Capabilities) apenas tornam explícitos, no texto normativo, detalhes de aceite que já eram exigidos implicitamente pelos cenários existentes e que os novos testes passam a verificar diretamente.

## Capabilities

### New Capabilities

(nenhuma — nenhum comportamento novo é introduzido)

### Modified Capabilities

- `componentes-base`: requisitos "Toast que não bloqueia e não empilha" e "Movimento respeita a preferência de acessibilidade" ganham critério de aceite explícito e comprovável por teste (mecanismo de substituição do toast; uso de `withTiming`/duração curta em vez de `withSpring` sob redução de movimento).
- `tema-e-tokens`: requisito "Preferência de tema persistida" passa a exigir explicitamente que a persistência seja verificável via o repositório injetável do hook, não apenas pela função pura de resolução.
- `cadastro-de-produto`: requisitos "Cadastro com campos essenciais em primeiro plano", "Autocomplete de categoria a partir do existente" e "Nome duplicado é impedido com caminho de saída" ganham critério de aceite explícito sobre o comportamento interativo do `FormularioProduto` e sobre a navegação da ação "ver item existente".
- `tela-despensa`: requisito "Busca por nome" passa a nomear a função pura responsável pela normalização (`normalizarParaBusca`/`casaComBusca`) como o ponto de verificação do cenário de acento e caixa.
- `medidor-linha-dagua`: requisitos "Linha de item como medidor vertical" e "Sem animação durante a rolagem" ganham critério de aceite explícito sobre ausência de sombra/elevação/raio no estilo do item e sobre a prop que controla a animação condicional do nível.
- `movimento-do-gesto`: requisito "Coreografia do gesto de registrar" passa a exigir explicitamente que o retorno tátil seja uma chamada verificável (`Haptics.impactAsync`) anterior à conclusão do callback de registro.
- `registro-de-consumo`: requisito "Quantidade específica por toque longo" passa a exigir simetria de cobertura entre os caminhos de registrar consumo e registrar reposição no painel de quantidade.
- `historico-do-produto`: requisito "Histórico de movimentos do produto" passa a exigir explicitamente que as três cores de tipo de movimento sejam mutuamente distintas.

## Impact

- `src/presentation/components/toast.tsx` (novo teste)
- `src/application/tema/use-preferencia-de-tema.ts` (novo teste)
- `src/presentation/theme/movimento.ts` (novo teste)
- `src/presentation/components/formulario-produto.tsx` (novo teste)
- `src/presentation/format/normalizar-busca.ts` (novo teste)
- `app/produto/novo.tsx` (novo teste ou extensão)
- `src/presentation/components/medidor-e-item.test.tsx` (extensão — conformidade sem contêiner, prop `animar`)
- `src/presentation/components/item-despensa.tsx` (sujeito da checagem de conformidade estendida)
- `src/presentation/components/registro-e-desfazer.test.tsx` (extensão — coreografia do gesto, caminho "Repus")
- `src/presentation/theme/cor-do-estado.ts` (novo teste)
- Nenhum arquivo de `src/domain/`, `src/infrastructure/` ou schema é alterado.

## Dependencies between changes

- Depende de `correcao-chips-de-estado` (Ordem 04): os testes de componentes precisam cobrir o comportamento já corrigido dos chips de estado, não o comportamento divergente que a correção substitui.
- Depende de `alvos-de-toque-e-acessibilidade` (Ordem 06): componentes como `formulario-produto.tsx` e o stepper de consumo são tocados por essa change (alvos de toque, rótulos de acessibilidade); os testes desta change devem asserir o estado pós-correção, não escrever contra um alvo que ainda vai mudar.
