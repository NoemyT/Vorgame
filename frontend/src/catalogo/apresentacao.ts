const formatoMedia = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function rotuloMedia(media: number | null, total: number) {
  if (media !== null) return `${formatoMedia.format(media)}/10`;
  return total === 0 ? 'Sem avaliações' : 'Média indisponível';
}

export function rotuloTotal(total: number) {
  return `${total} ${total === 1 ? 'avaliação' : 'avaliações'}`;
}

export function rotaPesquisa(termo: string) {
  return `/pesquisa?${new URLSearchParams({ q: termo })}`;
}
