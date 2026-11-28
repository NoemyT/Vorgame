import { useSyncExternalStore } from 'react';
import { assinarSessao, temSessao } from '../servicos/sessao';
import { ChamadaConta, DestaqueInicial } from './DestaqueInicial';
import { ExploreEstilos, SelecaoInicial } from './SelecoesIniciais';
import { useCuradoria } from './useCuradoria';
import './PaginaInicial.css';

export function PaginaInicial() {
  const curadoria = useCuradoria();
  const autenticado = useSyncExternalStore(assinarSessao, temSessao);
  return (
    <main>
      <DestaqueInicial resultados={curadoria.resultados} />
      <div className="limite corpo-inicial">
        <SelecaoInicial curadoria={curadoria} />
        <ExploreEstilos resultados={curadoria.resultados} />
        <ChamadaConta autenticado={autenticado} />
      </div>
    </main>
  );
}
