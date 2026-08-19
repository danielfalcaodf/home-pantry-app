## Context

Três ações do app estão fora de alcance. O que as une não é a tela — são três telas
diferentes — mas a forma: cada uma foi escrita como conteúdo em vez de como controle.

O projeto **já tem** o padrão correto implementado e testado. `app/produto/[id].tsx:254-263`:

```tsx
<Pressable
  onPress={() => router.push(`/produto/${id}/historico`)}
  accessibilityRole="button"
  accessibilityLabel="Ver histórico completo"
  hitSlop={8}
  style={{ minHeight: ALVO_TOQUE_MINIMO, justifyContent: 'center', ... }}
>
```

com regressão em `app/produto/[id].test.tsx:82` (*"'Ver histórico completo' mede ao menos 48dp
de altura"*). O gêmeo dele em `app/(tabs)/resumo.tsx:138-144` é um `<Texto onPress>` de 22dp.
Não é falta de padrão: é padrão que não foi propagado.

O requisito também já existe. `componentes-base` → "Botão com alvo de toque mínimo" cobre
"qualquer elemento tocável" e tem cenário explícito para `Pressable` fora de `Botao`. A brecha
é que os cenários nomeiam `Botao` e `Pressable`, e as três violações tomaram uma terceira
forma — `<Texto onPress>` — que ninguém pensou em procurar.

## Goals / Non-Goals

**Goals:**

- As três ações alcançáveis e com 48×48dp reais, medidos no aparelho.
- A ação primária do formulário numa posição que não muda com o estado da tela.
- A mesma ação com a mesma forma no estado vazio e no estado cheio.
- Propagar o padrão que já existe, em vez de inventar um novo.
- Fechar a brecha de spec que deixou `<Texto onPress>` passar.

**Non-Goals:**

- Redesenhar as três telas ou mudar a hierarquia visual delas.
- Tratar os insets do sistema — é `correcao-bordas-do-sistema` (Ordem 3), da qual esta depende.
- Varrer o app inteiro atrás de todo alvo pequeno. O escopo são os três achados medidos, mais a
  varredura de `<Texto onPress>` que a correção da spec torna obrigatória (grupo 1 das tasks) —
  isso é fechar a causa, não expandir escopo.

## Decisions

### 1. Um componente de ação secundária, extraído do padrão que já funciona

`resumo.tsx` e o rodapé da Lista querem a mesma coisa: uma ação que parece link e se comporta
como botão. `app/produto/[id].tsx:254-263` já é isso. Extrair para
`src/presentation/components/`, e os três passam a consumi-lo.

Isto satisfaz o gatilho de extração do projeto — repetição real em três lugares —, não
antecipação. E o teste de alvo de toque passa a existir uma vez, no componente, em vez de ser
replicado em cada consumidor.

Alternativa descartada: corrigir os três locais individualmente com `Pressable` inline. Mesmo
diff, e o quarto consumidor nasce errado de novo — que é literalmente o que aconteceu entre
`[id].tsx` e `resumo.tsx`.

### 2. "Adicionar item avulso" sai do rodapé e vira uma ação de cabeçalho da Lista

O `ListFooterComponent` é a causa direta do defeito de posição: qualquer coisa depois do
último item de uma lista de 41 está a ~3200px de rolagem. A Lista já tem uma barra de ações no
cabeçalho ("Compartilhar", "Agrupar", `lista.tsx:130-152`), com o padrão de alvo de toque já
correto — é o lugar natural.

Isso também resolve a incoerência com `lista.tsx:113-114`: o `EstadoVazio` continua oferecendo
a ação como botão, e agora a versão do estado cheio é igualmente um botão, no cabeçalho.

Alternativa considerada: manter no rodapé e só corrigir o alvo de toque. Descartada — corrige
o A-10.2 e deixa o A-10.1 e o A-10.3 de pé, que são os que o usuário relatou.

Alternativa considerada: botão flutuante sobre a lista. Descartada — o design system não tem
FAB, e a direção "linha d'água" é explícita em não pôr elemento flutuando sobre a lista.

### 3. O CTA do formulário é ancorado, não movido

"Adicionar à despensa" sai do fluxo do `ScrollView` e passa a um rodapé ancorado da tela, com o
inset inferior de `bordas-do-sistema`. Os campos rolam; a ação não.

É a única correção que atende os três estados da tabela do `proposal.md` de uma vez —
recolhido, expandido, e expandido com teclado. Qualquer ajuste de espaçamento resolve no
máximo um deles.

Alternativa descartada: `scrollTo` automático até o botão ao expandir "Mais opções". Move o
conteúdo debaixo da pessoa enquanto ela lê, e não resolve o estado com teclado.

### 4. A dependência de `correcao-bordas-do-sistema` é dura, não conveniência

Ancorar no rodapé sem inset inferior coloca a ação primária **dentro** da faixa de gestos —
exatamente o A-04 medido (`Adicionar à despensa` terminando em ≈ y2334, com a faixa começando
em y=2274). Trocar "fora da dobra" por "dentro da faixa de gestos" não é correção. Por isso
esta change entra depois da Ordem 3 no `ORDER.md`.

### 5. Verificação por bounds e por árvore de acessibilidade

Duas medições distintas, porque os defeitos são de dois tipos:
- **tamanho**: `inspect_screen` → altura do alvo ≥ 126px no emulador de referência (48dp a
  density 2.625);
- **papel**: o nó precisa aparecer como `Button` e `clickable` na árvore. Hoje "Ver histórico"
  é `android.view.View` e nem `clickable` traz — é o sintoma de não ter papel acessível, e não
  aparece numa medida de altura.

## Risks / Trade-offs

- **[Mover "Adicionar item avulso" para o cabeçalho muda a barra de ações da Lista, que já tem
  dois controles]** → Três controles no cabeçalho pode apertar em telas estreitas. Mitigação:
  medir a barra em 1080px e verificar que não há corte; se apertar, a régua de decisão é o
  `FRONTEND-DESIGN`, e o resultado volta como `/opsx:update`.

- **[Ancorar o CTA do formulário reduz a área visível de campos]** → Um rodapé ancorado come
  ~68dp de altura útil. É a troca deliberada: melhor um campo a menos por vez do que a ação
  principal fora da dobra. O KPI aqui é conseguir submeter, não ver o formulário inteiro.

- **[A varredura de `<Texto onPress>` pode encontrar mais violações do que os três achados]** →
  Provável, e é o ponto. Se encontrar muitas, a decisão de quantas entram nesta change é do
  usuário — registrar a lista e perguntar, em vez de inflar o escopo silenciosamente.

- **[Depender da Ordem 3 atrasa a correção que o usuário relatou]** → Sim, mas a alternativa é
  entregar a ação ancorada dentro da faixa de gestos. Os dois defeitos são da mesma borda.

## Migration Plan

Sem migração de dados nem de schema. Só `presentation/` e `app/`.

## Open Questions

- A varredura de `<Texto onPress>` (task 1.1) define o tamanho real desta change. Se aparecerem
  muitos casos além dos três medidos, decidir com o usuário se entram aqui ou viram uma change
  própria de conformidade de alvo de toque.
