// Hooks de TanStack Query del feature "casos". Las páginas solo usan estos hooks.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import {
  asignarTecnico,
  cerrarCaso,
  extenderConservacion,
  registrarDiagnostico,
  contarCasos,
  listarCasos,
  listarTecnicosAsignables,
  obtenerCaso,
  obtenerCuestionario,
  obtenerEvidencias,
  obtenerExplicacion,
  obtenerHistorial,
  obtenerOpcionesFiltro,
} from './api'
import type { CasoDetalle, DatosDiagnostico, FiltrosCasos } from './types'

export const casosKeys = {
  all: ['casos'] as const,
  lists: () => [...casosKeys.all, 'list'] as const,
  list: (f: FiltrosCasos) => [...casosKeys.lists(), f] as const,
  conteos: (f: FiltrosCasos) => [...casosKeys.all, 'conteos', f] as const,
  filtros: () => [...casosKeys.all, 'filtros'] as const,
  tecnicos: () => ['tecnicos', 'asignables'] as const,
  detail: (id: string) => [...casosKeys.all, 'detail', id] as const,
  parte: (id: string, parte: string) => [...casosKeys.all, 'detail', id, parte] as const,
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

export function useCaso(id: string) {
  return useQuery({ queryKey: casosKeys.detail(id), queryFn: () => obtenerCaso(id) })
}

/** Evidencias: solo cuando se necesitan (visor). `refetch` renueva URLs vencidas. */
export function useEvidencias(id: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: casosKeys.parte(id, 'evidencias'),
    queryFn: () => obtenerEvidencias(id),
    enabled,
  })
}

export function useCuestionario(id: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: casosKeys.parte(id, 'cuestionario'),
    queryFn: () => obtenerCuestionario(id),
    enabled,
  })
}

export function useHistorial(id: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: casosKeys.parte(id, 'historial'),
    queryFn: () => obtenerHistorial(id),
    enabled,
  })
}

export function useExplicacion(id: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: casosKeys.parte(id, 'explicacion'),
    queryFn: () => obtenerExplicacion(id),
    enabled,
  })
}

/** Tras guardar o cerrar: actualiza el detalle y refresca bandeja, contadores e inicio. */
function useAlCambiarCaso() {
  const queryClient = useQueryClient()
  return (caso: CasoDetalle) => {
    queryClient.setQueryData(casosKeys.detail(caso.id), caso)
    void queryClient.invalidateQueries({ queryKey: casosKeys.lists() })
    void queryClient.invalidateQueries({ queryKey: [...casosKeys.all, 'conteos'] })
    void queryClient.invalidateQueries({ queryKey: casosKeys.parte(caso.id, 'historial') })
    void queryClient.invalidateQueries({ queryKey: ['navegacion'] })
    void queryClient.invalidateQueries({ queryKey: ['inicio'] })
  }
}

export function useRegistrarDiagnostico(id: string) {
  const alCambiar = useAlCambiarCaso()
  return useMutation({
    mutationFn: (datos: DatosDiagnostico) => registrarDiagnostico(id, datos),
    onSuccess: alCambiar,
  })
}

export function useCerrarCaso(id: string) {
  const alCambiar = useAlCambiarCaso()
  return useMutation({ mutationFn: () => cerrarCaso(id), onSuccess: alCambiar })
}

export function useExtenderConservacion(id: string) {
  const alCambiar = useAlCambiarCaso()
  return useMutation({
    mutationFn: ({ venceEn, justificacion }: { venceEn: string; justificacion: string }) =>
      extenderConservacion(id, venceEn, justificacion),
    onSuccess: alCambiar,
  })
}
