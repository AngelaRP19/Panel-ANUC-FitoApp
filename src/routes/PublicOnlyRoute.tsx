import { Navigate, Outlet, useLocation, type Location } from 'react-router'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { PATHS } from './paths'

/** Rutas públicas (login, primer uso, recuperar cuenta): con sesión, vuelve a donde iba o a /inicio. */
export function PublicOnlyRoute() {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner etiqueta="Cargando" />
      </div>
    )
  }
  if (usuario) {
    const desde = (location.state as { from?: Location } | null)?.from
    const destino = desde ? `${desde.pathname}${desde.search}` : PATHS.inicio
    return <Navigate to={destino} replace />
  }
  return <Outlet />
}
