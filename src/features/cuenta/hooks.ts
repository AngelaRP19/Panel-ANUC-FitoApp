// Hooks de TanStack Query del feature "cuenta". Las páginas solo usan estos hooks.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import {
  actualizarMisDatos,
  cambiarContrasena,
  guardarNotificaciones,
  obtenerNotificaciones,
} from './api'

export const cuentaKeys = {
  notificaciones: ['cuenta', 'notificaciones'] as const,
}

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

export function useNotificaciones() {
  return useQuery({ queryKey: cuentaKeys.notificaciones, queryFn: obtenerNotificaciones })
}

export function useGuardarNotificaciones() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: guardarNotificaciones,
    onSuccess: (a) => queryClient.setQueryData(cuentaKeys.notificaciones, a),
  })
}
