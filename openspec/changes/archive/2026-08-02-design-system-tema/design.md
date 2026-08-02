## Context

O design de frontend fez uma aposta declarada: a lista principal não tem cards, bordas nem sombras. Só linhas cheias de tinta até certa altura, separadas por hairlines (FRONTEND §2.3). Um layout assim não perdoa imprecisão — ele se sustenta pelo ritmo vertical e pela tipografia, e desmonta se cada tela escolher seu próprio espaçamento.

Isso muda a natureza desta change. Em um app com cards, os tokens seriam conveniência. Aqui eles são a estrutura que segura a aposta. Por isso vêm antes de qualquer tela, e por isso o lint que proíbe cor literal (já ativo desde o bootstrap) passa a ter algo a proteger.

Estado: domínio e persistência prontos. Nenhum pixel desenhado ainda.

## Goals / Non-Goals

**Goals:**

- Duas paletas de primeira classe com a mesma forma, tipadas.
- Escala tipográfica com três papéis que não se misturam, e todo número em monoespaçada tabular.
- Preferência de tema persistida no SQLite e lida antes de esconder a splash.
- Os componentes-base que **não conhecem o domínio de estoque**.

**Non-Goals:**

- `ItemDespensa` e o medidor de linha d'água — pertencem à change `despensa-e-cadastro-produto`, porque dependem das regras de estado do domínio. O componente-assinatura não é um componente genérico.
- Stepper de consumo e teclado de quantidade — change `dar-baixa-caminho-critico`.
- Ícones: FRONTEND §12.3 pede um set só, contorno, peso 1,5. A escolha do set entra aqui como decisão, mas os ícones são adicionados conforme as telas os exigirem.

## Decisions

### D1 — Tema por contexto React, não por variável global de estilo

`ThemeProvider` + `useTheme()`, com os tokens resolvidos por hook. Alternativa considerada: um objeto global de tema importado direto, trocado em tempo de execução. Rejeitada — a troca de tema não re-renderizaria a árvore, e o requisito de acompanhar a mudança do sistema sem reinício deixaria de funcionar.

Custo: cada componente estilizado chama `useTheme()`. Aceito — é o mecanismo padrão e o único que reage.

### D2 — Preferência de tema no SQLite, não em armazenamento de chave-valor separado

FRONTEND §3.5 é explícito: "a preferência do usuário fica no SQLite, não em estado volátil". Adicionar `AsyncStorage` só para isso criaria uma segunda fonte de verdade em um app que decidiu ter uma só (ADR-05).

Consequência que precisa ser encarada: a preferência é lida do banco, e o banco só está disponível depois das migrations. Isso ordena a abertura — migrations, leitura da preferência, esconder a splash — e é exatamente o que o requisito de não piscar branco exige. A tabela de configuração chega em uma **migration nova** (`0001`), nunca por edição da inicial.

### D3 — Uma tabela de configuração chave-valor, não uma coluna por preferência

A preferência de tema é a primeira de várias que virão (dia e horário do resumo semanal na v1.1, tipos de notificação ligados). Uma coluna por preferência significaria uma migration por preferência — caro em um app onde migration é forward-only e não reverte no aparelho.

Trade-off: perde-se tipagem no banco. Mitigado por um acessador tipado no repositório, com o valor padrão declarado junto da chave. O volume é de unidades de linhas.

### D4 — Tipos nominais para os papéis tipográficos, não `style` livre

O componente `Texto` aceita `papel` de uma união fechada e resolve família, tamanho, altura de linha e peso. Não aceita `style` de fonte arbitrário.

Rationale: FRONTEND §4 fixa que os três papéis "nunca são intercambiáveis", e §4.1 dá o motivo funcional — figuras tabulares impedem a lista de "pular" a cada toque. Se `style` for aberto, o primeiro número renderizado com a fonte de corpo desfaz isso silenciosamente. Fechar o componente é o que torna a regra verificável em vez de aspiracional.

### D5 — `reduceMotion` declarado na animação, não checado nos componentes

`withSpring(..., { reduceMotion: ReduceMotion.System })`, conforme o `CLAUDE.md`. A alternativa — ler a preferência de acessibilidade em um hook e ramificar em cada componente — espalha a decisão por N lugares e garante que um deles vai esquecer.

### D6 — Toast substitui, nunca empilha, e é um só na árvore

FRONTEND §7.4 é explícito. Implementado como provedor único no layout raiz, com uma fila de tamanho 1: disparar um novo toast cancela o anterior. Isso importa mais do que parece no caminho crítico — dar baixa em três itens seguidos não pode produzir três toasts sobrepostos, cada um com seu próprio botão de desfazer apontando para movimentos diferentes.

O comportamento de desfazer em si é da change `dar-baixa-caminho-critico`; aqui entra só o componente e a política de substituição.

### D7 — Os componentes-base não conhecem estoque

`Texto`, `Botao`, `CampoTexto`, `ChipEstado`, `Toast`, `EstadoVazio`, `TelaErro` não importam nada de `domain/produto`. `ChipEstado` recebe rótulo, contagem e uma cor de estado — não recebe um produto e decide a cor.

Isso mantém a regra de dependência limpa e, mais concretamente, é o que permite testar esses componentes sem construir um produto falso.

### D8 — Verificar os pesos exportados antes de fixar constantes

FRONTEND §4.1 traz o aviso explícito: nem toda família exporta todos os pesos nos pacotes de fonte do Expo. Fixar `Archivo_600SemiBold` sem verificar produz um erro de carregamento em runtime que só aparece no aparelho.

Tarefa explícita: inspecionar o que cada pacote exporta e ajustar a escala ao que existe, não ao que o documento supôs.

## Risks / Trade-offs

| Risco | Mitigação |
|---|---|
| Três famílias de fonte estourando o bundle | Carregar só os pesos referenciados pela escala; medir o total e registrar; o documento de frontend já fixa que Archivo é a primeira a sair acima de 400 KB |
| Flash branco na abertura por ordem errada de inicialização | Ordem explícita: migrations, leitura da preferência, fontes, esconder a splash — com a splash mantida visível até tudo resolver |
| Leitura do banco na abertura atrasando a inicialização perceptível | Uma consulta de uma linha em um banco local; se medir mal, o caminho é manter a splash e não introduzir um segundo armazenamento |
| Contraste dos tokens degradando com o preenchimento do medidor por cima | O preenchimento usa a cor de estado em opacidade baixa sobre o fundo base; verificar o contraste do texto **sobre a tinta**, não só sobre o fundo limpo |
| Componente `Texto` fechado demais e sendo contornado com componente de texto nativo | Regra de lint proibindo o componente de texto nativo fora de `presentation/components/` |
| Tokens divergindo do documento de frontend ao longo do tempo | Os valores hexadecimais vêm literalmente das tabelas de FRONTEND §3.1 e §3.2; qualquer alteração exige atualizar o documento primeiro |

## Migration Plan

Uma migration nova (`0001_configuracao`) adicionando a tabela de configuração. É a primeira migration aplicada sobre um banco que já pode conter dados reais — serve como o primeiro exercício real da política de backup antes de migrar, estabelecida na change de persistência.

Sem reversão executável. Se a migration falhar, o app cai na tela de erro de migration e o caminho é restaurar o backup.

## Open Questions

- **Set de ícones**: FRONTEND §12.3 pede contorno, peso 1,5, uma família só. A escolha concreta pode ser feita quando a primeira tela precisar de um ícone; o que fica decidido aqui é a restrição de não misturar famílias.
- **Cor do preenchimento em item com sobra**: FRONTEND §6 pede "um traço fino de 1px acima da régua" para marcar a sobra, sem especificar a cor. Assumir a cor de estado com opacidade intermediária, e revisar visualmente com dados reais.
