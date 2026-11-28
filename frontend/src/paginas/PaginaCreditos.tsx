const politicaCdpr = 'https://www.cdprojektred.com/en/fan-content';

const imagens = [
  {
    jogo: 'Cyberpunk 2077',
    obra: 'Captura de Night City',
    fonte: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/ss_b529b0abc43f55fc23fe8058eddb6e37c9629a6a.1920x1080.jpg?t=1794474878',
  },
  {
    jogo: 'The Witcher 3: Wild Hunt',
    obra: 'Captura da viagem a cavalo',
    fonte: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/8a97157ec7e4f3d458d70a0942779f093f404d8c/ss_8a97157ec7e4f3d458d70a0942779f093f404d8c.1920x1080.jpg?t=1793900434',
  },
];

export function PaginaCreditos() {
  return (
    <main className="limite pagina">
      <h1>Créditos das imagens</h1>
      <p className="introducao">
        As capas e os dados dos jogos vêm da <a className="link-texto" href="https://www.igdb.com/">IGDB</a>.
        A marca Vorgame foi gerada com ImageGen para este projeto.
      </p>
      <ul className="lista-creditos">
        {imagens.map(({ jogo, obra, fonte }) => (
          <li key={jogo}>
            <h2>{jogo}</h2>
            <p>
              <a className="link-texto" href={fonte}>{obra}</a> por CD PROJEKT RED ·{' '}
              <a className="link-texto" href={politicaCdpr}>Política de conteúdo de fãs</a>.
            </p>
            <p>Uso não comercial. Imagem redimensionada e convertida para WebP.</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
