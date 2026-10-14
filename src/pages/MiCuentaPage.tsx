import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RolBadge } from '@/components/ui/RolBadge'
import { useAuth } from '@/context/AuthContext'
import { useLogout } from '@/features/auth'
import { CambiarContrasenaForm, DatosPersonalesForm, NotificacionesForm } from '@/features/cuenta'
import { iniciales } from '@/utils/texto'

/**
 * Mi cuenta (diseño 11 líder · 12f técnico · RQF04): datos personales, cambio de contraseña
 * y preferencias de notificación. Cada usuario edita solo su cuenta; el rol no se cambia aquí.
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
          <p className="flex flex-wrap items-center gap-1.5 text-cuerpo-sm text-tinta-secundaria">
            {usuario.nombre} · <RolBadge rol={usuario.rol} />
          </p>
        </div>
        <Button variant="text" onClick={cerrarSesion}>
          <LogOut aria-hidden="true" /> Cerrar sesión
        </Button>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-12">
        <DatosPersonalesForm usuario={usuario} />
        <CambiarContrasenaForm />
        <NotificacionesForm />
      </div>
    </>
  )
}
