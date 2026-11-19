import { BrowserRouter, Route, Routes } from 'react-router';
import { PaginaStatus } from './paginas/PaginaStatus';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PaginaStatus />} />
        <Route path="/status" element={<PaginaStatus />} />
      </Routes>
    </BrowserRouter>
  );
}
