import { useQuery } from '@tanstack/react-query'
import { obtenerResumenNavegacion } from './api'

export const navegacionKeys = {
  resumen: ['navegacion', 'resumen'] as const,
}

/** Contadores de la barra lateral; se refrescan cada minuto. */
export function useResumenNavegacion() {
  return useQuery({
    queryKey: navegacionKeys.resumen,
    queryFn: obtenerResumenNavegacion,
    refetchInterval: 60_000,
  })
}
