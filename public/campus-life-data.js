import { campusLayout } from './campus-layout.js';
export const shops = [
  {
    id: 'canteen',
    name: 'MESCE Canteen',
    keeper: 'Ikka',
    x: 33 + campusLayout.canteen.dx,
    z: 28 + campusLayout.canteen.dz,
    description: 'Hot biriyani, Kerala meals, and a table with your friends.',
    items: [
      { id: 'biriyani', name: 'Chicken biriyani', price: 18, icon: '🍛', kind: 'meal' },
      { id: 'meals', name: 'Kerala meals', price: 12, icon: '🍚', kind: 'meal' },
      { id: 'lime', name: 'Fresh lime', price: 5, icon: '🍋', kind: 'drink' },
    ],
  },
  {
    id: 'corner',
    name: 'Students’ Corner',
    keeper: 'Chettan',
    x: -85,
    z: 34,
    description: 'A little shop, a shady tree, and all the usual favourites.',
    items: [
      { id: 'icecream', name: 'Ice cream', price: 6, icon: '🍦', kind: 'icecream' },
      { id: 'chips', name: 'Lay’s chips', price: 5, icon: '🥔', kind: 'packet' },
      { id: 'soda', name: 'Cold drink', price: 4, icon: '🥤', kind: 'drink' },
      { id: 'chaya', name: 'Chaya', price: 3, icon: '☕', kind: 'drink' },
    ],
  },
  {
    id: 'lawn',
    name: 'Lawn Chaya Kada',
    keeper: 'Sulaiman ikka',
    x: -8,
    z: -31,
    description: 'Chaya, pazham pori, and one more conversation before class.',
    items: [
      { id: 'chaya', name: 'Chaya', price: 3, icon: '☕', kind: 'drink' },
      { id: 'lime', name: 'Lime juice', price: 5, icon: '🍋', kind: 'drink' },
      { id: 'pazham', name: 'Pazham pori', price: 4, icon: '🍌', kind: 'snack' },
      { id: 'vada', name: 'Parippu vada', price: 3, icon: '🥨', kind: 'snack' },
    ],
  },
];
export const fruitTrees = [
  { id: 'mango', name: 'Mango', x: 28, z: -13, color: '#eab84d', reward: 10 },
  { id: 'guava', name: 'Guava', x: -33, z: 12, color: '#bad36b', reward: 10 },
  { id: 'jackfruit', name: 'Jackfruit', x: 44, z: 39, color: '#8f9c48', reward: 10 },
];
