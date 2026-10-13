import { Construction, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/context/AuthContext'
import { useLogout } from '@/features/auth'
import { ROL_LABEL, etiqueta } from '@/locales/es'
import { iniciales } from '@/utils/texto'

/**
 * Mi cuenta: por ahora solo la cabecera del artboard 11 con «Cerrar sesión» (el chip de usuario
 * de la barra superior lleva aquí). Datos, contraseña y notificaciones llegan con la pantalla 15.
 */
export default function MiCuentaPage() {
  const { usuario } = useAuth()
  const cerrarSesion = useLogout()
  if (!usuario) return null

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-14 flex-none place-items-center rounded-full bg-verde-100 font-titulos text-h3 font-bold text-verde-800"
        >
          {iniciales(usuario.nombre)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="titulo-h1">Mi cuenta</h1>
          <p className="text-cuerpo-sm text-tinta-terciaria">
            {usuario.nombre} · {etiqueta(ROL_LABEL, usuario.rol)}
          </p>
        </div>
        <Button variant="secondary" onClick={cerrarSesion}>
          <LogOut aria-hidden="true" /> Cerrar sesión
        </Button>
      </div>
      <Card>
        <EmptyState
          icon={Construction}
          title="Pantalla en construcción"
          message="Tus datos personales, el cambio de contraseña y las notificaciones llegan con la pantalla 15 del plan de desarrollo."
        />
      </Card>
    </>
  )
}
