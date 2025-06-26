# allInOne-Converter

Este repositório contém duas implementações do conversor: uma em React (com MUI) e outra em Angular (última versão, com SSR e CSS customizável).

## Estrutura

- `src/` — Projeto original em React + MUI
- `angular/app/` — Novo projeto Angular (SSR, zoneless, standalone)

---

## Como rodar o projeto React

1. Acesse a pasta raiz do projeto (`web`).
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Rode o projeto:
   ```bash
   npm run dev
   ```
4. Acesse em `http://localhost:5173` (ou porta configurada pelo Vite).

---

## Como rodar o projeto Angular

1. Acesse a pasta do Angular:
   ```bash
   cd angular/app
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Rode o projeto (SSR):
   ```bash
   npm run dev:ssr
   ```
4. Acesse em `http://localhost:4200`.

---

## Diferenças e Observações

- O projeto Angular foi criado com as melhores práticas atuais (SSR, zoneless, standalone, CSS puro).
- O CSS customizado pode ser adaptado facilmente em `src/styles.css` e `src/app/app.css`.
- O projeto React permanece intacto e pode ser usado normalmente.
- Para migrar componentes, adapte a lógica e o CSS dos componentes React para Angular, utilizando os arquivos de estilo do Angular.

---

## Contato

Dúvidas ou sugestões? Fique à vontade para abrir uma issue ou contribuir!
