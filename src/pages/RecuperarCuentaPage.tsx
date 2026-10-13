import { useState } from 'react'
import { useNavigate } from 'react-router'
import { WifiOff } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import {
  NuevaContrasenaRecuperacionForm,
  PantallaMarca,
  SolicitarCodigoForm,
  type EstadoVueltaLogin,
} from '@/features/auth'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { usePageTitle } from '@/hooks/usePageTitle'
import { MENSAJES } from '@/locales/es'
import { PATHS } from '@/routes/paths'

/**
 * Recuperar cuenta (diseños 01c, 01d y 01e · RQF06), para ambos roles. Dos pasos en la misma
 * ruta; al terminar vuelve al login con «Contraseña actualizada. Inicia sesión.».
 */
export default function RecuperarCuentaPage() {
  const [correo, setCorreo] = useState<string | null>(null)
  usePageTitle(correo ? 'Crea una nueva contraseña' : 'Recupera tu cuenta')
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()

  const alCambiar = (correoCuenta: string) => {
    const estado: EstadoVueltaLogin = { contrasenaActualizada: true, correo: correoCuenta }
    navigate(PATHS.login, { replace: true, state: estado })
  }

  return (
    <PantallaMarca>
      {!enLinea && (
        <div className="w-full max-w-110">
          <Aviso tono="peligro" titulo={MENSAJES.sinConexion} icono={WifiOff}>
            Revisa tu conexión a internet para enviar o validar el código.
          </Aviso>
        </div>
      )}
      {correo === null ? (
        <SolicitarCodigoForm onEnviado={setCorreo} />
      ) : (
        <NuevaContrasenaRecuperacionForm correo={correo} onCambiada={() => alCambiar(correo)} />
      )}
    </PantallaMarca>
  )
}
