import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Outlet, useLocation } from 'react-router';
import { assinarSessao, temSessao } from '../servicos/sessao';
import { CabecalhoSite } from './CabecalhoSite';
import { RodapeSite } from './RodapeSite';
import './LayoutSite.css';

export function LayoutSite() {
  const autenticado = useSyncExternalStore(assinarSessao, temSessao);
  const { pathname } = useLocation();
  const conteudo = useRef<HTMLDivElement>(null);
  const paginaAnterior = useRef(pathname);

  useEffect(() => {
    if (paginaAnterior.current === pathname) return;
    paginaAnterior.current = pathname;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    conteudo.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="layout-site">
      <a className="atalho-conteudo" href="#conteudo">
        Ir para o conteúdo
      </a>
      <CabecalhoSite autenticado={autenticado} />
      <div
        className="layout-conteudo"
        id="conteudo"
        ref={conteudo}
        tabIndex={-1}
      >
        <Outlet />
      </div>
      <RodapeSite autenticado={autenticado} />
    </div>
  );
}
