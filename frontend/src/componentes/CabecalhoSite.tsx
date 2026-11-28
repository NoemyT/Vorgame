import { Compass, ListChecks, Menu, Search } from 'lucide-react';
import { NavLink } from 'react-router';
import { Marca } from './Marca';
import { Button } from './ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

const linksCatalogo = [
  { para: '/', texto: 'Explorar', icone: Compass },
  { para: '/pesquisa', texto: 'Pesquisar jogos', icone: Search },
];

function NavegacaoDesktop({ autenticado }: { autenticado: boolean }) {
  return (
    <div className="cabecalho-desktop">
      <nav className="nav-catalogo" aria-label="Navegação principal">
        {linksCatalogo.map(({ para, texto }) => (
          <NavLink end key={para} to={para}>
            {texto}
          </NavLink>
        ))}
      </nav>
      <div className="nav-conta">
        {autenticado ? (
          <Button asChild variant="ghost">
            <NavLink to="/minhas-avaliacoes">
              <ListChecks aria-hidden="true" /> Minhas avaliações
            </NavLink>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost">
              <NavLink to="/login">Entrar</NavLink>
            </Button>
            <Button asChild>
              <NavLink to="/cadastro">Criar conta</NavLink>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function LinksMenuMovel() {
  return (
    <nav aria-label="Menu principal">
      {linksCatalogo.map(({ para, texto, icone: Icone }) => (
        <SheetClose asChild key={para}>
          <NavLink end to={para}>
            <Icone aria-hidden="true" size={18} />
            {texto}
          </NavLink>
        </SheetClose>
      ))}
      <SheetClose asChild>
        <NavLink to="/status">Status do sistema</NavLink>
      </SheetClose>
    </nav>
  );
}

function ContaMenuMovel({ autenticado }: { autenticado: boolean }) {
  return (
    <div className="menu-conta">
      {autenticado ? (
        <SheetClose asChild>
          <Button asChild variant="outline">
            <NavLink to="/minhas-avaliacoes">
              <ListChecks aria-hidden="true" /> Minhas avaliações
            </NavLink>
          </Button>
        </SheetClose>
      ) : (
        <>
          <SheetClose asChild>
            <Button asChild variant="outline">
              <NavLink to="/login">Entrar</NavLink>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button asChild>
              <NavLink to="/cadastro">Criar conta</NavLink>
            </Button>
          </SheetClose>
        </>
      )}
    </div>
  );
}

function NavegacaoMovel({ autenticado }: { autenticado: boolean }) {
  return (
    <div className="cabecalho-movel">
      <Button asChild size="icon" variant="ghost">
        <NavLink aria-label="Pesquisar jogos" to="/pesquisa">
          <Search aria-hidden="true" />
        </NavLink>
      </Button>
      <Sheet>
        <SheetTrigger asChild>
          <Button aria-label="Abrir menu" size="icon" variant="outline">
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent className="menu-vorgame" side="right">
          <SheetHeader>
            <SheetTitle>Vorgame</SheetTitle>
            <SheetDescription className="sr-only">
              Navegação principal
            </SheetDescription>
          </SheetHeader>
          <LinksMenuMovel />
          <ContaMenuMovel autenticado={autenticado} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function CabecalhoSite({ autenticado }: { autenticado: boolean }) {
  return (
    <header className="cabecalho-site">
      <div className="limite cabecalho-interno">
        <Marca />
        <NavegacaoDesktop autenticado={autenticado} />
        <NavegacaoMovel autenticado={autenticado} />
      </div>
    </header>
  );
}
