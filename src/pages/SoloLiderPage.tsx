import { Link } from 'react-router'
import { AccesoRestringido } from '@/components/layout/AccesoRestringido'
import { buttonClass } from '@/components/ui/Button'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PATHS } from '@/routes/paths'

/** Un técnico entra por URL a una sección del líder (artboard 12e, guía 6.4). */
export default function SoloLiderPage() {
  usePageTitle('Sección del líder técnico')
  return (
    <AccesoRestringido
      titulo="Esta sección es solo para el líder técnico"
      texto="Alertas, mapa de vigilancia, técnicos, parámetros y la edición de productores y fincas los administra el líder técnico."
      accion={
        <Link to={PATHS.inicio} className={buttonClass('primary')}>
          Volver al inicio
        </Link>
      }
    />
  )
}
