import { BrowserRouter, Route, Routes } from 'react-router';
import { LayoutSite } from './componentes/LayoutSite';
import { PaginaCadastro } from './paginas/PaginaCadastro';
import { PaginaCreditos } from './paginas/PaginaCreditos';
import { PaginaDetalhesJogo } from './paginas/PaginaDetalhesJogo';
import { PaginaInicial } from './paginas/PaginaInicial';
import { PaginaLogin } from './paginas/PaginaLogin';
import { PaginaMinhasAvaliacoes } from './paginas/PaginaMinhasAvaliacoes';
import { PaginaPesquisa } from './paginas/PaginaPesquisa';
import { PaginaStatus } from './paginas/PaginaStatus';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LayoutSite />}>
          <Route path="/" element={<PaginaInicial />} />
          <Route path="/status" element={<PaginaStatus />} />
          <Route path="/cadastro" element={<PaginaCadastro />} />
          <Route path="/login" element={<PaginaLogin />} />
          <Route
            path="/minhas-avaliacoes"
            element={<PaginaMinhasAvaliacoes />}
          />
          <Route path="/pesquisa" element={<PaginaPesquisa />} />
          <Route path="/jogos/:id" element={<PaginaDetalhesJogo />} />
          <Route path="/creditos" element={<PaginaCreditos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
