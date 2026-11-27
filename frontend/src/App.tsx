import { BrowserRouter, Route, Routes } from 'react-router';
import { PaginaCadastro } from './paginas/PaginaCadastro';
import { PaginaDetalhesJogo } from './paginas/PaginaDetalhesJogo';
import { PaginaLogin } from './paginas/PaginaLogin';
import { PaginaPesquisa } from './paginas/PaginaPesquisa';
import { PaginaStatus } from './paginas/PaginaStatus';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PaginaStatus />} />
        <Route path="/status" element={<PaginaStatus />} />
        <Route path="/cadastro" element={<PaginaCadastro />} />
        <Route path="/login" element={<PaginaLogin />} />
        <Route path="/pesquisa" element={<PaginaPesquisa />} />
        <Route path="/jogos/:id" element={<PaginaDetalhesJogo />} />
      </Routes>
    </BrowserRouter>
  );
}
