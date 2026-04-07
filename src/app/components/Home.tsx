import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Zap, Trophy, Users } from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="inline-block mb-6"
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <Zap className="w-16 h-16 text-red-500" strokeWidth={3} />
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-6xl font-bold text-white mb-4"
        >
          QuizMaster
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-white/90 mb-12 max-w-md mx-auto"
        >
          Desafie seus amigos em batalhas de conhecimento!
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/categories">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-red-500 px-12 py-4 rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transition-shadow"
              >
                Jogar Agora
              </motion.button>
            </Link>
            <Link to="/room">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/15 text-white border border-white/25 px-10 py-4 rounded-full text-xl font-bold shadow-2xl hover:bg-white/20 transition-colors"
              >
                Sala Multiplayer
              </motion.button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 flex justify-center gap-8 text-white"
        >
          <div className="text-center">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Multiplayer</p>
          </div>
          <div className="text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Ranqueado</p>
          </div>
          <div className="text-center">
            <Zap className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Tempo Real</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
