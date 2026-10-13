// Hooks del feature "auth". Las páginas solo usan estos hooks.
import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import { PATHS } from '@/routes/paths'
import { confirmarRecuperacion, solicitarCodigo } from '@/services/auth'
import { crearPrimerLider, obtenerEstadoAuth, type DatosPrimerLider } from './api'
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

/** Completa el reto de contraseña temporal (RQF11) y entra al panel. */
export function useConfirmarNuevaContrasena() {
  const { confirmarNuevaContrasena } = useAuth()
  return useMutation({ mutationFn: (nueva: string) => confirmarNuevaContrasena(nueva) })
}

/** Crea la cuenta del primer líder técnico y entra al panel con ella (RQF01). */
export function useCrearPrimerLider() {
  const { iniciarSesion } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (datos: DatosPrimerLider) => {
      await crearPrimerLider(datos)
      // TODO(P-09): si Cognito exige verificar el correo, aquí va el paso de verificación.
      return iniciarSesion(datos.correo, datos.password)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.estado() }),
  })
}

/** Recuperar cuenta, paso 1: envía el código de verificación al correo (RQF06). */
export function useSolicitarCodigo() {
  return useMutation({ mutationFn: (correo: string) => solicitarCodigo(correo) })
}

/** Recuperar cuenta, paso 2: valida el código y fija la nueva contraseña. */
export function useConfirmarRecuperacion() {
  return useMutation({
    mutationFn: ({ correo, codigo, nueva }: { correo: string; codigo: string; nueva: string }) =>
      confirmarRecuperacion(correo, codigo, nueva),
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
