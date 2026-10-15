// Hooks de TanStack Query del feature "notificaciones".
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarNotificaciones, marcarNotificacionesLeidas } from './api'

export const notificacionesKeys = {
  lista: ['notificaciones'] as const,
}

/** Avisos de la campana. Solo se piden cuando el panel está abierto (`enabled`). */
export function useNotificacionesCampana(enabled: boolean) {
  return useQuery({
    queryKey: notificacionesKeys.lista,
    queryFn: listarNotificaciones,
    enabled,
  })
}

/** «Marcar como leídas»: refresca la lista y el contador de la campana. */
export function useMarcarLeidas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: marcarNotificacionesLeidas,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificacionesKeys.lista })
      void queryClient.invalidateQueries({ queryKey: ['navegacion'] })
    },
  })
}
