// Hooks de TanStack Query del feature "cuenta". Las páginas solo usan estos hooks.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { actualizarMisDatos, cambiarContrasena } from './api'

/** Guarda los datos y actualiza el usuario de la sesión (nombre en la barra superior). */
export function useActualizarMisDatos() {
  const { actualizarUsuario } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: actualizarMisDatos,
    onSuccess: (u) => {
      actualizarUsuario(u)
      void queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}

export function useCambiarContrasena() {
  return useMutation({
    mutationFn: ({ actual, nueva }: { actual: string; nueva: string }) =>
      cambiarContrasena(actual, nueva),
  })
}
