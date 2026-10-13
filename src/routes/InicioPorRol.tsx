import { Navigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import InicioPage from '@/pages/InicioPage'
import { Rol } from '@/types/enums'
import { PATHS } from './paths'

/** /inicio: el líder ve su resumen (pantalla 16); el técnico va a sus casos hasta la pantalla 17. */
export function InicioPorRol() {
  const { usuario } = useAuth()
  return usuario?.rol === Rol.LIDER_TECNICO ? <InicioPage /> : <Navigate to={PATHS.casos} replace />
}
