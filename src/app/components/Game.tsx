import { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { getQuestionsByCategory, getRandomOpponent, Question } from '../data/questions';
import { PlayerCard } from './PlayerCard';
import { Timer, Trophy } from 'lucide-react';
import { io, type Socket } from 'socket.io-client';

type Opponent = {
  name: string;
  avatar: string;
  color: string;
};

type MultiplayerScore = {
  id: string;
  name: string;
  score: number;
};

type MultiplayerQuestion = {
  id: string;
  question: string;
  options: string[];
};

type MultiplayerGameState = {
  roomCode: string;
  categoryId: string | null;
  phase: 'question' | 'reveal' | 'finished';
  questionIndex: number;
  totalQuestions: number;
  question: MultiplayerQuestion | null;
  correctAnswer: number | null;
  questionEndsAt: number | null;
  revealEndsAt: number | null;
  scores: MultiplayerScore[];
};

function defaultServerUrl() {
  const url = new URL(window.location.href);
  return `${url.protocol}//${url.hostname}:3001`;
}

const SERVER_URL =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_SERVER_URL ??
  defaultServerUrl();

function colorForName(name: string) {
  const colors = [
    'bg-purple-500',
    'bg-pink-500',
    'bg-emerald-500',
    'bg-indigo-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-rose-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % colors.length;
  return colors[idx];
}

function avatarForName(name: string) {
  const trimmed = name.trim();
  const first = trimmed[0]?.toUpperCase();
  return first ? first : '👤';
}

export function Game() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const roomCode = useMemo(() => new URLSearchParams(location.search).get('room'), [location.search]);
  const isMultiplayer = !!roomCode;
  const token = useMemo(() => sessionStorage.getItem('playerToken'), []);
  const playerName = useMemo(() => sessionStorage.getItem('playerName') ?? 'Você', []);
  const socketRef = useRef<Socket | null>(null);
  const [mpState, setMpState] = useState<MultiplayerGameState | null>(null);
  const [mpSelectedAnswer, setMpSelectedAnswer] = useState<number | null>(null);
  const [mpTimeLeft, setMpTimeLeft] = useState(10);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [opponent, setOpponent] = useState<Opponent>(() => getRandomOpponent());
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    if (!isMultiplayer || !roomCode || !token) return;

    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    const onConnect = () => {
      socket.emit('room:join', { roomCode, name: playerName, token });
    };

    const onGameState = (state: MultiplayerGameState) => {
      if (state.roomCode !== roomCode) return;
      setMpState(state);
    };

    socket.on('connect', onConnect);
    socket.on('game:state', onGameState);

    return () => {
      socket.off('connect', onConnect);
      socket.off('game:state', onGameState);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isMultiplayer, roomCode, token, playerName]);

  useEffect(() => {
    if (!isMultiplayer) return;
    setMpSelectedAnswer(null);
  }, [isMultiplayer, mpState?.questionIndex]);

  useEffect(() => {
    if (!isMultiplayer || !mpState) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const endsAt =
        mpState.phase === 'question'
          ? mpState.questionEndsAt ?? now
          : mpState.revealEndsAt ?? mpState.questionEndsAt ?? now;
      const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000));
      setMpTimeLeft(seconds);
    }, 150);
    return () => clearInterval(interval);
  }, [isMultiplayer, mpState]);

  useEffect(() => {
    if (!isMultiplayer || !mpState || !roomCode || !token) return;
    if (mpState.phase !== 'finished') return;

    const myScore = mpState.scores.find((s) => s.id === token)?.score ?? 0;
    const other = mpState.scores.find((s) => s.id !== token) ?? null;
    const opponentForResults = other
      ? { name: other.name, avatar: avatarForName(other.name), color: colorForName(other.name) }
      : { name: 'Oponente', avatar: '👤', color: 'bg-gray-500' };

    navigate(`/results?room=${encodeURIComponent(roomCode)}`, {
      state: {
        playerScore: myScore,
        opponentScore: other?.score ?? 0,
        opponent: opponentForResults,
        totalQuestions: mpState.totalQuestions,
        roomCode,
        token,
      },
    });
  }, [isMultiplayer, mpState, roomCode, token, navigate]);

  useEffect(() => {
    if (!categoryId || isMultiplayer) return;
      const categoryQuestions = getQuestionsByCategory(categoryId, 5);
      setQuestions(categoryQuestions);
  }, [categoryId, isMultiplayer]);

  useEffect(() => {
    if (!roomCode || isMultiplayer) return;

    const raw = sessionStorage.getItem(`roomSnapshot:${roomCode}`);
    if (!raw) return;

    const snapshot = JSON.parse(raw) as {
      roomCode: string;
      meId: string | null;
      players: Array<{ id: string; name: string }>;
    };

    const meId = snapshot.meId;
    const opponentPlayer = snapshot.players.find((p) => (meId ? p.id !== meId : true));
    if (!opponentPlayer) return;

    setOpponent({
      name: opponentPlayer.name,
      avatar: avatarForName(opponentPlayer.name),
      color: colorForName(opponentPlayer.name),
    });
    setOpponentScore(0);
  }, [roomCode, isMultiplayer]);

  useEffect(() => {
    if (isMultiplayer) return;
    if (showResult || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, showResult, questions.length]);

  const handleTimeUp = () => {
    if (isMultiplayer) return;
    if (isAnswering) return;
    setIsAnswering(true);
    
    if (!isMultiplayer) {
      const opponentAnswered = Math.random() > 0.3;
      if (opponentAnswered) {
        setOpponentScore((prev) => prev + 100);
      }
    }

    setShowResult(true);
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const handleAnswer = (answerIndex: number) => {
    if (isMultiplayer) return;
    if (selectedAnswer !== null || isAnswering) return;
    
    setIsAnswering(true);
    setSelectedAnswer(answerIndex);
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      const points = Math.floor(timeLeft * 10) + 100;
      setPlayerScore((prev) => prev + points);
    }

    if (!isMultiplayer) {
      setTimeout(() => {
        const opponentAnswers = Math.random() > 0.3;
        if (opponentAnswers) {
          const opponentCorrect = Math.random() > 0.3;
          if (opponentCorrect) {
            const opponentPoints = Math.floor(Math.random() * 50) + 100;
            setOpponentScore((prev) => prev + opponentPoints);
          }
        }
        setShowResult(true);
      }, 500);
    } else {
      setShowResult(true);
    }

    setTimeout(() => {
      nextQuestion();
    }, isMultiplayer ? 1500 : 2500);
  };

  const nextQuestion = () => {
    if (isMultiplayer) return;
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(10);
      setIsAnswering(false);
    } else {
      const token = sessionStorage.getItem('playerToken');
      navigate(roomCode ? `/results?room=${encodeURIComponent(roomCode)}` : '/results', {
        state: {
          playerScore,
          opponentScore,
          opponent,
          totalQuestions: questions.length,
          roomCode: roomCode ?? null,
          token: token ?? null,
        },
      });
    }
  };

  if (isMultiplayer) {
    if (!mpState || !mpState.question) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
          <p className="text-white text-xl">Carregando...</p>
        </div>
      );
    }

    const myScore = token ? mpState.scores.find((s) => s.id === token)?.score ?? 0 : 0;
    const other = token ? mpState.scores.find((s) => s.id !== token) ?? null : null;
    const mpOpponent = other
      ? { name: other.name, avatar: avatarForName(other.name), color: colorForName(other.name) }
      : { name: 'Oponente', avatar: '👤', color: 'bg-gray-500' };
    const progressPercentage = ((mpState.questionIndex + 1) / mpState.totalQuestions) * 100;
    const showResult = mpState.phase !== 'question';
    const correctAnswer = mpState.correctAnswer ?? -1;
    const currentQuestion = mpState.question;

    const submitAnswer = (answerIndex: number) => {
      if (mpSelectedAnswer !== null) return;
      if (mpState.phase !== 'question') return;
      setMpSelectedAnswer(answerIndex);
      const socket = socketRef.current;
      if (!socket || !roomCode || !token) return;
      socket.emit('game:answer', { roomCode, token, questionIndex: mpState.questionIndex, answerIndex });
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-3xl mx-auto py-4">
          <div className="flex justify-between items-start mb-8">
            <PlayerCard
              name={playerName}
              score={myScore}
              avatar="😊"
              color="bg-blue-500"
              isPlayer
              position="left"
            />
            
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-5 h-5 text-white" />
                <motion.div
                  key={mpTimeLeft}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className={`text-2xl font-bold ${mpTimeLeft <= 3 ? 'text-red-400' : 'text-white'}`}
                >
                  {mpTimeLeft}
                </motion.div>
              </div>
              <div className="text-white/70 text-sm">
                {mpState.questionIndex + 1} / {mpState.totalQuestions}
              </div>
            </div>

            <PlayerCard
              name={mpOpponent.name}
              score={other?.score ?? 0}
              avatar={mpOpponent.avatar}
              color={mpOpponent.color}
              position="right"
            />
          </div>

          <div className="w-full h-2 bg-white/20 rounded-full mb-6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mpState.questionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-6"
            >
              <h2 className="text-2xl font-bold text-white text-center mb-8">
                {currentQuestion.question}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = mpSelectedAnswer === index;
                  const isCorrect = index === correctAnswer;
                  const showCorrect = showResult && isCorrect;
                  const showWrong = showResult && isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={index}
                      whileHover={mpSelectedAnswer === null && mpState.phase === 'question' ? { scale: 1.02 } : {}}
                      whileTap={mpSelectedAnswer === null && mpState.phase === 'question' ? { scale: 0.98 } : {}}
                      onClick={() => submitAnswer(index)}
                      disabled={mpSelectedAnswer !== null || mpState.phase !== 'question'}
                      className={`p-4 rounded-xl text-left font-semibold transition-all ${
                        showCorrect
                          ? 'bg-green-500 text-white'
                          : showWrong
                          ? 'bg-red-500 text-white'
                          : isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <span className="inline-block w-8 h-8 rounded-full bg-white/20 text-center leading-8 mr-3">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {showResult && mpSelectedAnswer !== null && correctAnswer >= 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center"
              >
                {mpSelectedAnswer === correctAnswer ? (
                  <div className="text-green-400 text-xl font-bold flex items-center justify-center gap-2">
                    <Trophy className="w-6 h-6" />
                    Correto!
                  </div>
                ) : (
                  <div className="text-red-400 text-xl font-bold">
                    Ops! A resposta certa era: {currentQuestion.options[correctAnswer]}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <p className="text-white text-xl">Carregando...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-3xl mx-auto py-4">
        {/* Header com jogadores */}
        <div className="flex justify-between items-start mb-8">
          <PlayerCard
            name="Você"
            score={playerScore}
            avatar="😊"
            color="bg-blue-500"
            isPlayer
            position="left"
          />
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-5 h-5 text-white" />
              <motion.div
                key={timeLeft}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className={`text-2xl font-bold ${timeLeft <= 3 ? 'text-red-400' : 'text-white'}`}
              >
                {timeLeft}
              </motion.div>
            </div>
            <div className="text-white/70 text-sm">
              {currentQuestionIndex + 1} / {questions.length}
            </div>
          </div>

          <PlayerCard
            name={opponent.name}
            score={opponentScore}
            avatar={opponent.avatar}
            color={opponent.color}
            position="right"
          />
        </div>

        {/* Barra de progresso */}
        <div className="w-full h-2 bg-white/20 rounded-full mb-6 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>

        {/* Pergunta */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-6"
          >
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              {currentQuestion.question}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={index}
                    whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                    whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={`p-4 rounded-xl text-left font-semibold transition-all ${
                      showCorrect
                        ? 'bg-green-500 text-white'
                        : showWrong
                        ? 'bg-red-500 text-white'
                        : isSelected
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <span className="inline-block w-8 h-8 rounded-full bg-white/20 text-center leading-8 mr-3">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Feedback visual */}
        <AnimatePresence>
          {showResult && selectedAnswer !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <div className="text-green-400 text-xl font-bold flex items-center justify-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Correto! +{Math.floor(timeLeft * 10) + 100} pontos
                </div>
              ) : (
                <div className="text-red-400 text-xl font-bold">
                  Ops! A resposta certa era: {currentQuestion.options[currentQuestion.correctAnswer]}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
