// Hooks de TanStack Query del feature "inicio". Las páginas solo usan estos hooks.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { obtenerCasosPorCategoria, obtenerResumen } from './api'
import type { PeriodoCategorias } from './types'

export const inicioKeys = {
  all: ['inicio'] as const,
  resumen: () => [...inicioKeys.all, 'resumen'] as const,
  categorias: (periodo: PeriodoCategorias) => [...inicioKeys.all, 'categorias', periodo] as const,
}

const UN_MINUTO = 60_000

export function useResumenPanel({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: inicioKeys.resumen(),
    queryFn: obtenerResumen,
    refetchInterval: 5 * UN_MINUTO,
    enabled,
  })
}

export function useCasosPorCategoria(periodo: PeriodoCategorias) {
  return useQuery({
    queryKey: inicioKeys.categorias(periodo),
    queryFn: () => obtenerCasosPorCategoria(periodo),
    placeholderData: keepPreviousData,
  })
}
