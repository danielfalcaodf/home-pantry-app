# Repor — App de Estoque de Casa

App mobile (React Native + Expo) para controle do estoque doméstico: cada produto tem uma quantidade atual e uma quantidade mínima desejada; o app aponta o que está faltando e gera a lista de compras automaticamente.

> Projeto em fase inicial de desenvolvimento. Consulte os documentos abaixo para o desenho completo do produto, arquitetura e banco de dados antes de contribuir.

## Documentação

| Documento | Conteúdo |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Guia de convenções e regras de domínio para trabalhar neste repositório |
| [`PRD-app-estoque-de-casa.md`](./PRD-app-estoque-de-casa.md) | Problema, user stories, critérios de aceite e KPIs |
| [`ARQUITETURA-app-estoque-de-casa.md`](./ARQUITETURA-app-estoque-de-casa.md) | Padrão arquitetural, estrutura de diretórios e ADRs |
| [`DATABASE-app-estoque-de-casa.md`](./DATABASE-app-estoque-de-casa.md) | Modelo de dados SQLite, índices, queries críticas e migrações |
| [`FRONTEND-DESIGN-app-estoque-de-casa.md`](./FRONTEND-DESIGN-app-estoque-de-casa.md) | Sistema visual, tokens de tema e componentes |

## Stack

React Native + Expo (EAS development build) · Expo Router · SQLite (`expo-sqlite`) + Drizzle ORM · `react-native-reanimated`

## Status

MVP ainda não implementado — repositório contém apenas a documentação de produto e arquitetura no momento.

## Workflow de branches

Este repositório segue o modelo **Gitflow**:

- `main` — sempre reflete a última versão publicada/estável.
- `develop` — branch de integração, base para novas features.
- `feature/*` — nasce de `develop`, volta para `develop`.
- `release/*` — nasce de `develop`, fecha em `main` e `develop`, gera tag de versão.
- `hotfix/*` — nasce de `main`, fecha em `main` e `develop`.

## Licença

[MIT](./LICENSE)
