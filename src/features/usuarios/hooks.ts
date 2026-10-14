// Hooks de TanStack Query del feature "usuarios". Las páginas solo usan estos hooks.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import {
  cambiarEstadoCuenta,
  editarCuenta,
  listarCuentas,
  obtenerCuenta,
  registrarCuenta,
} from './api'
import type { DatosCuenta, FiltrosCuentas } from './types'

export const usuariosKeys = {
  all: ['usuarios'] as const,
  lists: () => [...usuariosKeys.all, 'list'] as const,
  list: (f: FiltrosCuentas) => [...usuariosKeys.lists(), f] as const,
  detail: (id: string) => [...usuariosKeys.all, 'detail', id] as const,
}

export const FILTROS_CUENTAS_VACIOS: FiltrosCuentas = {
  q: '',
  rol: '',
  estado: '',
  carga: '',
  page: '1',
}

export function useFiltrosCuentas() {
  return useUrlFilters(FILTROS_CUENTAS_VACIOS)
}

export function useCuentas(f: FiltrosCuentas) {
  return useQuery({
    queryKey: usuariosKeys.list(f),
    queryFn: () => listarCuentas(f),
    placeholderData: keepPreviousData,
  })
}

export function useCuenta(id: string | null) {
  return useQuery({
    queryKey: usuariosKeys.detail(id ?? ''),
    queryFn: () => obtenerCuenta(id!),
    enabled: !!id,
  })
}

/** Invalida cuentas y lo que depende de ellas (asignación, bandeja, contadores, inicio). */
function useInvalidarCuentas() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: usuariosKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['tecnicos'] })
    void queryClient.invalidateQueries({ queryKey: ['casos'] })
    void queryClient.invalidateQueries({ queryKey: ['navegacion'] })
    void queryClient.invalidateQueries({ queryKey: ['inicio'] })
  }
}

export function useRegistrarCuenta() {
  const invalidar = useInvalidarCuentas()
  return useMutation({ mutationFn: registrarCuenta, onSuccess: invalidar })
}

export function useEditarCuenta(id: string) {
  const invalidar = useInvalidarCuentas()
  return useMutation({
    mutationFn: (datos: DatosCuenta) => editarCuenta(id, datos),
    onSuccess: invalidar,
  })
}

export function useCambiarEstadoCuenta() {
  const invalidar = useInvalidarCuentas()
  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      cambiarEstadoCuenta(id, activo),
    onSuccess: invalidar,
  })
}
