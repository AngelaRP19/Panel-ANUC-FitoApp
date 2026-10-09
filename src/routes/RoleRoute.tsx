import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import type { Rol } from '@/types/enums'

interface RoleRouteProps {
  roles: Rol[]
}

/** Exige que el usuario tenga uno de los roles indicados. Va dentro de ProtectedRoute. */
export function RoleRoute({ roles }: RoleRouteProps) {
  const { usuario } = useAuth()
  if (!usuario || !roles.includes(usuario.rol)) return <Navigate to="/casos" replace />
  return <Outlet />
}
