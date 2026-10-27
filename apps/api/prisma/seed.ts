import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_LAYOUT } from '@cms/shared';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = (email: string, name: string, whatsapp: string | null = null) =>
    prisma.user.upsert({ where: { email }, update: {}, create: { email, name, passwordHash, whatsapp } });

  const builder = await user('freelance@example.com', 'Freelance');
  const client = await user('cliente@example.com', 'Mario (Pizzeria)', '393331234567');

  const existing = await prisma.business.findUnique({ where: { slug: 'pizzeria-da-mario' } });
  if (existing) {
    console.log('Seed già presente.');
    return;
  }

  await prisma.business.create({
    data: {
      slug: 'pizzeria-da-mario',
      name: 'Pizzeria da Mario',
      category: 'restaurant',
      description: 'Pizzeria di famiglia con forno a legna, nel centro storico dal 1985.',
      phone: '085 000000',
      email: 'info@pizzeriadamario.example',
      address: 'Via Roma 1, Penne (PE)',
      theme: { primary: '#c2410c' },
      memberships: {
        create: [
          { userId: builder.id, role: 'builder' },
          { userId: client.id, role: 'client' },
        ],
      },
      openingHours: {
        create: [2, 3, 4, 5, 6, 7].flatMap((weekday) => [
          ...(weekday >= 6 ? [{ weekday, opens: '12:00', closes: '14:30' }] : []),
          { weekday, opens: '19:00', closes: '23:30' },
        ]),
      },
      catalog: {
        create: [
          { id: 'item-margherita', position: 0, section: 'Pizze', name: 'Margherita', description: 'Pomodoro, mozzarella, basilico', price: 6 },
          { id: 'item-marinara', position: 1, section: 'Pizze', name: 'Marinara', description: 'Pomodoro, aglio, origano', price: 5 },
          { id: 'item-capricciosa', position: 2, section: 'Pizze', name: 'Capricciosa', description: 'Prosciutto, funghi, carciofi, olive', price: 8.5 },
          { id: 'item-carbonara', position: 3, section: 'Primi', name: 'Carbonara', description: 'Guanciale, uovo, pecorino', price: 11 },
          { id: 'item-tiramisu', position: 4, section: 'Dolci', name: 'Tiramisù', description: 'Fatto in casa', price: 5 },
        ],
      },
      posts: {
        create: [{ id: 'post-welcome', position: 0, kind: 'news', title: 'Benvenuti sul nuovo sito', body: 'Da oggi trovate qui orari e menu sempre aggiornati.' }],
      },
      pages: { create: [{ slug: 'home', title: 'Home', layout: DEFAULT_LAYOUT as object[] }] },
    },
  });

  console.log('Seed completato. Utenti: freelance@example.com / cliente@example.com — password: password123');
}

main().finally(() => prisma.$disconnect());
