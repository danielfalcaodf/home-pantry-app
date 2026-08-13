## ADDED Requirements

### Requirement: Atalho de cabeçalho para Configurações

A tela de Resumo SHALL oferecer, no cabeçalho, um atalho para a tela de Configurações, com alvo de toque mínimo de 48×48dp.

#### Scenario: Atalho abre Configurações

- **WHEN** o usuário toca no atalho "Configurações" do cabeçalho do Resumo
- **THEN** a tela de Configurações é aberta

#### Scenario: Alvo de toque do atalho

- **WHEN** o botão "Configurações" do cabeçalho do Resumo é medido
- **THEN** sua área tocável mede no mínimo 48 por 48 pontos independentes, sem alterar seu tamanho visual
