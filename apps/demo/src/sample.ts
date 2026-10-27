import type { BusinessData } from '@cms/shared';

export const SAMPLE: BusinessData = {
  name: 'Pizzeria da Mario',
  category: 'restaurant',
  description: 'Pizzeria di famiglia con forno a legna, nel centro storico dal 1985.',
  phone: '085 000000',
  email: 'info@pizzeriadamario.example',
  address: 'Via Roma 1, Penne (PE)',
  openingHours: [2, 3, 4, 5, 6, 7].flatMap((weekday) => [
    ...(weekday >= 6 ? [{ weekday: weekday as 6 | 7, opens: '12:00', closes: '14:30' }] : []),
    { weekday: weekday as 2 | 3 | 4 | 5 | 6 | 7, opens: '19:00', closes: '23:30' },
  ]),
  specialHours: [],
  catalog: [
    { id: 'item-margherita', section: 'Pizze', name: 'Margherita', description: 'Pomodoro, mozzarella, basilico', price: 6, available: true },
    { id: 'item-marinara', section: 'Pizze', name: 'Marinara', description: 'Pomodoro, aglio, origano', price: 5, available: true },
    { id: 'item-capricciosa', section: 'Pizze', name: 'Capricciosa', description: 'Prosciutto, funghi, carciofi, olive', price: 8.5, available: true },
    { id: 'item-carbonara', section: 'Primi', name: 'Carbonara', description: 'Guanciale, uovo, pecorino', price: 11, available: true },
    { id: 'item-tiramisu', section: 'Dolci', name: 'Tiramisù', description: 'Fatto in casa', price: 5, available: true },
  ],
  posts: [{ id: 'post-welcome', kind: 'news', title: 'Benvenuti sul nuovo sito', body: 'Da oggi trovate qui orari e menu sempre aggiornati.', startsAt: null, endsAt: null }],
};
