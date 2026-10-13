// Hooks de TanStack Query del feature "cultivos". Las páginas solo usan estos hooks.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { agregarCultivo, type DatosCultivo } from './api'

export function useAgregarCultivo(fincaId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: DatosCultivo) => agregarCultivo(fincaId, datos),
    // Los cultivos se muestran dentro de las fincas.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fincas'] }),
  })
}
