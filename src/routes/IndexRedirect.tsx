import { Navigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import { Rol } from '@/types/enums'
import { PATHS } from './paths'

/**
 * Destino de «/» y de /inicio mientras no existan las pantallas de inicio por rol:
 * el líder va a su inicio (pantalla 16) y el técnico a sus casos (la 17 aún no existe).
 */
export function IndexRedirect() {
  const { usuario } = useAuth()
  return <Navigate to={usuario?.rol === Rol.LIDER_TECNICO ? PATHS.inicio : PATHS.casos} replace />
}
