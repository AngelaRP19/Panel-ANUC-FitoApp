// Hooks de TanStack Query del feature "productores". Las páginas solo usan estos hooks.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { descargarTexto } from '@/utils/descarga'
import {
  cambiarEstadoProductor,
  cambiarEstadoProductores,
  editarProductor,
  enviarMensajeProductores,
  exportarProductores,
  listarProductores,
  obtenerProductor,
  obtenerResumenProductores,
  registrarProductor,
} from './api'
import type { DatosProductor, FiltrosProductores } from './types'

export const productoresKeys = {
  all: ['productores'] as const,
  lists: () => [...productoresKeys.all, 'list'] as const,
  list: (f: FiltrosProductores) => [...productoresKeys.lists(), f] as const,
  resumen: () => [...productoresKeys.all, 'resumen'] as const,
  detail: (id: string) => [...productoresKeys.all, 'detail', id] as const,
}

export const FILTROS_PRODUCTORES_VACIOS: FiltrosProductores = {
  q: '',
  estado: '',
  vereda: '',
  especie: '',
  casos: '',
  finca: '',
  desde: '',
  hasta: '',
  consulta: '',
  page: '1',
  filas: '10',
}

export function useFiltrosProductores() {
  return useUrlFilters(FILTROS_PRODUCTORES_VACIOS)
}

export function useProductores(f: FiltrosProductores) {
  return useQuery({
    queryKey: productoresKeys.list(f),
    queryFn: () => listarProductores(f),
    placeholderData: keepPreviousData,
  })
}

const TODOS: FiltrosProductores = { ...FILTROS_PRODUCTORES_VACIOS, filas: '1000' }

/** Todos los productores (activos y deshabilitados) ordenados por nombre, para elegirlos. */
export function useTodosProductores(enabled = true) {
  return useQuery({
    queryKey: productoresKeys.list(TODOS),
    queryFn: () => listarProductores(TODOS),
    select: (d) => d.items,
    staleTime: 60_000,
    enabled,
  })
}

export function useResumenProductores() {
  return useQuery({ queryKey: productoresKeys.resumen(), queryFn: obtenerResumenProductores })
}

export function useProductor(id: string | null) {
  return useQuery({
    queryKey: productoresKeys.detail(id ?? ''),
    queryFn: () => obtenerProductor(id!),
    enabled: !!id,
  })
}

function useInvalidarProductores() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: productoresKeys.all })
}

export function useRegistrarProductor() {
  const invalidar = useInvalidarProductores()
  return useMutation({ mutationFn: registrarProductor, onSuccess: invalidar })
}

export function useEditarProductor(id: string) {
  const invalidar = useInvalidarProductores()
  return useMutation({
    mutationFn: (datos: DatosProductor) => editarProductor(id, datos),
    onSuccess: invalidar,
  })
}

export function useCambiarEstadoProductor() {
  const invalidar = useInvalidarProductores()
  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      cambiarEstadoProductor(id, activo),
    onSuccess: invalidar,
  })
}

/** Acciones masivas (pantalla 21): activar o desactivar varios productores. */
export function useCambiarEstadoProductores() {
  const invalidar = useInvalidarProductores()
  return useMutation({
    mutationFn: ({ ids, activo }: { ids: string[]; activo: boolean }) =>
      cambiarEstadoProductores(ids, activo),
    onSuccess: invalidar,
  })
}

export function useEnviarMensajeProductores() {
  return useMutation({
    mutationFn: ({ ids, mensaje }: { ids: string[]; mensaje: string }) =>
      enviarMensajeProductores(ids, mensaje),
  })
}

/** Descarga el CSV de la selección o de la lista filtrada. */
export function useExportarProductores() {
  return useMutation({
    mutationFn: async ({
      origen,
      archivo,
    }: {
      origen: Parameters<typeof exportarProductores>[0]
      archivo: string
    }) => {
      const csv = await exportarProductores(origen)
      descargarTexto(csv, archivo, 'text/csv;charset=utf-8')
    },
  })
}
