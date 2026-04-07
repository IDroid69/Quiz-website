import { createBrowserRouter } from 'react-router';
import { Home } from './components/Home';
import { Categories } from './components/Categories';
import { Game } from './components/Game';
import { Results } from './components/Results';
import { Room } from './components/Room';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/categories',
    Component: Categories,
  },
  {
    path: '/room',
    Component: Room,
  },
  {
    path: '/game/:categoryId',
    Component: Game,
  },
  {
    path: '/results',
    Component: Results,
  },
]);
