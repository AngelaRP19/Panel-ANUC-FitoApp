// Hooks del feature "auth". Las páginas solo usan estos hooks.
import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import { PATHS } from '@/routes/paths'
import { obtenerEstadoAuth } from './api'
import type { LoginValues } from './schemas'

export const authKeys = {
  all: ['auth'] as const,
  estado: () => [...authKeys.all, 'estado'] as const,
}

export function useEstadoAuth() {
  return useQuery({ queryKey: authKeys.estado(), queryFn: obtenerEstadoAuth })
}

/** Inicia sesión. El resultado indica si hay que cambiar la contraseña temporal. */
export function useLogin() {
  const { iniciarSesion } = useAuth()
  return useMutation({
    mutationFn: ({ correo, password }: LoginValues) => iniciarSesion(correo, password),
  })
}

/** Cierra la sesión (si el proveedor falla, igual se limpia la sesión local). */
export function useLogout() {
  const { cerrarSesion } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useCallback(async () => {
    await cerrarSesion()
    queryClient.clear()
    navigate(PATHS.login, { replace: true })
  }, [cerrarSesion, queryClient, navigate])
}
