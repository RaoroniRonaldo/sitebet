import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const avatars = [
  { name: 'Darth Vader', imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=DarthVader&backgroundColor=000000' },
  { name: 'Homem Aranha', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Spiderman&backgroundColor=ff0000' },
  { name: 'Hulk', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hulk&backgroundColor=00ff00' },
  { name: 'Stallone', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stallone&backgroundColor=c0a080' },
  { name: 'Alien', imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alien&backgroundColor=000000' }
];

const games = [
  { code: 'fortune-tiger', name: 'Fortune Tiger', provider: 'PG_SOFT', rtpLevel: 95, imageUrl: '🐯' },
  { code: 'fortune-ox', name: 'Fortune Ox', provider: 'PG_SOFT', rtpLevel: 94, imageUrl: '🐂' },
  { code: 'aviator', name: 'Aviator', provider: 'SPRIBE', rtpLevel: 96, imageUrl: '✈️' },
  { code: 'mines', name: 'Mines', provider: 'CUSTOM', rtpLevel: 97, imageUrl: '💣' },
  { code: 'double', name: 'Roleta Double', provider: 'SITEBET', rtpLevel: 95, imageUrl: '🎡' },
  { code: 'halloween', name: 'Halloween Clássico', provider: 'CLASSIC', rtpLevel: 90, imageUrl: '🎃' }
];

async function main() {
  console.log('Iniciando o seed de avatares...');
  for (const avatar of avatars) {
    const existing = await prisma.avatar.findFirst({ where: { name: avatar.name } });
    if (!existing) {
      await prisma.avatar.create({ data: avatar });
      console.log(`Avatar ${avatar.name} criado.`);
    }
  }

  console.log('Iniciando o seed de jogos...');
  for (const game of games) {
    const existing = await prisma.game.findFirst({ where: { code: game.code } });
    if (!existing) {
      await prisma.game.create({ data: game });
      console.log(`Jogo ${game.name} criado.`);
    } else {
      console.log(`Jogo ${game.name} já existe.`);
    }
  }
  
  console.log('Seed completo!');
}

main().catch(e => { console.error(e); }).finally(async () => { await prisma.$disconnect(); });
