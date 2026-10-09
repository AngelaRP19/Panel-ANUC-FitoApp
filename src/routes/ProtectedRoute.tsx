import { Navigate, Outlet, useLocation } from 'react-router'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'

/** Exige sesión iniciada. Si no la hay, redirige a /login conservando la ruta de origen. */
export function ProtectedRoute() {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (!usuario) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
