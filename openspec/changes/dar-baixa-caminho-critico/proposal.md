## Why

Este é o change que decide se o produto vive ou morre. O PRD nomeia o maior risco do projeto com clareza: *"Abandono por atrito de entrada — se dar baixa não for trivial, o estoque desatualiza e o app perde o sentido"*, impacto **Crítico**. A persona P2 abre o app em pé na frente da geladeira, com uma mão só, provavelmente segurando outra coisa. Se demorar, ela para de usar, e a precisão do estoque (K2) desaba junto.

Daí a meta K4: **≤ 3 toques, ≤ 10 segundos**, do abrir o app até salvar. E daí a separação desta change da anterior — ARQUITETURA §11 isola "dar baixa" como etapa própria justamente porque ela "merece iteração de UX própria". Implementá-la de passagem junto do CRUD seria tratar o caminho crítico como mais um formulário.

## What Changes

- Torna o stepper de consumo funcional: um toque em `−` registra o consumo de 1 unidade e salva, **sem confirmação, sem navegação, sem indicador de carregamento**.
- Implementa a orquestração de movimento de FRONTEND §9: retorno tátil leve no toque, contração do círculo para 0,92 e volta, descida da linha d'água em mola com amortecimento 18 rodando na thread de UI, troca dos números em esmaecimento cruzado, e entrada do toast.
- Implementa o **teclado de quantidade** em painel inferior (toque longo no stepper, ou pelo detalhe): campo numérico grande, unidade fixa ao lado, botões `Usei` e `Repus`.
- Implementa o **toast de desfazer** com 10 segundos e barra de tempo, inserindo um **movimento inverso** — nunca uma remoção.
- Implementa o comportamento de baixa que cruzaria zero: fixa em 0 com o aviso correspondente.
- Implementa `use-dar-baixa` e `use-desfazer-movimento` em `application/`.
- Adiciona `Usei` e `Repus` na tela de detalhe do produto, como caminho alternativo visível ao toque longo (exigência de acessibilidade de FRONTEND §10).
- Mede o caminho crítico contra o KPI e registra o resultado.

## Capabilities

### New Capabilities

- `registro-de-consumo`: o gesto de um toque que registra consumo, sua atomicidade, o comportamento em item zerado e o caminho por quantidade específica.
- `desfazer-registro`: a janela de desfazer por movimento inverso, sem remoção da trilha.
- `movimento-do-gesto`: a coreografia de retorno tátil, contração, descida do nível e troca de números, com seu comportamento sob redução de movimento.

### Modified Capabilities

- `medidor-linha-dagua`: o nível passa a animar quando a quantidade muda por ação do usuário, mantendo-se estático em qualquer outro momento.

## Impact

- **Cria**: `src/application/estoque/{use-dar-baixa,use-desfazer-movimento}.ts`, `src/presentation/components/{StepperConsumo,TecladoQuantidade,ToastDesfazer}.tsx`.
- **Modifica**: `ItemDespensa` (stepper ativo, nível animado), `app/produto/[id].tsx` (botões `Usei` e `Repus`), layout raiz (provedor do painel inferior).
- **Depende de**: `despensa-e-cadastro-produto` (a linha existe), `fundacao-dominio` (regra de saldo e movimento inverso), `persistencia-sqlite` (transação de baixa).
- **Bloqueia**: nada diretamente, mas é pré-requisito de sentido para `lista-de-compras` — a lista só tem valor com estoque real dentro.
- **KPI**: esta change é a única cuja aceitação inclui uma medição — K4, ≤ 3 toques e ≤ 10 segundos.
