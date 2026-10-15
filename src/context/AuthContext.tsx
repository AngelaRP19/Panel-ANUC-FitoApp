import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, registrarSesionExpirada } from '@/services/apiClient'
import * as auth from '@/services/auth'
import type { ResultadoInicioSesion } from '@/services/auth'
import type { Rol } from '@/types/enums'

/** Usuario de la sesión (GET /me). El rol sale de aquí, no del token. */
export interface UsuarioSesion {
  id: string
  nombre: string
  correo: string
  celular: string
  rol: Rol
  activo: boolean
}

interface AuthContextValue {
  usuario: UsuarioSesion | null
  /** true mientras se restaura la sesión al cargar la aplicación. */
  cargando: boolean
  /** true si la sesión terminó porque el servidor rechazó el token. */
  sesionExpirada: boolean
  iniciarSesion: (correo: string, contrasena: string) => Promise<ResultadoInicioSesion>
  confirmarNuevaContrasena: (nueva: string) => Promise<void>
  cerrarSesion: () => Promise<void>
  /** Reemplaza los datos del usuario de la sesión (Mi cuenta, tras PATCH /me). */
  actualizarUsuario: (u: UsuarioSesion) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function obtenerUsuarioActual(): Promise<UsuarioSesion> {
  const { data } = await api.get<UsuarioSesion>('/me')
  return data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [sesionExpirada, setSesionExpirada] = useState(false)

  // Restaura la sesión del proveedor de identidad al cargar.
  useEffect(() => {
    let vigente = true
    auth
      .obtenerToken()
      .then((token) => (token ? obtenerUsuarioActual() : null))
      .then((u) => vigente && setUsuario(u))
      .catch(() => vigente && setUsuario(null))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [])

  // Un 401 de la API cierra la sesión local; las rutas protegidas llevan a /login?expirada=1.
  useEffect(() => {
    registrarSesionExpirada(() => {
      setSesionExpirada(true)
      setUsuario(null)
      void auth.cerrarSesion()
    })
    return () => registrarSesionExpirada(null)
  }, [])

  const completarInicio = useCallback(async () => {
    setUsuario(await obtenerUsuarioActual())
    setSesionExpirada(false)
  }, [])

  const iniciarSesion = useCallback(
    async (correo: string, contrasena: string) => {
      const resultado = await auth.iniciarSesion(correo, contrasena)
      if (resultado.paso === 'LISTO') await completarInicio()
      return resultado
    },
    [completarInicio],
  )

  const confirmarNuevaContrasena = useCallback(
    async (nueva: string) => {
      await auth.confirmarNuevaContrasena(nueva)
      await completarInicio()
    },
    [completarInicio],
  )

  const cerrarSesion = useCallback(async () => {
    try {
      await auth.cerrarSesion()
    } finally {
      setUsuario(null)
      setSesionExpirada(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      usuario,
      cargando,
      sesionExpirada,
      iniciarSesion,
      confirmarNuevaContrasena,
      cerrarSesion,
      actualizarUsuario: setUsuario,
    }),
    [usuario, cargando, sesionExpirada, iniciarSesion, confirmarNuevaContrasena, cerrarSesion],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
