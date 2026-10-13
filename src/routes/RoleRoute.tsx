import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import SoloLiderPage from '@/pages/SoloLiderPage'
import type { Rol } from '@/types/enums'

interface RoleRouteProps {
  roles: Rol[]
  /**
   * Ruta a la que se redirige si el rol no tiene acceso. Sin ella se muestra «Esta sección
   * es solo para el líder técnico» (secciones del líder abiertas por un técnico).
   */
  redirigirA?: string
}

/**
 * Exige uno de los roles indicados. Va dentro de ProtectedRoute.
 * La UI oculta lo que el rol no puede usar, pero la seguridad real está en el backend.
 */
export function RoleRoute({ roles, redirigirA }: RoleRouteProps) {
  const { usuario } = useAuth()
  if (usuario && roles.includes(usuario.rol)) return <Outlet />
  return redirigirA ? <Navigate to={redirigirA} replace /> : <SoloLiderPage />
}
