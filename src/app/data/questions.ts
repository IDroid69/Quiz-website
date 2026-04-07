export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  image?: string;
}

export const categories = [
  { id: 'arte', name: 'Arte', icon: '🎨', color: 'from-purple-500 to-pink-500' },
  { id: 'ciencia', name: 'Ciência', icon: '🔬', color: 'from-blue-500 to-cyan-500' },
  { id: 'historia', name: 'História', icon: '📚', color: 'from-amber-500 to-orange-500' },
  { id: 'geografia', name: 'Geografia', icon: '🌍', color: 'from-green-500 to-emerald-500' },
  { id: 'esportes', name: 'Esportes', icon: '⚽', color: 'from-red-500 to-rose-500' },
  { id: 'entretenimento', name: 'Entretenimento', icon: '🎬', color: 'from-indigo-500 to-purple-500' },
  { id: 'matematica', name: 'Matemática', icon: '➗', color: 'from-sky-500 to-blue-600' },
];

export const questions: Question[] = [
  // Arte
  {
    id: '1',
    category: 'arte',
    question: 'Quem pintou a Mona Lisa?',
    options: ['Leonardo da Vinci', 'Van Gogh', 'Gauguin', 'Matisse'],
    correctAnswer: 0,
  },
  {
    id: '2',
    category: 'arte',
    question: 'Qual movimento artístico Pablo Picasso ajudou a fundar?',
    options: ['Impressionismo', 'Cubismo', 'Surrealismo', 'Expressionismo'],
    correctAnswer: 1,
  },
  {
    id: '3',
    category: 'arte',
    question: 'Qual artista cortou a própria orelha?',
    options: ['Monet', 'Renoir', 'Van Gogh', 'Degas'],
    correctAnswer: 2,
  },
  {
    id: '4',
    category: 'arte',
    question: 'Onde está localizado o quadro "A Última Ceia"?',
    options: ['Louvre, Paris', 'Uffizi, Florença', 'Convento Santa Maria, Milão', 'Vaticano, Roma'],
    correctAnswer: 2,
  },
  {
    id: '5',
    category: 'arte',
    question: 'Quem pintou "A Noite Estrelada"?',
    options: ['Van Gogh', 'Monet', 'Renoir', 'Cézanne'],
    correctAnswer: 0,
  },
  
  // Ciência
  {
    id: '6',
    category: 'ciencia',
    question: 'Qual é o planeta mais próximo do Sol?',
    options: ['Vênus', 'Mercúrio', 'Marte', 'Terra'],
    correctAnswer: 1,
  },
  {
    id: '7',
    category: 'ciencia',
    question: 'Qual é a velocidade da luz?',
    options: ['300.000 km/s', '150.000 km/s', '450.000 km/s', '200.000 km/s'],
    correctAnswer: 0,
  },
  {
    id: '8',
    category: 'ciencia',
    question: 'Quantos ossos tem o corpo humano adulto?',
    options: ['186', '206', '226', '246'],
    correctAnswer: 1,
  },
  {
    id: '9',
    category: 'ciencia',
    question: 'Qual é o maior órgão do corpo humano?',
    options: ['Fígado', 'Pulmão', 'Pele', 'Intestino'],
    correctAnswer: 2,
  },
  {
    id: '10',
    category: 'ciencia',
    question: 'Quem desenvolveu a teoria da relatividade?',
    options: ['Newton', 'Einstein', 'Galileu', 'Hawking'],
    correctAnswer: 1,
  },
  
  // História
  {
    id: '11',
    category: 'historia',
    question: 'Em que ano foi descoberto o Brasil?',
    options: ['1492', '1500', '1502', '1498'],
    correctAnswer: 1,
  },
  {
    id: '12',
    category: 'historia',
    question: 'Quem foi o primeiro presidente do Brasil?',
    options: ['Dom Pedro II', 'Getúlio Vargas', 'Deodoro da Fonseca', 'Prudente de Morais'],
    correctAnswer: 2,
  },
  {
    id: '13',
    category: 'historia',
    question: 'Em que ano caiu o Muro de Berlim?',
    options: ['1987', '1989', '1991', '1985'],
    correctAnswer: 1,
  },
  {
    id: '14',
    category: 'historia',
    question: 'Qual civilização construiu Machu Picchu?',
    options: ['Astecas', 'Maias', 'Incas', 'Olmecas'],
    correctAnswer: 2,
  },
  {
    id: '15',
    category: 'historia',
    question: 'Em que ano ocorreu a Independência do Brasil?',
    options: ['1822', '1889', '1500', '1808'],
    correctAnswer: 0,
  },
  
  // Geografia
  {
    id: '16',
    category: 'geografia',
    question: 'Qual é o maior país do mundo?',
    options: ['Canadá', 'China', 'Rússia', 'Estados Unidos'],
    correctAnswer: 2,
  },
  {
    id: '17',
    category: 'geografia',
    question: 'Qual é a capital da Austrália?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    correctAnswer: 2,
  },
  {
    id: '18',
    category: 'geografia',
    question: 'Qual é o rio mais extenso do mundo?',
    options: ['Nilo', 'Amazonas', 'Yangtzé', 'Mississippi'],
    correctAnswer: 1,
  },
  {
    id: '19',
    category: 'geografia',
    question: 'Em qual continente fica o Egito?',
    options: ['Ásia', 'África', 'Europa', 'Oriente Médio'],
    correctAnswer: 1,
  },
  {
    id: '20',
    category: 'geografia',
    question: 'Qual é o oceano mais profundo?',
    options: ['Atlântico', 'Índico', 'Pacífico', 'Ártico'],
    correctAnswer: 2,
  },
  
  // Esportes
  {
    id: '21',
    category: 'esportes',
    question: 'Quantos jogadores tem um time de futebol em campo?',
    options: ['9', '10', '11', '12'],
    correctAnswer: 2,
  },
  {
    id: '22',
    category: 'esportes',
    question: 'Onde foram realizados os Jogos Olímpicos de 2016?',
    options: ['Londres', 'Rio de Janeiro', 'Tóquio', 'Pequim'],
    correctAnswer: 1,
  },
  {
    id: '23',
    category: 'esportes',
    question: 'Qual país ganhou mais Copas do Mundo?',
    options: ['Argentina', 'Alemanha', 'Brasil', 'Itália'],
    correctAnswer: 2,
  },
  {
    id: '24',
    category: 'esportes',
    question: 'Quantos pontos vale um touchdown no futebol americano?',
    options: ['3', '6', '7', '5'],
    correctAnswer: 1,
  },
  {
    id: '25',
    category: 'esportes',
    question: 'Em que esporte Ayrton Senna se destacou?',
    options: ['Fórmula 1', 'MotoGP', 'Rally', 'NASCAR'],
    correctAnswer: 0,
  },
  
  // Entretenimento
  {
    id: '26',
    category: 'entretenimento',
    question: 'Qual filme ganhou o Oscar de Melhor Filme em 1998?',
    options: ['Titanic', 'Gladiador', 'Matrix', 'Forrest Gump'],
    correctAnswer: 0,
  },
  {
    id: '27',
    category: 'entretenimento',
    question: 'Quem interpretou Jack Sparrow em Piratas do Caribe?',
    options: ['Orlando Bloom', 'Johnny Depp', 'Brad Pitt', 'Tom Cruise'],
    correctAnswer: 1,
  },
  {
    id: '28',
    category: 'entretenimento',
    question: 'Qual banda lançou a música "Bohemian Rhapsody"?',
    options: ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd'],
    correctAnswer: 1,
  },
  {
    id: '29',
    category: 'entretenimento',
    question: 'Qual série de TV se passa em Westeros?',
    options: ['The Witcher', 'Vikings', 'Game of Thrones', 'The Last Kingdom'],
    correctAnswer: 2,
  },
  {
    id: '30',
    category: 'entretenimento',
    question: 'Quem é o criador de "O Senhor dos Anéis"?',
    options: ['J.K. Rowling', 'George R.R. Martin', 'J.R.R. Tolkien', 'C.S. Lewis'],
    correctAnswer: 2,
  },

  // Matemática
  {
    id: '31',
    category: 'matematica',
    question: 'Quanto é 12 × 8?',
    options: ['86', '92', '96', '108'],
    correctAnswer: 2,
  },
  {
    id: '32',
    category: 'matematica',
    question: 'Qual é o valor de 3² + 4²?',
    options: ['12', '25', '49', '81'],
    correctAnswer: 1,
  },
  {
    id: '33',
    category: 'matematica',
    question: 'Qual fração é equivalente a 0,75?',
    options: ['1/4', '2/3', '3/4', '4/5'],
    correctAnswer: 2,
  },
  {
    id: '34',
    category: 'matematica',
    question: 'Se x = 7, quanto é 2x + 3?',
    options: ['14', '15', '17', '21'],
    correctAnswer: 2,
  },
  {
    id: '35',
    category: 'matematica',
    question: 'Qual é a área de um retângulo de 9 cm por 5 cm?',
    options: ['14 cm²', '40 cm²', '45 cm²', '90 cm²'],
    correctAnswer: 2,
  },
];

export function getQuestionsByCategory(category: string, count: number = 5): Question[] {
  const categoryQuestions = questions.filter(q => q.category === category);
  return categoryQuestions.slice(0, count);
}

export function getRandomOpponent() {
  const opponents = [
    { name: 'Maria Silva', avatar: '👩', color: 'bg-pink-500' },
    { name: 'João Santos', avatar: '👨', color: 'bg-blue-500' },
    { name: 'Ana Costa', avatar: '👩', color: 'bg-purple-500' },
    { name: 'Pedro Oliveira', avatar: '👨', color: 'bg-green-500' },
    { name: 'Julia Ferreira', avatar: '👩', color: 'bg-orange-500' },
    { name: 'Lucas Almeida', avatar: '👨', color: 'bg-cyan-500' },
  ];
  return opponents[Math.floor(Math.random() * opponents.length)];
}
