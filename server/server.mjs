import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function sanitizeName(name) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 24);
}

function sanitizeToken(token) {
  const t = String(token ?? '').trim();
  if (!t) return null;
  return t.slice(0, 128);
}

function sanitizeQuestions(questions) {
  if (!Array.isArray(questions)) return null;
  const normalized = [];
  for (const q of questions) {
    const id = String(q?.id ?? '').trim();
    const question = String(q?.question ?? '').trim();
    const options = Array.isArray(q?.options) ? q.options.map((o) => String(o ?? '').trim()) : null;
    const correctAnswer = Number(q?.correctAnswer ?? NaN);

    if (!id || !question || !options || options.length < 2) return null;
    if (options.some((o) => !o)) return null;
    if (Number.isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) return null;

    normalized.push({ id, question, options, correctAnswer });
  }

  if (normalized.length === 0) return null;
  return normalized.slice(0, 20);
}

const rooms = new Map();
const socketToRoom = new Map();
const socketToToken = new Map();

function getRoomState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  return {
    roomCode,
    started: !!room.startedAt,
    categoryId: room.categoryId ?? null,
    players: Array.from(room.players.values()).map((p) => ({
      id: p.token,
      name: p.name,
      isHost: p.isHost,
    })),
  };
}

function broadcastRoom(roomCode) {
  const state = getRoomState(roomCode);
  if (!state) return;
  io.to(roomCode).emit('room:state', state);
}

function getConnectedTokens(room) {
  return Array.from(room.players.values())
    .filter((p) => p.socketId)
    .map((p) => p.token);
}

function getGameState(room) {
  if (!room.game) return null;

  const question = room.game.questions[room.game.questionIndex] ?? null;
  const scores = Array.from(room.players.values()).map((p) => ({
    id: p.token,
    name: p.name,
    score: room.game.scores.get(p.token) ?? 0,
  }));

  const base = {
    roomCode: room.roomCode,
    categoryId: room.categoryId ?? null,
    phase: room.game.phase,
    questionIndex: room.game.questionIndex,
    totalQuestions: room.game.questions.length,
    scores,
    questionEndsAt: room.game.questionEndsAt,
    revealEndsAt: room.game.revealEndsAt,
  };

  if (!question) {
    return { ...base, question: null, correctAnswer: null };
  }

  const safeQuestion = { id: question.id, question: question.question, options: question.options };
  const includeCorrect = room.game.phase !== 'question';
  return { ...base, question: safeQuestion, correctAnswer: includeCorrect ? question.correctAnswer : null };
}

function emitGameState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || !room.game) return;
  const state = getGameState(room);
  if (!state) return;
  io.to(roomCode).emit('game:state', state);
}

function clearGameTimers(room) {
  if (!room.game) return;
  if (room.game.questionTimeoutId) clearTimeout(room.game.questionTimeoutId);
  if (room.game.revealTimeoutId) clearTimeout(room.game.revealTimeoutId);
  room.game.questionTimeoutId = null;
  room.game.revealTimeoutId = null;
}

function finishGame(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || !room.game) return;
  clearGameTimers(room);
  room.game.phase = 'finished';
  room.game.questionEndsAt = null;
  room.game.revealEndsAt = null;

  room.results = new Map(
    Array.from(room.players.values()).map((p) => [
      p.token,
      { token: p.token, name: p.name, score: room.game.scores.get(p.token) ?? 0 },
    ]),
  );

  emitGameState(roomCode);
  io.to(roomCode).emit('game:results', { roomCode, results: Array.from(room.results.values()) });
}

function startReveal(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || !room.game) return;
  clearGameTimers(room);
  room.game.phase = 'reveal';
  room.game.questionEndsAt = null;
  room.game.revealEndsAt = Date.now() + room.game.revealDurationMs;
  emitGameState(roomCode);

  room.game.revealTimeoutId = setTimeout(() => {
    const r = rooms.get(roomCode);
    if (!r || !r.game) return;
    r.game.questionIndex += 1;
    if (r.game.questionIndex >= r.game.questions.length) {
      finishGame(roomCode);
      return;
    }
    startQuestion(roomCode);
  }, room.game.revealDurationMs);
}

function startQuestion(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || !room.game) return;
  clearGameTimers(room);

  room.game.phase = 'question';
  room.game.answers = new Map();
  room.game.questionEndsAt = Date.now() + room.game.questionDurationMs;
  room.game.revealEndsAt = null;
  emitGameState(roomCode);

  room.game.questionTimeoutId = setTimeout(() => {
    startReveal(roomCode);
  }, room.game.questionDurationMs);
}

function leaveRoom(socket, options = {}) {
  const explicit = options.explicit === true;
  const roomCode = socketToRoom.get(socket.id);
  const token = socketToToken.get(socket.id);
  if (!roomCode) return;

  const room = rooms.get(roomCode);
  socketToRoom.delete(socket.id);
  socketToToken.delete(socket.id);
  socket.leave(roomCode);

  if (!room) return;
  if (token) {
    const player = room.players.get(token);
    if (player?.socketId === socket.id) {
      if (!explicit && room.startedAt) {
        player.socketId = null;
      } else {
        room.players.delete(token);
      }
    }
  }

  if (room.players.size === 0) {
    if (room.game) {
      clearGameTimers(room);
      room.game = null;
    }
    if (room.startedAt) {
      if (!room.cleanupTimeoutId) {
        room.cleanupTimeoutId = setTimeout(() => {
          rooms.delete(roomCode);
        }, 10 * 60 * 1000);
      }
    } else {
      rooms.delete(roomCode);
    }
    return;
  }

  const hostStillThere = Array.from(room.players.values()).some((p) => p.isHost);
  if (!hostStillThere) {
    const first = Array.from(room.players.values()).sort((a, b) => a.joinedAt - b.joinedAt)[0];
    if (first) first.isHost = true;
  }

  broadcastRoom(roomCode);
}

io.on('connection', (socket) => {
  socket.emit('server:ready', { socketId: socket.id });

  socket.on('room:create', (payload = {}) => {
    leaveRoom(socket, { explicit: true });

    const name = sanitizeName(payload.name);
    const token = sanitizeToken(payload.token);
    if (!name) {
      socket.emit('room:error', { message: 'Nome inválido.' });
      return;
    }
    if (!token) {
      socket.emit('room:error', { message: 'Sessão inválida.' });
      return;
    }

    let roomCode = generateRoomCode();
    while (rooms.has(roomCode)) roomCode = generateRoomCode();

    const room = {
      roomCode,
      createdAt: Date.now(),
      startedAt: null,
      categoryId: null,
      players: new Map(),
      results: new Map(),
      cleanupTimeoutId: null,
      game: null,
    };

    const player = {
      token,
      socketId: socket.id,
      name,
      isHost: true,
      joinedAt: Date.now(),
    };

    room.players.set(token, player);
    rooms.set(roomCode, room);
    socketToRoom.set(socket.id, roomCode);
    socketToToken.set(socket.id, token);
    socket.join(roomCode);

    socket.emit('room:joined', getRoomState(roomCode));
    broadcastRoom(roomCode);
  });

  socket.on('room:join', (payload = {}) => {
    leaveRoom(socket, { explicit: true });

    const name = sanitizeName(payload.name);
    const token = sanitizeToken(payload.token);
    const roomCode = String(payload.roomCode ?? '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    if (!name) {
      socket.emit('room:error', { message: 'Nome inválido.' });
      return;
    }
    if (!token) {
      socket.emit('room:error', { message: 'Sessão inválida.' });
      return;
    }

    if (!roomCode || roomCode.length !== 6) {
      socket.emit('room:error', { message: 'Código da sala inválido.' });
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('room:error', { message: 'Sala não encontrada.' });
      return;
    }

    if (room.startedAt && !room.players.has(token)) {
      socket.emit('room:error', { message: 'A partida já começou.' });
      return;
    }

    const existing = room.players.get(token);
    const player = existing
      ? { ...existing, socketId: socket.id, name }
      : {
          token,
          socketId: socket.id,
          name,
          isHost: room.players.size === 0,
          joinedAt: Date.now(),
        };

    room.players.set(token, player);
    if (room.cleanupTimeoutId) {
      clearTimeout(room.cleanupTimeoutId);
      room.cleanupTimeoutId = null;
    }
    socketToRoom.set(socket.id, roomCode);
    socketToToken.set(socket.id, token);
    socket.join(roomCode);

    socket.emit('room:joined', getRoomState(roomCode));
    broadcastRoom(roomCode);

    if (room.game) {
      const gameState = getGameState(room);
      if (gameState) socket.emit('game:state', gameState);
    }
  });

  socket.on('room:start', (payload = {}) => {
    const roomCode = socketToRoom.get(socket.id);
    const token = socketToToken.get(socket.id);
    if (!roomCode) {
      socket.emit('room:error', { message: 'Você não está em uma sala.' });
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('room:error', { message: 'Sala não encontrada.' });
      return;
    }

    if (!token) {
      socket.emit('room:error', { message: 'Sessão inválida.' });
      return;
    }

    const me = room.players.get(token);
    if (!me || !me.isHost) {
      socket.emit('room:error', { message: 'Somente o host pode iniciar.' });
      return;
    }

    if (room.players.size < 2) {
      socket.emit('room:error', { message: 'Precisa de pelo menos 2 jogadores.' });
      return;
    }

    if (room.startedAt) {
      socket.emit('room:error', { message: 'A partida já começou.' });
      return;
    }

    const categoryId = String(payload.categoryId ?? '').trim();
    const questions = sanitizeQuestions(payload.questions);
    if (!categoryId) {
      socket.emit('room:error', { message: 'Categoria inválida.' });
      return;
    }
    if (!questions) {
      socket.emit('room:error', { message: 'Perguntas inválidas.' });
      return;
    }

    room.startedAt = Date.now();
    room.categoryId = categoryId;
    room.results = new Map();
    room.game = {
      phase: 'question',
      questionIndex: 0,
      questions,
      questionDurationMs: 10_000,
      revealDurationMs: 1_500,
      questionEndsAt: null,
      revealEndsAt: null,
      answers: new Map(),
      scores: new Map(Array.from(room.players.keys()).map((t) => [t, 0])),
      questionTimeoutId: null,
      revealTimeoutId: null,
    };

    io.to(roomCode).emit('room:started', { roomCode, categoryId });
    broadcastRoom(roomCode);
    startQuestion(roomCode);
  });

  socket.on('game:answer', (payload = {}) => {
    const roomCode = String(payload.roomCode ?? '').trim().toUpperCase();
    const token = sanitizeToken(payload.token);
    const questionIndex = Number(payload.questionIndex ?? NaN);
    const answerIndex = Number(payload.answerIndex ?? NaN);

    if (!roomCode || !token || Number.isNaN(questionIndex) || Number.isNaN(answerIndex)) {
      socket.emit('room:error', { message: 'Dados inválidos.' });
      return;
    }

    const room = rooms.get(roomCode);
    if (!room || !room.game) {
      socket.emit('room:error', { message: 'Partida não encontrada.' });
      return;
    }

    if (room.game.phase !== 'question') return;
    if (room.game.questionIndex !== questionIndex) return;

    const player = room.players.get(token);
    if (!player) {
      socket.emit('room:error', { message: 'Jogador não está na sala.' });
      return;
    }

    if (room.game.answers.has(token)) return;

    const question = room.game.questions[questionIndex];
    if (!question) return;
    if (answerIndex < 0 || answerIndex >= question.options.length) return;

    const now = Date.now();
    const endsAt = room.game.questionEndsAt ?? 0;
    if (now > endsAt) return;

    room.game.answers.set(token, { answerIndex, answeredAt: now });

    if (answerIndex === question.correctAnswer) {
      const timeLeftSeconds = Math.max(0, Math.ceil((endsAt - now) / 1000));
      const points = timeLeftSeconds * 10 + 100;
      room.game.scores.set(token, (room.game.scores.get(token) ?? 0) + points);
    }

    emitGameState(roomCode);

    const connected = getConnectedTokens(room);
    const answeredCount = connected.filter((t) => room.game.answers.has(t)).length;
    if (connected.length > 0 && answeredCount >= connected.length) {
      startReveal(roomCode);
    }
  });

  socket.on('game:submit', (payload = {}) => {
    const roomCode = String(payload.roomCode ?? '').trim().toUpperCase();
    const token = sanitizeToken(payload.token);
    const score = Number(payload.score ?? NaN);

    if (!roomCode || !token || Number.isNaN(score) || score < 0) {
      socket.emit('room:error', { message: 'Dados inválidos.' });
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('room:error', { message: 'Sala não encontrada.' });
      return;
    }

    const player = room.players.get(token);
    if (!player) {
      socket.emit('room:error', { message: 'Jogador não está na sala.' });
      return;
    }

    room.results.set(token, { token, name: player.name, score });

    io.to(roomCode).emit('game:results', {
      roomCode,
      results: Array.from(room.results.values()),
    });
  });

  socket.on('room:leave', () => {
    leaveRoom(socket, { explicit: true });
  });

  socket.on('disconnect', () => {
    leaveRoom(socket, { explicit: false });
  });
});

const port = Number(process.env.PORT ?? 3001);
server.listen(port, () => {
  console.log(`Realtime server on http://localhost:${port}`);
});
