import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createBlock, type Block } from '@cms/shared';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const builder = await prisma.user.upsert({
    where: { email: 'freelance@example.com' },
    update: {},
    create: { email: 'freelance@example.com', name: 'Freelance', passwordHash },
  });
  const client = await prisma.user.upsert({
    where: { email: 'cliente@example.com' },
    update: {},
    create: { email: 'cliente@example.com', name: 'Mario (Pizzeria)', passwordHash },
  });

  const site = await prisma.site.upsert({
    where: { slug: 'pizzeria-da-mario' },
    update: {},
    create: {
      name: 'Pizzeria da Mario',
      slug: 'pizzeria-da-mario',
      theme: { primary: '#c2410c', font: 'Poppins' },
      memberships: {
        create: [
          { userId: builder.id, role: 'builder' },
          { userId: client.id, role: 'client' },
        ],
      },
    },
  });

  const hero = createBlock('hero', 'hero-1');
  hero.locked = true;
  hero.editableFields = ['title', 'subtitle'];
  hero.props = { ...hero.props, title: 'Pizzeria da Mario', subtitle: 'Forno a legna dal 1985', buttonText: 'Prenota', buttonUrl: '#contatti' };

  const text = createBlock('text', 'text-1');
  text.props = { heading: 'Chi siamo', body: 'Una pizzeria di famiglia nel centro storico.' };

  const contacts = createBlock('contacts', 'contacts-1');
  contacts.locked = true;
  contacts.editableFields = ['phone', 'hours'];
  contacts.props = { address: 'Via Roma 1', phone: '085 000000', email: 'info@example.com', hours: 'Mar-Dom 19:00-23:30' };

  const blocks: Block[] = [hero, text, contacts];

  await prisma.page.upsert({
    where: { siteId_slug: { siteId: site.id, slug: 'home' } },
    update: {},
    create: {
      siteId: site.id,
      slug: 'home',
      title: 'Home',
      status: 'published',
      draft: blocks as object[],
      published: blocks as object[],
      publishedAt: new Date(),
    },
  });

  console.log('Seed completato. Utenti: freelance@example.com / cliente@example.com, password: password123');
}

main().finally(() => prisma.$disconnect());
