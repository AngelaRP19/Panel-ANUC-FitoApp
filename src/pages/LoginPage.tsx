import { useState } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router'
import {
  LoginForm,
  NuevaContrasenaForm,
  PantallaMarca,
  useEstadoAuth,
  useLogout,
  type AvisoLogin,
  type EstadoVueltaLogin,
} from '@/features/auth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { MENSAJES } from '@/locales/es'
import { PATHS } from '@/routes/paths'

/**
 * Inicio de sesión (diseño 01 · RQF02). Con sesión iniciada, PublicOnlyRoute lleva a la ruta
 * guardada o a /inicio. Si aún no hay líder técnico, va a /primer-uso (RQF01).
 */
export default function LoginPage() {
  const [paso, setPaso] = useState<'login' | 'nueva'>('login')
  usePageTitle(paso === 'login' ? 'Inicia sesión' : 'Crea tu nueva contraseña')
  const [params] = useSearchParams()
  const location = useLocation()
  const { data: estado } = useEstadoAuth()
  const cancelar = useLogout()

  if (estado && !estado.hay_lider) return <Navigate to={PATHS.primerUso} replace />

  const vuelta = location.state as EstadoVueltaLogin | null
  let aviso: AvisoLogin | null = null
  if (vuelta?.contrasenaActualizada) {
    aviso = { tono: 'ok', titulo: MENSAJES.contrasenaActualizada, texto: 'Inicia sesión.' }
  } else if (params.get('expirada') === '1') {
    aviso = {
      tono: 'info',
      titulo: 'Tu sesión expiró.',
      texto: 'Vuelve a iniciar sesión para continuar donde estabas.',
    }
  }

  return (
    <PantallaMarca>
      {paso === 'login' ? (
        <LoginForm
          aviso={aviso}
          correoInicial={vuelta?.correo}
          onNuevaContrasena={() => setPaso('nueva')}
        />
      ) : (
        <NuevaContrasenaForm
          onCancelar={async () => {
            await cancelar()
            setPaso('login')
          }}
        />
      )}
    </PantallaMarca>
  )
}
