import { Prisma, PrismaClient } from '@prisma/client';

const baseCapas = 'https://vorgame.vercel.app/capas/';

const catalogo = [
  {
    chaveSeed: 'ecos-de-orbita',
    titulo: 'Ecos de Órbita',
    genero: 'Aventura',
    plataformas: ['PC', 'Nintendo Switch'],
    descricao:
      'Explore estações abandonadas e reconstrua a rota de uma expedição perdida.',
  },
  {
    chaveSeed: 'ecos-do-subsolo',
    titulo: 'Ecos do Subsolo',
    genero: 'Quebra-cabeça',
    plataformas: ['PC', 'PlayStation 5'],
    descricao:
      'Use vibrações para mapear cavernas e abrir passagens subterrâneas.',
  },
  {
    chaveSeed: 'trilhos-de-neon',
    titulo: 'Trilhos de Neon',
    genero: 'Corrida',
    plataformas: ['PC', 'Xbox Series X|S'],
    descricao:
      'Dispute corridas noturnas em circuitos suspensos sobre uma cidade futurista.',
  },
  {
    chaveSeed: 'jardim-de-brasa',
    titulo: 'Jardim de Brasa',
    genero: 'Estratégia',
    plataformas: ['Nintendo Switch'],
    descricao:
      'Restaure um jardim vulcânico administrando água, sementes e calor.',
  },
];

function validarPlataformas(plataformas, chaveSeed) {
  if (
    !Array.isArray(plataformas) ||
    plataformas.length === 0 ||
    plataformas.some(
      (plataforma) => typeof plataforma !== 'string' || !plataforma.trim(),
    ) ||
    new Set(plataformas.map((plataforma) => plataforma.trim().toLowerCase()))
      .size !== plataformas.length
  ) {
    throw new Error(`Plataformas inválidas no jogo ${chaveSeed}.`);
  }
}

async function carregarCatalogo(prisma) {
  const operacoes = catalogo.map(({ chaveSeed, plataformas, ...dados }) => {
    validarPlataformas(plataformas, chaveSeed);
    const jogo = {
      ...dados,
      plataformas,
      capa: `${baseCapas}${chaveSeed}.webp`,
    };

    // Atualiza somente os dados do catálogo para preservar os agregados.
    return prisma.jogo.upsert({
      where: { chaveSeed },
      create: { chaveSeed, ...jogo },
      update: jogo,
    });
  });

  await prisma.$transaction(operacoes);
}

const prisma = new PrismaClient();

try {
  await carregarCatalogo(prisma);
  console.log(`Catálogo inicial carregado (${catalogo.length} jogos).`);
} catch (erro) {
  if (erro instanceof Prisma.PrismaClientInitializationError) {
    console.error(
      `Não foi possível conectar ao banco (${erro.errorCode ?? 'sem código'}).`,
    );
    process.exitCode = 1;
  } else {
    throw erro;
  }
} finally {
  await prisma.$disconnect();
}
