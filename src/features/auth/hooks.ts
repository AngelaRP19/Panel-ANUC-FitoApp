// Hooks de TanStack Query del feature "auth". Las páginas solo usan estos hooks.
import { useMutation } from '@tanstack/react-query'
import { tokenStore } from '@/context/tokenStore'
import { useAuth } from '@/context/AuthContext'
import { login } from './api'

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

export function useLogin() {
  const { iniciarSesion } = useAuth()
  return useMutation({
    mutationFn: login,
    onSuccess: ({ usuario, token }) => iniciarSesion(usuario, token),
    onError: () => tokenStore.clear(),
  })
}
