# PRD — App de Estoque de Casa ("Repor")

| Campo | Valor |
|---|---|
| Versão | 0.1 (draft) |
| Data | 02/08/2026 |
| Plataforma | App mobile nativo/híbrido — Android e iOS |
| Modelo de uso | Compartilhado entre membros da mesma casa (multiusuário) |
| Stack | **TBD** (opções avaliadas na seção 4) |

---

## 1. Executive Summary

**Problem Statement**
Hoje o controle do que está acabando em casa é feito de cabeça ou em papel/notas soltas, o que gera dois erros recorrentes: comprar item que já tinha em casa e chegar ao mercado sem lembrar do que realmente faltava.

**Proposed Solution**
Um app mobile compartilhado entre os moradores da casa, onde cada produto tem quantidade atual e quantidade necessária (mínimo desejado). O usuário dá baixa ao consumir, e o app calcula automaticamente o que falta, gerando a lista de compras com quantidade a comprar e custo estimado.

**Success Criteria (KPIs)**

| # | Métrica | Meta |
|---|---|---|
| K1 | Itens comprados em duplicidade por mês (auto-reportado na primeira semana de uso vs. mês 2) | Redução ≥ 60% |
| K2 | Precisão do estoque: itens cuja quantidade no app bate com a real em auditoria mensal | ≥ 85% dos itens |
| K3 | Aderência: dias com pelo menos 1 baixa registrada | ≥ 5 dias/semana no mês 1 |
| K4 | Tempo para dar baixa em 1 item (do abrir o app até salvar) | ≤ 10 segundos, ≤ 3 toques |
| K5 | Erro do custo estimado da lista vs. valor real pago no caixa | ≤ 15% de desvio |
| K6 | Sincronização entre os 2 dispositivos da casa | Alteração visível no outro aparelho em ≤ 5s com internet |

---

## 2. User Experience & Functionality

### 2.1 User Personas

**P1 — O Gestor do Estoque (usuário principal)**
Cadastra produtos, define quantidades mínimas, revisa a lista antes de ir ao mercado e faz a reposição após a compra. Quer previsibilidade e controle de gasto.

**P2 — O Consumidor da Casa (usuário secundário)**
Não quer cadastrar nada. Só quer abrir o app quando pega a última caixa de leite e marcar "usei 1" em 3 segundos. Se for lento, ele para de usar — e o estoque perde a precisão.

### 2.2 User Stories & Acceptance Criteria

---

**US-01 — Cadastrar produto**
*Como gestor do estoque, quero cadastrar um produto com quantidade atual, quantidade necessária e valor unitário, para que o app saiba quando ele está em falta.*

**AC:**
- Campos obrigatórios: `nome`, `unidade` (un, kg, g, L, ml, pacote, caixa), `quantidade_necessaria`.
- Campos opcionais: `quantidade_atual` (default 0), `valor_unitario` (default 0), `categoria`, `marca_preferida`, `observacao`.
- `quantidade_necessaria` aceita valores decimais (ex.: 1,5 kg) e deve ser > 0.
- Nome duplicado dentro da mesma casa exibe alerta "Já existe um produto com esse nome" e permite cancelar ou salvar mesmo assim.
- Produto criado fica imediatamente visível para o outro morador (ver US-08).
- Cadastro completo em ≤ 4 campos preenchidos na tela inicial; demais campos ficam em "Mais opções" recolhido.

---

**US-02 — Dar baixa no consumo**
*Como consumidor da casa, quero dar baixa em um item em poucos toques, para que o estoque continue correto sem me tomar tempo.*

**AC:**
- Na lista principal, cada item tem botão de decremento rápido (`−1`) e opção de digitar quantidade específica.
- Decremento rápido subtrai 1 unidade e salva sem tela de confirmação.
- Quantidade nunca fica negativa: ao tentar baixar abaixo de 0, o app fixa em 0 e exibe toast "Estoque zerado".
- Toda baixa gera registro no histórico com `usuario`, `data_hora`, `quantidade` e `quantidade_resultante`.
- Ação de desfazer disponível por 10 segundos após a baixa.
- Operação funciona offline e sincroniza depois (ver US-09).

---

**US-03 — Ver o que está faltando**
*Como gestor, quero ver de forma destacada tudo que está abaixo do mínimo, para saber o estado da casa em uma olhada.*

**AC:**
- Item é classificado como **Em falta** quando `quantidade_atual < quantidade_necessaria`.
- Estados visuais: **Crítico** (`quantidade_atual = 0`), **Em falta** (`0 < atual < necessaria`), **OK** (`atual >= necessaria`).
- Tela inicial mostra contadores por estado e permite filtrar por estado e por categoria.
- Ordenação padrão: Crítico → Em falta → OK; dentro de cada grupo, ordem alfabética.

---

**US-04 — Gerar lista de compras**
*Como gestor, quero gerar automaticamente a lista de compras a partir do que está faltando, para não precisar montar a lista na mão.*

**AC:**
- Lista inclui todos os itens com `quantidade_atual < quantidade_necessaria`.
- Para cada item calcula `quantidade_a_comprar = quantidade_necessaria − quantidade_atual`, arredondada para cima quando a unidade for indivisível (un, pacote, caixa).
- Custo estimado por item = `quantidade_a_comprar × valor_unitario`; itens sem valor unitário entram com custo 0 e marcação "sem preço".
- Rodapé exibe **total estimado da compra** e quantos itens estão sem preço cadastrado.
- É possível adicionar item avulso à lista (ex.: churrasco no fim de semana) sem cadastrá-lo no estoque permanente.
- É possível remover item da lista sem alterar o estoque.
- Lista pode ser agrupada por categoria (modo corredor de mercado).
- Lista pode ser exportada como texto para compartilhar (WhatsApp, etc.).

---

**US-05 — Comprar e repor o estoque**
*Como gestor, quero marcar os itens conforme coloco no carrinho e finalizar a compra, para que o estoque volte ao nível cheio automaticamente.*

**AC:**
- Cada item da lista tem checkbox de "peguei".
- Ao marcar, é possível ajustar a quantidade realmente comprada e o preço pago.
- Se o preço pago diferir do `valor_unitario` cadastrado, o app pergunta "Atualizar o preço de referência?" (sim/não).
- Ao finalizar a compra, `quantidade_atual += quantidade_comprada` para cada item marcado.
- Itens não marcados permanecem na lista pendente.
- Compra finalizada é gravada no histórico com data, itens, quantidades e valor total pago.

---

**US-06 — Ajustar estoque manualmente**
*Como gestor, quero corrigir a quantidade de um item quando o app estiver errado, para manter a confiança nos dados.*

**AC:**
- Edição direta de `quantidade_atual` com registro de ajuste no histórico (motivo opcional: perda, vencimento, correção).
- Ação de "conferência de estoque": modo de tela que percorre os itens de uma categoria para revisão rápida.

---

**US-07 — Acompanhar valor do estoque e gasto**
*Como gestor, quero ver quanto tenho em estoque e quanto gastei, para ter controle do orçamento da casa.*

**AC:**
- **Valor do estoque** = Σ (`quantidade_atual` × `valor_unitario`) de todos os produtos.
- **Valor da lista de compras** = Σ (`quantidade_a_comprar` × `valor_unitario`) dos itens em falta.
- Tela de resumo exibe os dois valores separadamente e com rótulos distintos (evitar confusão entre "total em casa" e "total a comprar").
- Histórico mostra gasto total por mês das compras finalizadas.

---

**US-08 — Compartilhar a casa com outro morador**
*Como gestor, quero convidar outra pessoa para a mesma casa, para que os dois vejam e atualizem o mesmo estoque.*

**AC:**
- Uma "Casa" é a unidade de compartilhamento; todo produto pertence a uma Casa.
- Convite por link ou código de 6 dígitos, com expiração de 7 dias.
- MVP suporta 2 perfis: **Administrador** (cadastra, edita, exclui, convida) e **Membro** (dá baixa, adiciona à lista, finaliza compra).
- Toda alteração registra qual usuário a fez.

---

**US-09 — Usar offline e sincronizar**
*Como consumidor, quero dar baixa mesmo sem internet (dentro da despensa, no mercado com sinal ruim), para não perder o registro.*

**AC:**
- Leitura e escrita funcionam 100% offline sobre banco local.
- Alterações offline entram em fila e sincronizam automaticamente ao recuperar conexão.
- Conflito de quantidade entre dispositivos é resolvido aplicando os **deltas** (ex.: A deu −1 e B deu −1 sobre estoque 5 → resultado 3), não sobrescrevendo o valor absoluto.
- Conflito de edição de cadastro (nome, preço) usa last-write-wins com timestamp do servidor.
- Indicador visual de "pendente de sincronização" nos itens em fila.

---

**US-10 — Notificação de reposição**
*Como gestor, quero ser avisado quando itens ficarem em falta, para não descobrir só na hora de cozinhar.*

**AC:**
- Notificação push quando um item passa para o estado **Crítico**.
- Resumo semanal (dia e horário configuráveis) com a contagem de itens em falta e o total estimado da compra.
- Notificações podem ser desligadas individualmente por tipo.

---

### 2.3 Non-Goals (fora do escopo)

- **Scanner de código de barras** e leitura de nota fiscal — descartados do MVP por decisão do usuário; reavaliar em v2.0.
- **Baixa automática por consumo médio / previsão de quando vai acabar** — não entra no MVP.
- **Integração com supermercados, e-commerce ou comparação de preços entre lojas.**
- **Controle de validade e alerta de vencimento** — candidato a v1.1, não MVP.
- **Receitas, planejamento de cardápio e cálculo nutricional.**
- **Multi-casa por usuário** (ex.: casa + sítio) — MVP assume 1 casa por usuário.
- **Versão web ou desktop.**
- **Divisão de despesas entre moradores.**

---

## 3. AI System Requirements

**Não aplicável ao MVP.** O MVP é determinístico: cálculo simples de `necessária − atual` e somatórios. Não há necessidade de modelo, e introduzir IA aqui adicionaria custo, latência e imprevisibilidade sem ganho de produto.

**Candidatos para v2.0**, condicionados a haver massa de dados de histórico:

| Recurso | Descrição | Estratégia de avaliação |
|---|---|---|
| Sugestão de quantidade necessária | Recomendar `quantidade_necessaria` a partir do consumo histórico dos últimos 90 dias | Backtest: a sugestão evitaria ruptura em ≥ 80% dos casos históricos sem inflar o estoque em mais de 20% |
| Previsão de ruptura | Estimar em quantos dias o item acaba | Erro médio absoluto ≤ 2 dias em itens com ≥ 10 baixas registradas |
| Entrada por texto livre | "acabou o arroz e sobrou meio pacote de café" → baixas estruturadas | Conjunto de 50 frases reais; ≥ 90% de acerto de produto + quantidade; toda saída passa por tela de confirmação antes de gravar |
| Categorização automática | Sugerir categoria ao cadastrar produto | ≥ 85% de acerto em 100 produtos comuns de mercado |

Regra de projeto: nenhuma funcionalidade de IA pode alterar o estoque sem confirmação explícita do usuário.

---

## 4. Technical Specifications

### 4.1 Architecture Overview

```
┌─────────────────────────────┐
│   App Mobile (Android/iOS)  │
│  UI → Camada de domínio     │
│  (regras de estoque/lista)  │
│         ↕                   │
│  Banco local (offline-first)│
│         ↕                   │
│  Fila de sincronização      │
└───────────┬─────────────────┘
            │ HTTPS
┌───────────▼─────────────────┐
│  Backend / BaaS             │
│  Auth · API · DB · Push     │
└─────────────────────────────┘
```

O app é **offline-first**: a fonte de verdade para a UI é o banco local; o servidor é o ponto de convergência entre os dispositivos da casa.

### 4.2 Modelo de Dados

**casa**: `id`, `nome`, `criada_em`
**usuario**: `id`, `nome`, `email`, `casa_id`, `perfil` (admin | membro)

**produto**
| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid | |
| `casa_id` | uuid | FK |
| `nome` | text | |
| `categoria` | text | nullable |
| `unidade` | enum | un, kg, g, L, ml, pacote, caixa |
| `quantidade_atual` | decimal(10,3) | ≥ 0 |
| `quantidade_necessaria` | decimal(10,3) | > 0 |
| `valor_unitario` | decimal(10,2) | ≥ 0, default 0 |
| `marca_preferida` | text | nullable |
| `ativo` | bool | exclusão lógica |
| `atualizado_em` | timestamp | usado no last-write-wins |

Campos **derivados, nunca persistidos**:
- `valor_total_estoque = quantidade_atual × valor_unitario`
- `em_falta = quantidade_atual < quantidade_necessaria`
- `quantidade_a_comprar = max(0, quantidade_necessaria − quantidade_atual)`
- `custo_reposicao = quantidade_a_comprar × valor_unitario`

**movimento_estoque** (append-only): `id`, `produto_id`, `usuario_id`, `tipo` (baixa | reposicao | ajuste), `quantidade_delta`, `quantidade_resultante`, `motivo`, `criado_em`, `sincronizado_em`

**compra**: `id`, `casa_id`, `usuario_id`, `status` (aberta | finalizada), `valor_total_pago`, `finalizada_em`
**compra_item**: `id`, `compra_id`, `produto_id`, `quantidade_planejada`, `quantidade_comprada`, `valor_pago_unitario`, `comprado` (bool)

### 4.3 Integration Points

| Componente | Necessidade | Definição |
|---|---|---|
| Framework mobile | Android + iOS com um só código | **TBD** — Flutter, React Native ou Kotlin/Swift nativos |
| Backend | Auth, API, DB gerenciado, realtime, push | **TBD** — BaaS (Firebase/Supabase) reduz muito o esforço para escopo doméstico |
| Banco local | Persistência offline | **TBD** — SQLite/Drift, Room, WatermelonDB ou o cache offline do BaaS |
| Push | Notificações de item crítico e resumo semanal | FCM (Android) + APNs (iOS) |
| Autenticação | Login por e-mail/senha ou provedor social | **TBD** |

### 4.4 Security & Privacy

- Todo tráfego em HTTPS/TLS 1.2+.
- Isolamento por `casa_id`: nenhuma query pode retornar dados de outra casa — regras de autorização aplicadas no servidor, nunca só no cliente.
- Nenhum dado sensível além de nome e e-mail; sem dados de pagamento no MVP.
- Banco local do dispositivo protegido pelo armazenamento privado do app; tokens em Keychain (iOS) / Keystore (Android).
- Sair da casa remove o acesso do usuário aos dados no próximo sync.
- Exclusão de conta remove ou anonimiza os dados pessoais em até 30 dias (LGPD, art. 18).
- Exportação dos dados da casa em CSV/JSON a pedido do usuário.

---

## 5. Risks & Roadmap

### 5.1 Phased Rollout

**MVP — "o estoque funciona"**
CRUD de produtos · baixa rápida · cálculo de faltantes · geração e exportação da lista · finalização de compra com reposição · valor do estoque e da lista · casa compartilhada com 2 perfis · offline-first com sync por delta.
*Critério de saída:* 4 semanas de uso real da casa com K2 ≥ 85% e K3 ≥ 5 dias/semana.

**v1.1 — "menos atrito"**
Widget de tela inicial para baixa rápida · notificações de crítico e resumo semanal · categorias personalizadas e modo corredor · controle de validade · histórico de preço por produto · gráfico de gasto mensal.

**v2.0 — "inteligência e velocidade de entrada"**
Scanner de código de barras com base de produtos · importação por nota fiscal · sugestão de quantidade necessária por histórico · previsão de ruptura · entrada por texto livre · múltiplas casas.

### 5.2 Technical Risks

| Risco | Impacto | Mitigação |
|---|---|---|
| **Abandono por atrito de entrada** — se dar baixa não for trivial, o estoque desatualiza e o app perde o sentido. É o maior risco do produto. | Crítico | Meta de ≤ 3 toques e ≤ 10s (K4); widget na v1.1; "conferência de estoque" para recuperar a precisão sem recadastrar |
| **Conflito de sincronização entre os 2 moradores** — baixas simultâneas se sobrescrevem e o estoque fica errado | Alto | Sincronizar deltas, não valores absolutos; movimentos append-only permitem recalcular a quantidade |
| **Cadastro inicial pesado** — dezenas de itens digitados na mão antes de qualquer valor percebido | Alto | Onboarding com lista base de ~40 itens comuns de mercado para marcar/desmarcar; permitir começar com 10 itens |
| **Preço desatualizado** — custo estimado perde credibilidade (K5) | Médio | Atualizar preço de referência na finalização da compra; sinalizar itens sem preço |
| **Unidades inconsistentes** (compra em kg, consome em g) | Médio | Restringir unidade por produto no MVP; conversão só em versão futura |
| **Custo de manter backend para uso doméstico** | Baixo | BaaS em free tier atende o volume; sem processamento pesado no MVP |

---

## Apêndice — Decisões em aberto

1. **Stack** (mobile, backend, banco local) — a definir; sugestão de decidir antes de qualquer código.
2. **"Valor total"** — o PRD separa deliberadamente *valor do estoque* de *valor da lista de compras*. Confirmar se é isso mesmo ou se você quer só um dos dois.
3. **Reposição no fechamento da compra** — assumi `atual += comprado`. Alternativa seria "voltar ao nível necessário". Confirmar.
4. **Perfis de acesso** — admin/membro pode ser simplificado para acesso igual entre os dois moradores, reduzindo escopo do MVP.
5. **Nome do app** — "Repor" é placeholder.
