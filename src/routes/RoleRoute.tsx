import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import type { Rol } from '@/types/enums'
import { PATHS } from './paths'

interface RoleRouteProps {
  roles: Rol[]
}

/**
 * Exige uno de los roles indicados. Va dentro de ProtectedRoute.
 * La UI oculta lo que el rol no puede usar, pero la seguridad real está en el backend.
 */
// TODO(pantalla 4): mostrar «Esta sección es solo para el líder técnico» en lugar de redirigir.
export function RoleRoute({ roles }: RoleRouteProps) {
  const { usuario } = useAuth()
  if (!usuario || !roles.includes(usuario.rol)) return <Navigate to={PATHS.casos} replace />
  return <Outlet />
}
