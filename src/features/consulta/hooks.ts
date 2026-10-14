// Hooks de TanStack Query del feature "consulta". Las páginas solo usan estos hooks.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { listarConsulta, obtenerRegistro } from './api'
import type { FiltrosConsulta } from './types'

export const consultaKeys = {
  all: ['consulta'] as const,
  list: (f: FiltrosConsulta) => [...consultaKeys.all, 'list', f] as const,
  detail: (id: string) => [...consultaKeys.all, 'detail', id] as const,
}

export const FILTROS_CONSULTA_VACIOS: FiltrosConsulta = {
  q: '',
  vereda: '',
  especie: '',
  estado_casos: '',
  page: '1',
}

export function useFiltrosConsulta() {
  return useUrlFilters(FILTROS_CONSULTA_VACIOS)
}

export function useConsulta(f: FiltrosConsulta) {
  return useQuery({
    queryKey: consultaKeys.list(f),
    queryFn: () => listarConsulta(f),
    placeholderData: keepPreviousData,
  })
}

export function useRegistroConsulta(id: string | null) {
  return useQuery({
    queryKey: consultaKeys.detail(id ?? ''),
    queryFn: () => obtenerRegistro(id!),
    enabled: !!id,
  })
}
