import { motion } from 'motion/react';

interface PlayerCardProps {
  name: string;
  score: number;
  avatar: string;
  color: string;
  isPlayer?: boolean;
  position?: 'left' | 'right';
}

export function PlayerCard({ name, score, avatar, color, isPlayer, position = 'left' }: PlayerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: position === 'left' ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex ${position === 'right' ? 'flex-row-reverse' : 'flex-row'} items-center gap-3`}
    >
      <div className={`${color} w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg`}>
        {avatar}
      </div>
      <div className={position === 'right' ? 'text-right' : ''}>
        <p className="font-semibold text-white">
          {name} {isPlayer && <span className="text-xs text-green-400">(Você)</span>}
        </p>
        <motion.p
          key={score}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-2xl font-bold text-white"
        >
          {score}
        </motion.p>
      </div>
    </motion.div>
  );
}
