// Hooks de TanStack Query del feature "fincas". Las páginas solo usan estos hooks.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import {
  editarFinca,
  listarFincas,
  obtenerFinca,
  obtenerResumenFincas,
  registrarFinca,
} from './api'
import type { DatosFinca, FiltrosFincas } from './types'

export const fincasKeys = {
  all: ['fincas'] as const,
  lists: () => [...fincasKeys.all, 'list'] as const,
  list: (f: FiltrosFincas) => [...fincasKeys.lists(), f] as const,
  resumen: () => [...fincasKeys.all, 'resumen'] as const,
  detail: (id: string) => [...fincasKeys.all, 'detail', id] as const,
}

export const FILTROS_FINCAS_VACIOS: FiltrosFincas = {
  q: '',
  vereda: '',
  especie: '',
  tipo: '',
  casos: '',
  productor: '',
  page: '1',
}

export function useFiltrosFincas() {
  return useUrlFilters(FILTROS_FINCAS_VACIOS)
}

export function useFincas(f: FiltrosFincas) {
  return useQuery({
    queryKey: fincasKeys.list(f),
    queryFn: () => listarFincas(f),
    placeholderData: keepPreviousData,
  })
}

export function useResumenFincas() {
  return useQuery({ queryKey: fincasKeys.resumen(), queryFn: obtenerResumenFincas })
}

export function useFinca(id: string | null) {
  return useQuery({
    queryKey: fincasKeys.detail(id ?? ''),
    queryFn: () => obtenerFinca(id!),
    enabled: !!id,
  })
}

/** Invalida fincas y lo que depende de ellas (productores y detalle de casos). */
function useInvalidarFincas() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: fincasKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['productores'] })
    void queryClient.invalidateQueries({ queryKey: ['casos', 'detail'] })
  }
}

export function useRegistrarFinca() {
  const invalidar = useInvalidarFincas()
  return useMutation({ mutationFn: registrarFinca, onSuccess: invalidar })
}

export function useEditarFinca(id: string) {
  const invalidar = useInvalidarFincas()
  return useMutation({
    mutationFn: (datos: DatosFinca) => editarFinca(id, datos),
    onSuccess: invalidar,
  })
}
