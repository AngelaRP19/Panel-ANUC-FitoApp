// Hooks de TanStack Query del feature "alertas". Las páginas solo usan estos hooks.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { confirmarAlerta, descartarAlerta, listarAlertas, obtenerAlerta, seguirAlerta } from './api'
import type { Alerta, FiltrosAlertas } from './types'

export const alertasKeys = {
  all: ['alertas'] as const,
  lists: () => [...alertasKeys.all, 'list'] as const,
  list: (f: FiltrosAlertas) => [...alertasKeys.lists(), f] as const,
  detail: (id: string) => [...alertasKeys.all, 'detail', id] as const,
}

export const FILTROS_ALERTAS_VACIOS: FiltrosAlertas = { estado: '', page: '1' }

export function useFiltrosAlertas() {
  return useUrlFilters(FILTROS_ALERTAS_VACIOS)
}

export function useAlertas(f: FiltrosAlertas) {
  return useQuery({
    queryKey: alertasKeys.list(f),
    queryFn: () => listarAlertas(f),
    placeholderData: keepPreviousData,
  })
}

export function useAlerta(id: string | null) {
  return useQuery({
    queryKey: alertasKeys.detail(id ?? ''),
    queryFn: () => obtenerAlerta(id!),
    enabled: !!id,
  })
}

/** Guarda la alerta devuelta y refresca listas, contadores de navegación e inicio. */
function useAlActualizar() {
  const queryClient = useQueryClient()
  return (a: Alerta) => {
    queryClient.setQueryData(alertasKeys.detail(a.id), a)
    void queryClient.invalidateQueries({ queryKey: alertasKeys.lists() })
    void queryClient.invalidateQueries({ queryKey: ['navegacion'] })
    void queryClient.invalidateQueries({ queryKey: ['inicio'] })
  }
}

export function useConfirmarAlerta() {
  const actualizar = useAlActualizar()
  return useMutation({ mutationFn: confirmarAlerta, onSuccess: actualizar })
}

export function useDescartarAlerta() {
  const actualizar = useAlActualizar()
  return useMutation({
    mutationFn: ({ id, justificacion }: { id: string; justificacion: string }) =>
      descartarAlerta(id, justificacion),
    onSuccess: actualizar,
  })
}

export function useSeguirAlerta() {
  const actualizar = useAlActualizar()
  return useMutation({
    mutationFn: ({ id, seguir }: { id: string; seguir: boolean }) => seguirAlerta(id, seguir),
    onSuccess: actualizar,
  })
}
