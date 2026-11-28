export interface JogoCurado {
  titulo: string;
  estilo: 'RPG de ação' | 'Roguelike' | 'Ação em mundo aberto';
  descricao: string;
  imagem?: string;
  alternativa?: string;
}

export const cyberpunk = {
  titulo: 'Cyberpunk 2077',
  estilo: 'RPG de ação',
  descricao: 'Explore Night City e escolha como enfrentar cada trabalho como mercenário.',
  imagem: '/midia/cyberpunk-night-city.webp',
  alternativa: 'Passarela cercada de prédios e letreiros em Night City',
} satisfies JogoCurado;

export const isaac: JogoCurado = {
  titulo: 'The Binding of Isaac',
  estilo: 'Roguelike',
  descricao: 'Desça por masmorras que mudam a cada partida e combine os itens que encontrar.',
};

export const witcher = {
  titulo: 'The Witcher 3: Wild Hunt',
  estilo: 'RPG de ação',
  descricao: 'Viaje com Geralt em busca de Ciri e aceite contratos para caçar monstros pelo caminho.',
  imagem: '/midia/witcher-3-caminho.webp',
  alternativa: 'Viajantes a cavalo em uma estrada com montanhas ao fundo',
} satisfies JogoCurado;

export const gta: JogoCurado = {
  titulo: 'Grand Theft Auto VI',
  estilo: 'Ação em mundo aberto',
  descricao: 'Conheça Vice City e o estado de Leonida na história de Lucia e Jason.',
};

export const jogosCurados = [cyberpunk, isaac, witcher, gta] as const;
