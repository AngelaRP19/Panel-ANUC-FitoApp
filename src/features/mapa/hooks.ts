// Hooks de TanStack Query del feature "mapa".
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { obtenerCasosMapa, type FiltrosMapa } from './api'

export const mapaKeys = {
  casos: (f: Pick<FiltrosMapa, 'especie' | 'desde' | 'hasta'>) => ['mapa', 'casos', f] as const,
}

const VACIOS: FiltrosMapa = { especie: '', desde: '', hasta: '', ocultas: '', calor: '', finca: '' }

/** Filtros del mapa en la URL (especie, fechas, categorías ocultas, capa y finca). */
export function useFiltrosMapa() {
  return useUrlFilters(VACIOS)
}

/** Casos del mapa. Las categorías ocultas y la capa se aplican en la pantalla. */
export function useCasosMapa(f: FiltrosMapa) {
  const servidor = { especie: f.especie, desde: f.desde, hasta: f.hasta }
  return useQuery({
    queryKey: mapaKeys.casos(servidor),
    queryFn: () => obtenerCasosMapa(f),
    placeholderData: keepPreviousData,
  })
}
