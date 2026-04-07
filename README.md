# Quiz multiplayer website (QuizMaster)

Jogo de quiz com modo single-player e multiplayer em tempo real com salas (WebSocket via Socket.IO).

Layout original inspirado no arquivo do Figma:
https://www.figma.com/design/647sgMFCoFrRaUbGr8O8TP/Quiz-multiplayer-website

## Recursos

- Categorias de perguntas (inclui Matemática)
- Salas multiplayer com código (criar/entrar) e lista de jogadores em tempo real
- Início de partida pelo host
- Partida sincronizada: mesma pergunta, tempo e placar em tempo real
- Resultado final sincronizado para todos os jogadores

## Tecnologias

- Front-end: React + Vite + React Router
- UI/estilo: Tailwind CSS + componentes baseados em shadcn/ui
- Tempo real: Socket.IO (cliente e servidor)
- Servidor: Node.js + Express

## Requisitos

- Node.js 20+
- npm

## Como rodar (local)

Instale as dependências:

```bash
npm i
```

Inicie o servidor realtime (porta 3001):

```bash
npm run dev:server
```

Em outro terminal, inicie o front-end (Vite):

```bash
npm run dev
```

Abra no navegador:

- Home: http://localhost:5173/
- Sala multiplayer: http://localhost:5173/room

## Multiplayer (fluxo)

1. Abra `/room` em duas abas (ou em dois computadores).
2. Aba 1: informe o nome e clique em “Criar sala”.
3. Aba 2: informe o nome, cole o código e clique em “Entrar na sala”.
4. O host escolhe a categoria e clica “Começar partida”.

## Testar com amigo usando Tailscale

Você e seu amigo entram na mesma tailnet.

No seu PC (host):

```bash
npm run dev:server
npm run dev -- --host 0.0.0.0
```

No PC do seu amigo, acesse:

```text
http://SEU_IP_TAILSCALE:5173/room
```

Se quiser forçar o endereço do servidor realtime no cliente, use a variável:

- `VITE_SERVER_URL` (ex.: `http://SEU_IP_TAILSCALE:3001`)

## Scripts

- `npm run dev`: inicia o front-end (Vite)
- `npm run build`: build de produção do front-end
- `npm run dev:server`: inicia o servidor realtime (Node/Express/Socket.IO)

## Estrutura do projeto

- `src/app/components`: telas (Home, Categories, Room, Game, Results)
- `src/app/data/questions.ts`: categorias e banco de perguntas
- `server/server.mjs`: servidor realtime (salas, jogo sincronizado, resultados)

## Créditos e atribuições

Veja [ATTRIBUTIONS.md](./ATTRIBUTIONS.md).

## Licença

Este repositório não inclui um arquivo `LICENSE` próprio. Se você for publicar/redistribuir, valide os termos do projeto original do Figma e mantenha as atribuições e licenças de terceiros conforme descrito em [ATTRIBUTIONS.md](./ATTRIBUTIONS.md).
