## Context

O Modo Compra recebe os itens já ordenados por categoria — verificado no aparelho, a sequência
é idêntica à da aba Lista (Carne moída → Frango → Arroz → Aveia → … → Condicionador). O que
falta é só a renderização dos cabeçalhos.

Isso torna a correção pequena e de baixo risco: a lógica de agrupamento já existe em
`src/presentation/format/agrupar-lista.ts`, já é testada diretamente (exigência registrada em
`lista-derivada`), já trata "Sem categoria" por último, e já é consumida pela aba Lista. A
preferência de agrupamento também já existe e já persiste (`usePreferenciaDeAgrupamento`).

A lacuna real é de especificação: `modo-compra` descreve tela única, marcação, ajuste, rodapé e
início da compra — e não diz nada sobre organização visual dos itens. Sem requisito, a
ordenação atravessou e os rótulos não.

## Goals / Non-Goals

**Goals:**

- Cabeçalhos de categoria no Modo Compra, iguais aos da aba Lista.
- Respeitar a mesma preferência de agrupamento, incluindo o estado desligado.
- Reaproveitar `agrupar-lista.ts` — zero lógica nova.

**Non-Goals:**

- Ordenação própria do Modo Compra (por corredor de mercado, por exemplo). Seria feature, não
  correção, e não está no MVP.
- Cabeçalho recolhível ou navegável. Violaria "Tela única sem navegação interna".
- Mexer na marcação, no ajuste por toque longo ou no fechamento da compra.
- Corrigir a acessibilidade da linha de compra (A-15) — é
  `correcao-nomes-e-estados-acessiveis`, embora toque o mesmo arquivo. Ver Riscos.

## Decisions

### 1. Consumir `agrupar-lista.ts`, não reimplementar

A tela de Compra passa a montar sua lista com as mesmas funções que a aba Lista usa. Não é
escolha de conveniência: qualquer segunda implementação de agrupamento cria a possibilidade de
as duas telas divergirem, que é exatamente a classe de defeito sendo corrigida aqui.

Alternativa descartada: agrupar no repositório ou na query. O agrupamento é apresentação — a
lista é derivada e o domínio entrega valor bruto, conforme a regra do projeto.

### 2. A preferência é compartilhada, não duplicada

O Modo Compra lê a mesma `usePreferenciaDeAgrupamento` da Lista. Quem desligou o agrupamento na
Lista encontra a compra sem cabeçalhos, e vice-versa — coerência entre as duas telas do mesmo
fluxo.

Alternativa considerada: preferência independente para a compra. Descartada — duas
preferências para o mesmo conceito é configuração que ninguém pediu, e a Lista e a Compra são o
mesmo conjunto de itens visto em dois momentos.

### 3. Cabeçalho é rótulo, e nada além disso

Sem toque, sem recolher, sem contagem por grupo. O requisito "Tela única sem navegação interna"
é explícito, e a tela é usada com uma mão só, andando. Qualquer alvo tocável extra ali compete
com a marcação de item, que é a única ação da tela.

### 4. A prova é comparar as duas telas

O critério de aceite não é "existem cabeçalhos", é "os cabeçalhos são os mesmos da Lista, para
o mesmo conjunto de itens". Comparar as duas telas com a mesma massa é o que garante que a
correção fechou a divergência em vez de criar uma segunda versão dela.

## Risks / Trade-offs

- **[Cabeçalhos consomem altura vertical numa tela usada em pé, andando]** → Cada cabeçalho
  come uma linha. Numa compra de 41 itens com 5 categorias, são 5 linhas a mais de rolagem em
  troca de saber onde se está. É a mesma troca que a aba Lista já faz, e a preferência de
  agrupamento continua permitindo desligar.

- **[Toca `item-compra.tsx`, que também é território de `correcao-nomes-e-estados-acessiveis`
  (A-15)]** → Esta change mexe na **composição da lista** (o que envolve os itens); a outra
  mexe nos **atributos de acessibilidade da linha**. Não são as mesmas linhas, mas as duas
  precisam rodar o mesmo flow Maestro do Modo Compra. Registrar a sobreposição no `ORDER.md` e
  não rodar as duas em paralelo.

- **[O flow `.maestro/auditoria-ui-ux-android.yaml` rola pelo texto da linha no Modo Compra]**
  → Inserir cabeçalhos muda as posições e pode afetar `scrollUntilVisible`. O flow é gate de
  regressão e precisa ser reconferido, não só executado.

## Migration Plan

Sem migração de dados nem de schema. Só `presentation/` e `app/`.

## Open Questions

Nenhuma. A lógica, a preferência e os testes já existem; esta change é ligação de peças
existentes numa tela que ficou de fora.
