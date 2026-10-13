import { Navigate, Outlet, useLocation } from 'react-router'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { PATHS } from './paths'

/** Exige sesión iniciada. Si no la hay, va a /login recordando la ruta para volver. */
export function ProtectedRoute() {
  const { usuario, cargando, sesionExpirada } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner etiqueta="Cargando el panel" />
      </div>
    )
  }
  if (!usuario) {
    const destino = sesionExpirada ? `${PATHS.login}?expirada=1` : PATHS.login
    return <Navigate to={destino} replace state={{ from: location }} />
  }
  return <Outlet />
}
