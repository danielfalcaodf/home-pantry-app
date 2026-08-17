## Context

A capability `medidor-linha-dagua` já tem um requisito forte sobre isso — "Sem animação
durante a rolagem" — com cenários testados em `medidor-e-item.test.tsx:67-94` que provam que o
componente `MedidorNivel`, **isolado**, obedece: `animar={false}` aplica o valor final direto,
`animar={true}` passa pela mola, e dois medidores lado a lado só animam o que teve `animar`
ligado.

O gap não é no componente, é na tela. `app/(tabs)/index.tsx:256` nunca passa `animar` ao
renderizar `ItemDespensa` dentro do `renderItem` da `FlashList` — o prop fica sempre no
`animar = true` default (`item-despensa.tsx:29`). E mesmo se passasse, um booleano estático
vindo de fora não resolve o problema real: a `FlashList` recicla a **mesma instância** de
componente para itens diferentes ao rolar (é o mecanismo que a torna rápida). Quando isso
acontece, o `useEffect` de `MedidorNivel` (`:39-41`) dispara porque `fracao` mudou — só que
mudou porque é **outro item**, não porque o mesmo item teve a quantidade alterada. Não existe
como um prop booleano estático, calculado uma vez pela tela, saber diferenciar os dois casos:
é preciso saber, dentro do próprio `MedidorNivel`, se o item por trás da célula é o mesmo de
antes.

A documentação oficial do `@shopify/flash-list` tem um guia dedicado a exatamente isso
("React Native Reanimated") e prescreve resetar o `useSharedValue` num `useEffect` chaveado
pelo id do item — ou usar o hook `useRecyclingState`, que a lib já exporta pronto para esse
padrão.

## Goals / Non-Goals

**Goals:**

- O requisito já escrito ("a tinta SHALL animar exclusivamente quando a quantidade daquele
  item mudar por ação do usuário") passa a valer também sob reciclagem de `FlashList`, não só
  nos testes isolados do componente.
- Nenhuma mudança de API pública visível pela tela além de precisar repassar o id do item.

**Non-Goals:**

- Mudar o mecanismo de mola (`molar()`, `movimento.ts`) ou os tokens de animação.
- Resolver a entrada em cascata na abertura da tela — já coberta pelo cenário "Sem entrada em
  cascata" e já funciona (é orthogonal: acontece uma vez, não durante rolagem).
- Trocar a `FlashList` por outra lista — o comportamento de reciclagem é o que dá a
  performance que o app precisa em despensas com dezenas de itens; o alvo é fazer o
  componente conviver corretamente com ele, que é o padrão que a própria lib recomenda.

## Decisions

### 1. `MedidorNivel` passa a saber o id do item e reseta por ele, não só por `animar`

Adiciona um prop de identidade (`idDoItem: string`) a `MedidorNivel`/`ItemDespensa`. Dentro de
`MedidorNivel`, o reset segue o padrão oficial do `@shopify/flash-list`: um `useEffect`
chaveado por `idDoItem`, separado do `useEffect` de `fracao`, que **corta** a mola em vez de
animá-la quando o id muda — célula reciclada aparece já no valor certo, sem transição visível.
Quando o id **não** muda e só `fracao` muda, o `useEffect` existente continua rodando `molar()`
normalmente — é a mudança real de quantidade, que deve animar.

Alternativa preferida sobre a implementação manual: usar `useRecyclingState` do próprio
`@shopify/flash-list`, que já encapsula esse padrão (reset por dependência, incluindo o id) —
decidir entre as duas na tarefa de implementação, verificando qual se encaixa melhor sem
reescrever a API pública de `MedidorNivel` usada pelos testes existentes.

Alternativa descartada: manter só o prop `animar` e tentar calculá-lo certo na tela. A tela não
tem como saber, de fora, se uma célula específica da `FlashList` está sendo reciclada — é
informação interna do mecanismo de reciclagem, só visível dentro do componente que ele recicla.

### 2. `app/(tabs)/index.tsx` passa a repassar o id do produto

`renderItem` (`:256`) passa `idDoItem={item.produtoId}` (ou equivalente) a `ItemDespensa`. É a
única mudança na tela — nenhuma lógica de animação migra para lá.

## Risks / Trade-offs

- **[Alterar a assinatura pública de `MedidorNivel`/`ItemDespensa` quebra os testes
  existentes]** → Os testes de `medidor-e-item.test.tsx` chamam o componente sem `idDoItem`
  hoje; o novo prop precisa de um default seguro (ex.: `idDoItem?: string`, sem reset se
  ausente) para não forçar reescrita de todo teste que não é sobre reciclagem — só os novos
  cenários de reciclagem passam o id.

- **[`useRecyclingState` é API nova da lib, pouco testada neste projeto]** → Comparado à
  alternativa manual (dois `useEffect`), tem o mesmo risco de qualquer dependência nova: se não
  se encaixar limpo, a tarefa de implementação usa o `useEffect` chaveado por id, que é o
  padrão documentado como equivalente pela própria lib.

## Migration Plan

Sem migração de dados nem de schema. Só `presentation/` e a passagem de um prop em
`app/(tabs)/index.tsx`.

## Open Questions

- `idDoItem` é o `produtoId`, ou a `chave` que a `FlashList` já usa como `keyExtractor`? Usar a
  mesma fonte evita duas noções de identidade divergentes para a mesma linha — decidir na
  implementação, olhando `agrupar-lista.ts`/o tipo de `linha` usado no `renderItem`.
