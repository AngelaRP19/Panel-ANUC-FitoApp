import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Rol } from '@/types/enums'
import { tokenStore } from './tokenStore'

export interface UsuarioSesion {
  id: string
  nombre: string
  correo: string
  rol: Rol
}

interface AuthContextValue {
  usuario: UsuarioSesion | null
  /** true mientras se intenta restaurar la sesión con /auth/refresh al cargar. */
  cargando: boolean
  iniciarSesion: (usuario: UsuarioSesion, accessToken: string) => void
  cerrarSesion: () => void
  setCargando: (cargando: boolean) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null)
  // TODO(F2): arrancar en true y restaurar la sesión (/auth/refresh + /auth/me) desde features/auth.
  const [cargando, setCargando] = useState(false)

  const iniciarSesion = useCallback((u: UsuarioSesion, accessToken: string) => {
    tokenStore.set(accessToken)
    setUsuario(u)
  }, [])

  const cerrarSesion = useCallback(() => {
    tokenStore.clear()
    setUsuario(null)
  }, [])

  const value = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion, setCargando }),
    [usuario, cargando, iniciarSesion, cerrarSesion],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
