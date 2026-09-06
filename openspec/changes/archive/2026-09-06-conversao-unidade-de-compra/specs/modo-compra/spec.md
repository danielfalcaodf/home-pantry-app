## ADDED Requirements

### Requirement: Marcação de item com fator de conversão coleta pacotes, não unidades

Ao marcar como comprado um item cujo produto tem fator de conversão cadastrado, o ajuste
detalhado SHALL perguntar quantos pacotes foram comprados, quantas unidades tem o pacote
encontrado no mercado (pré-preenchido com o fator cadastrado do produto, mas editável) e quanto
foi pago no total pelos pacotes — em vez de pedir quantidade e preço por unidade diretamente.
Essa coleta substitui, apenas para produtos com fator cadastrado, a informação direta de
quantidade/preço por unidade descrita no ajuste geral de quantidade comprada e preço pago.

#### Scenario: Ajuste pergunta pacotes para produto com fator

- **WHEN** o usuário abre o ajuste detalhado de um item cujo produto tem fator de conversão 12
- **THEN** o painel pergunta quantos pacotes, quantas unidades por pacote (pré-preenchido com
  12) e o valor total pago

#### Scenario: Tamanho do pacote editável no momento da compra

- **WHEN** o pacote encontrado no mercado tem 16 unidades em vez das 12 cadastradas
- **THEN** o usuário edita o campo de unidades por pacote para 16 antes de confirmar, e a
  quantidade repositada usa 16

#### Scenario: Quantidade comprada calculada a partir dos pacotes

- **WHEN** o usuário informa 2 pacotes de 12 unidades
- **THEN** a quantidade comprada considerada na reposição é 24 unidades

#### Scenario: Produto sem fator mantém o fluxo existente

- **WHEN** o produto marcado não tem fator de conversão cadastrado
- **THEN** o ajuste continua pedindo quantidade e preço por unidade, sem nenhuma pergunta sobre
  pacotes

#### Scenario: Divergência de tamanho não altera o cadastro

- **WHEN** o usuário confirma a compra com tamanho de pacote diferente do cadastrado no produto
- **THEN** o fechamento da compra segue normalmente e o fator cadastrado no produto permanece o
  mesmo depois

### Requirement: Passo rápido "+/-" anda de pacote em pacote para item com fator

Para item cujo produto tem fator de conversão (cadastrado ou já confirmado nesta compra via
ajuste detalhado), o passo rápido "+"/"−" do Modo Compra SHALL incrementar/decrementar pelo
fator inteiro de unidades, nunca por 1 unidade isolada — uma quantidade que não é múltiplo do
fator não corresponde a nenhuma compra possível no mercado. O piso de decremento (não descer
abaixo de um passo) SHALL corresponder a 1 pacote inteiro, não a 1 unidade. Quando o fator já foi
confirmado nesta compra (tamanho de pacote diferente do cadastrado, informado no ajuste
detalhado), o passo rápido usa esse tamanho confirmado, não o cadastrado. Produto sem fator
mantém o passo por unidade já existente, sem alteração.

#### Scenario: "+" incrementa pelo fator inteiro

- **WHEN** o item tem fator de conversão 6 e quantidade atual de 6 unidades
- **THEN** tocar "+" leva a quantidade a 12 unidades, nunca a 7

#### Scenario: "-" não desce abaixo de 1 pacote inteiro

- **WHEN** o item tem fator de conversão 6 e quantidade atual de 6 unidades (1 pacote)
- **THEN** o botão "-" fica desabilitado, e não existe estado de quantidade abaixo de 6 pelo
  passo rápido

#### Scenario: Passo usa o tamanho de pacote já confirmado nesta compra, não o cadastrado

- **WHEN** o produto tem fator cadastrado 12, mas o usuário já confirmou no ajuste detalhado
  desta compra que o pacote encontrado tem 16 unidades
- **THEN** o passo rápido "+/-" anda de 16 em 16, não de 12 em 12

#### Scenario: Produto sem fator mantém o passo por unidade

- **WHEN** o item não tem fator de conversão (cadastrado nem confirmado)
- **THEN** o passo rápido "+/-" continua igual ao comportamento anterior a esta change (por
  unidade/kg/L, ou 100 em 100 para g/ml)
