import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { categories } from '../data/questions';

export function Categories() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
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

        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-bold text-white mb-4 text-center"
        >
          Escolha uma Categoria
        </motion.h1>

        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white/70 text-center mb-12"
        >
          Selecione seu tema favorito para começar o desafio
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/game/${category.id}`}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`bg-gradient-to-br ${category.color} p-8 rounded-2xl shadow-xl cursor-pointer transition-all`}
                >
                  <div className="text-6xl mb-4 text-center">{category.icon}</div>
                  <h3 className="text-2xl font-bold text-white text-center">
                    {category.name}
                  </h3>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
