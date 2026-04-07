import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { io, type Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Users } from 'lucide-react';
import { categories, getQuestionsByCategory, type Question } from '../data/questions';

type RoomPlayer = {
  id: string;
  name: string;
  isHost: boolean;
};

type RoomState = {
  roomCode: string;
  started: boolean;
  categoryId: string | null;
  players: RoomPlayer[];
};

function defaultServerUrl() {
  const url = new URL(window.location.href);
  return `${url.protocol}//${url.hostname}:3001`;
}

function createToken() {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof (c as Crypto).randomUUID === 'function') {
    return (c as Crypto).randomUUID();
  }

  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

const SERVER_URL =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_SERVER_URL ??
  defaultServerUrl();

export function Room() {
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const playerToken = useMemo(() => {
    const existing = sessionStorage.getItem('playerToken');
    if (existing) return existing;
    const created = createToken();
    sessionStorage.setItem('playerToken', created);
    return created;
  }, []);

  const [connection, setConnection] = useState<'connecting' | 'connected' | 'disconnected'>(
    'connecting',
  );
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [started, setStarted] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id ?? 'arte');
  const [meId] = useState<string | null>(playerToken);

  const isInRoom = !!roomCode;
  const me = useMemo(() => players.find((p) => p.id === meId) ?? null, [players, meId]);

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    setConnection(socket.connected ? 'connected' : 'connecting');

    const onConnect = () => {
      setConnection('connected');
      setError(null);
    };

    const onDisconnect = () => {
      setConnection('disconnected');
    };

    const onRoomJoined = (state: RoomState) => {
      setRoomCode(state.roomCode);
      setPlayers(state.players);
      setStarted(state.started);
      setError(null);
    };

    const onRoomState = (state: RoomState) => {
      setRoomCode(state.roomCode);
      setPlayers(state.players);
      setStarted(state.started);
    };

    const onRoomStarted = (payload: { roomCode: string; categoryId: string }) => {
      setRoomCode(payload.roomCode);
      setStarted(true);
      navigate(`/game/${payload.categoryId}?room=${encodeURIComponent(payload.roomCode)}`);
    };

    const onRoomError = (payload: { message?: string }) => {
      setError(payload?.message ?? 'Erro ao entrar na sala.');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:joined', onRoomJoined);
    socket.on('room:state', onRoomState);
    socket.on('room:started', onRoomStarted);
    socket.on('room:error', onRoomError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:joined', onRoomJoined);
      socket.off('room:state', onRoomState);
      socket.off('room:started', onRoomStarted);
      socket.off('room:error', onRoomError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [navigate]);

  useEffect(() => {
    if (!roomCode) return;
    const snapshot = {
      roomCode,
      name,
      meId,
      players,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(`roomSnapshot:${roomCode}`, JSON.stringify(snapshot));
  }, [roomCode, name, meId, players]);

  const createRoom = () => {
    const socket = socketRef.current;
    if (!socket) return;
    setError(null);
    sessionStorage.setItem('playerName', name);
    socket.emit('room:create', { name, token: playerToken });
  };

  const joinRoom = () => {
    const socket = socketRef.current;
    if (!socket) return;
    setError(null);
    sessionStorage.setItem('playerName', name);
    socket.emit('room:join', { roomCode: joinCode, name, token: playerToken });
  };

  const leaveRoom = () => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('room:leave');
    if (roomCode) sessionStorage.removeItem(`roomSnapshot:${roomCode}`);
    setRoomCode(null);
    setPlayers([]);
    setStarted(false);
    setError(null);
  };

  const startGame = () => {
    const socket = socketRef.current;
    if (!socket) return;
    setError(null);
    const picked = getQuestionsByCategory(selectedCategoryId, 5);
    const questions = picked.map((q: Question) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));
    socket.emit('room:start', { categoryId: selectedCategoryId, questions });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-white mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </motion.button>
        </Link>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Sala Multiplayer</h1>
              <div className="text-white/70 text-sm">
                Status: {connection === 'connected' ? 'Conectado' : connection === 'connecting' ? 'Conectando…' : 'Desconectado'}
              </div>
            </div>
            <div className="text-white/70 text-sm text-right">
              <div>Servidor: {SERVER_URL}</div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl p-4 mb-6"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {!isInRoom ? (
            <div className="space-y-6">
              <div>
                <label className="text-white/80 text-sm">Seu nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Felipe"
                  className="mt-2 w-full bg-white/10 border border-white/15 text-white rounded-xl px-4 py-3 outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={createRoom}
                  disabled={connection !== 'connected'}
                  className="bg-white text-purple-700 font-bold rounded-xl px-4 py-3 disabled:opacity-50"
                >
                  Criar sala
                </motion.button>

                <div className="space-y-3">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Código da sala (6 chars)"
                    className="w-full bg-white/10 border border-white/15 text-white rounded-xl px-4 py-3 outline-none focus:border-white/30"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={joinRoom}
                    disabled={connection !== 'connected'}
                    className="w-full bg-purple-500 text-white font-bold rounded-xl px-4 py-3 disabled:opacity-50"
                  >
                    Entrar na sala
                  </motion.button>
                </div>
              </div>

            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="text-white">
                  <div className="text-white/70 text-sm">Código da sala</div>
                  <div className="text-3xl font-extrabold tracking-widest">{roomCode}</div>
                  {me && <div className="text-white/70 text-sm mt-1">Você: {me.name}{me.isHost ? ' (host)' : ''}</div>}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={leaveRoom}
                  className="bg-white/10 border border-white/15 text-white rounded-xl px-4 py-3"
                >
                  Sair
                </motion.button>
              </div>

              <div className="bg-white/10 border border-white/15 rounded-2xl p-4 mb-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="text-white">
                    <div className="font-semibold">Partida</div>
                    <div className="text-white/70 text-sm">
                      {started ? 'Em andamento' : 'Aguardando início'}
                    </div>
                  </div>

                  {me?.isHost ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        disabled={started}
                        className="bg-white border border-white/20 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-white/40 disabled:opacity-60"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={startGame}
                        disabled={started || players.length < 2 || connection !== 'connected'}
                        className="bg-white text-purple-700 font-bold rounded-xl px-4 py-3 disabled:opacity-50"
                      >
                        Começar partida
                      </motion.button>
                    </div>
                  ) : (
                    <div className="text-white/70 text-sm">
                      {players.length < 2 ? 'Aguardando mais jogadores…' : 'Aguardando o host iniciar…'}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-white mb-3">
                <Users className="w-5 h-5" />
                <div className="font-semibold">Jogadores ({players.length})</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white/10 border border-white/15 rounded-2xl px-4 py-4 text-white flex items-center justify-between"
                  >
                    <div className="font-semibold">{p.name}</div>
                    {p.isHost && (
                      <div className="text-xs bg-white text-purple-700 font-bold px-2 py-1 rounded-full">
                        HOST
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
