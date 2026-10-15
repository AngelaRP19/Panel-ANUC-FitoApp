import { useAuth } from '@/context/AuthContext'
import InicioPage from '@/pages/InicioPage'
import InicioTecnicoPage from '@/pages/InicioTecnicoPage'
import { Rol } from '@/types/enums'

/** /inicio: el líder ve su resumen (pantalla 16) y el técnico el suyo (pantalla 17). */
export function InicioPorRol() {
  const { usuario } = useAuth()
  return usuario?.rol === Rol.LIDER_TECNICO ? <InicioPage /> : <InicioTecnicoPage />
}
