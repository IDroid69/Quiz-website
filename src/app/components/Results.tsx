import { motion } from 'motion/react';
import { useLocation, Link } from 'react-router';
import { Trophy, Home, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

function defaultServerUrl() {
  const url = new URL(window.location.href);
  return `${url.protocol}//${url.hostname}:3001`;
}

const SERVER_URL =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_SERVER_URL ??
  defaultServerUrl();

export function Results() {
  const location = useLocation();
  const state = (location.state ?? {}) as {
    playerScore?: number;
    opponentScore?: number;
    opponent?: { name: string; avatar: string; color: string };
    totalQuestions?: number;
    roomCode?: string | null;
    token?: string | null;
  };

  const initialOpponent = state.opponent ?? { name: 'Oponente', avatar: '👤', color: 'bg-gray-500' };
  const [playerScore, setPlayerScore] = useState(state.playerScore ?? 0);
  const [opponentScore, setOpponentScore] = useState(state.opponentScore ?? 0);
  const [opponent, setOpponent] = useState(initialOpponent);
  const totalQuestions = state.totalQuestions ?? 5;

  const [showConfetti, setShowConfetti] = useState(false);
  const playerWon = playerScore > opponentScore;

  useEffect(() => {
    if (playerWon) {
      setShowConfetti(true);
    }
  }, [playerWon]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomCode = params.get('room') ?? state.roomCode ?? null;
    const token = state.token ?? sessionStorage.getItem('playerToken');
    const name = sessionStorage.getItem('playerName') ?? 'Jogador';
    const scoreToSubmit = state.playerScore ?? 0;
    if (!roomCode || !token) return;

    const socket: Socket = io(SERVER_URL, { transports: ['websocket'] });

    const onConnect = () => {
      socket.emit('room:join', { roomCode, name, token });
      socket.emit('game:submit', { roomCode, token, score: scoreToSubmit });
    };

    const onResults = (payload: { roomCode: string; results: Array<{ token: string; name: string; score: number }> }) => {
      if (payload.roomCode !== roomCode) return;

      const mine = payload.results.find((r) => r.token === token) ?? null;
      const other = payload.results.find((r) => r.token !== token) ?? null;

      if (mine) setPlayerScore(mine.score);
      if (other) {
        setOpponentScore(other.score);
        setOpponent((prev) => ({ ...prev, name: other.name }));
      }
    };

    socket.on('connect', onConnect);
    socket.on('game:results', onResults);

    return () => {
      socket.off('connect', onConnect);
      socket.off('game:results', onResults);
      socket.disconnect();
    };
  }, [location.search, state.roomCode, state.token, state.playerScore]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 text-center"
      >
        {/* Troféu animado */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
            playerWon ? 'bg-yellow-500' : 'bg-gray-500'
          }`}>
            <Trophy className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* Resultado */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-4xl md:text-5xl font-bold mb-4 ${
            playerWon ? 'text-yellow-400' : 'text-white'
          }`}
        >
          {playerWon ? 'Vitória!' : playerScore === opponentScore ? 'Empate!' : 'Derrota'}
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/70 mb-8"
        >
          {playerWon
            ? 'Parabéns! Você dominou este desafio!'
            : playerScore === opponentScore
            ? 'Foi por pouco! Que tal um desempate?'
            : 'Não desanime! Tente novamente!'}
        </motion.p>

        {/* Placar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center items-center gap-8 mb-8"
        >
          <div className="text-center">
            <p className="text-white/70 text-sm mb-2">Você</p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="text-5xl font-bold text-blue-400"
            >
              {playerScore}
            </motion.div>
            <div className="text-2xl mt-2">😊</div>
          </div>

          <div className="text-4xl text-white/50">VS</div>

          <div className="text-center">
            <p className="text-white/70 text-sm mb-2">{opponent.name}</p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
              className="text-5xl font-bold text-purple-400"
            >
              {opponentScore}
            </motion.div>
            <div className="text-2xl mt-2">{opponent.avatar}</div>
          </div>
        </motion.div>

        {/* Estatísticas */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 rounded-2xl p-6 mb-8"
        >
          <div className="grid grid-cols-3 gap-4 text-white">
            <div>
              <p className="text-white/70 text-sm mb-1">Perguntas</p>
              <p className="text-2xl font-bold">{totalQuestions}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Acertos</p>
              <p className="text-2xl font-bold">
                {Math.floor(playerScore / 100)}
              </p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Precisão</p>
              <p className="text-2xl font-bold">
                {Math.floor((playerScore / 100 / totalQuestions) * 100)}%
              </p>
            </div>
          </div>
        </motion.div>

        {/* Botões */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/categories">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Jogar Novamente
            </motion.button>
          </Link>

          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-semibold transition-colors"
            >
              <Home className="w-5 h-5" />
              Menu Principal
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Confetti effect usando CSS */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * window.innerWidth,
                y: -20,
                rotate: 0,
              }}
              animate={{
                y: window.innerHeight + 20,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: Math.random() * 2 + 2,
                delay: Math.random() * 0.5,
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ['#fbbf24', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6'][
                  Math.floor(Math.random() * 5)
                ],
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
