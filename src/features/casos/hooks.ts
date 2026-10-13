// Hooks de TanStack Query del feature "casos". Las páginas solo usan estos hooks.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import {
  asignarTecnico,
  contarCasos,
  listarCasos,
  listarTecnicosAsignables,
  obtenerOpcionesFiltro,
} from './api'
import type { FiltrosCasos } from './types'

export const casosKeys = {
  all: ['casos'] as const,
  lists: () => [...casosKeys.all, 'list'] as const,
  list: (f: FiltrosCasos) => [...casosKeys.lists(), f] as const,
  conteos: (f: FiltrosCasos) => [...casosKeys.all, 'conteos', f] as const,
  filtros: () => [...casosKeys.all, 'filtros'] as const,
  tecnicos: () => ['tecnicos', 'asignables'] as const,
  detail: (id: string) => [...casosKeys.all, 'detail', id] as const,
}

export const FILTROS_CASOS_VACIOS: FiltrosCasos = {
  estado: 'todos',
  q: '',
  vereda: '',
  finca: '',
  cultivo: '',
  especie: '',
  categoria: '',
  tecnico: '',
  coincidencia: '',
  vencimiento: '',
  desde: '',
  hasta: '',
  page: '1',
}

/** Filtros de la bandeja en la URL (pestaña, búsqueda, filtros y página). */
export function useFiltrosCasos() {
  return useUrlFilters(FILTROS_CASOS_VACIOS)
}

export function useCasos(f: FiltrosCasos) {
  return useQuery({
    queryKey: casosKeys.list(f),
    queryFn: () => listarCasos(f),
    placeholderData: keepPreviousData,
  })
}

export function useConteosCasos(f: FiltrosCasos) {
  // Las pestañas cuentan con los demás filtros, sin el de estado ni la página.
  const resto = { ...f, estado: 'todos', page: '1' }
  return useQuery({
    queryKey: casosKeys.conteos(resto),
    queryFn: () => contarCasos(f),
    placeholderData: keepPreviousData,
  })
}

export function useOpcionesFiltroCasos() {
  return useQuery({
    queryKey: casosKeys.filtros(),
    queryFn: obtenerOpcionesFiltro,
    staleTime: 300_000,
  })
}

export function useTecnicosAsignables({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: casosKeys.tecnicos(), queryFn: listarTecnicosAsignables, enabled })
}

export function useAsignarTecnico() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ idCaso, tecnicoId }: { idCaso: string; tecnicoId: string }) =>
      asignarTecnico(idCaso, tecnicoId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: casosKeys.all })
      void queryClient.invalidateQueries({ queryKey: casosKeys.tecnicos() })
      // Contadores de la barra lateral (feature navegación) y del inicio.
      void queryClient.invalidateQueries({ queryKey: ['navegacion'] })
      void queryClient.invalidateQueries({ queryKey: ['inicio'] })
    },
  })
}
