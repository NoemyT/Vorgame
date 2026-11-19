import { useEffect, useState } from 'react';
import { consultarSaude, type StatusSaude } from '../servicos/api';

type EstadoConsulta =
  | { fase: 'carregando' }
  | { fase: 'concluida'; status: StatusSaude }
  | { fase: 'falhou'; mensagem: string };

function rotular(nome: string, situacao: 'ok' | 'erro'): string {
  return situacao === 'ok' ? `${nome} OK` : `${nome} com erro`;
}

function ResultadoStatus({ estado }: { estado: EstadoConsulta }) {
  if (estado.fase === 'carregando') {
    return (
      <p>
        Verificando a API… O primeiro acesso pode levar cerca de um minuto, porque o servidor
        gratuito hiberna quando fica sem uso.
      </p>
    );
  }
  if (estado.fase === 'falhou') {
    return (
      <>
        <p className="status status--erro">API indisponível</p>
        <p className="detalhe">{estado.mensagem}</p>
      </>
    );
  }
  const { api, banco } = estado.status;
  const tudoOk = api === 'ok' && banco === 'ok';
  return (
    <p className={`status ${tudoOk ? 'status--ok' : 'status--erro'}`}>
      {rotular('API', api)} · {rotular('Banco', banco)}
    </p>
  );
}

function descreverErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro);
}

export function PaginaStatus() {
  const [estado, setEstado] = useState<EstadoConsulta>({ fase: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    consultarSaude().then(
      (status) => ativo && setEstado({ fase: 'concluida', status }),
      (erro: unknown) => ativo && setEstado({ fase: 'falhou', mensagem: descreverErro(erro) }),
    );
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  function verificarNovamente(): void {
    setEstado({ fase: 'carregando' });
    setTentativa((anterior) => anterior + 1);
  }

  return (
    <main className="pagina">
      <h1>Vorgame</h1>
      <h2>Status do sistema</h2>
      <section aria-live="polite" aria-busy={estado.fase === 'carregando'}>
        <ResultadoStatus estado={estado} />
      </section>
      <button type="button" onClick={verificarNovamente} disabled={estado.fase === 'carregando'}>
        Verificar novamente
      </button>
    </main>
  );
}
