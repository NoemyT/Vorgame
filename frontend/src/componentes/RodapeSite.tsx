import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { Marca } from './Marca';

export function RodapeSite({ autenticado }: { autenticado: boolean }) {
  return (
    <footer className="rodape-site">
      <div className="limite rodape-grade">
        <div className="rodape-marca">
          <Marca />
          <p>Descubra jogos e veja como a comunidade do Vorgame os avalia.</p>
        </div>
        <nav aria-label="Links do rodapé" className="rodape-links">
          <div>
            <h2>Catálogo</h2>
            <Link to="/">Explorar</Link>
            <Link to="/pesquisa">Pesquisar jogos</Link>
          </div>
          <div>
            <h2>Conta</h2>
            {autenticado ? (
              <>
                <span>Sessão ativa</span>
                <Link to="/pesquisa">Consultar jogos</Link>
              </>
            ) : (
              <>
                <Link to="/login">Entrar</Link>
                <Link to="/cadastro">Criar conta</Link>
              </>
            )}
          </div>
          <div>
            <h2>Projeto</h2>
            <Link to="/status">Status do sistema</Link>
            <Link to="/creditos">Créditos das imagens</Link>
          </div>
        </nav>
      </div>
      <div className="limite rodape-base">
        <a href="https://www.igdb.com/">
          Dados de jogos: IGDB <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
