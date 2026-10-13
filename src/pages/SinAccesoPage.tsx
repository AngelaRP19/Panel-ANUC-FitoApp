import { Link, useSearchParams } from 'react-router'
import { AccesoRestringido } from '@/components/layout/AccesoRestringido'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { buttonClass } from '@/components/ui/Button'
import { useResumenNavegacion } from '@/features/navegacion'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PATHS } from '@/routes/paths'

/**
 * «No tienes acceso a este caso» (artboard 12e): un técnico abrió un caso asignado a otro.
 * `?caso=0237` indica el caso; el backend responde 404 para no revelar que existe.
 */
export default function SinAccesoPage() {
  usePageTitle('Sin acceso al caso')
  const [params] = useSearchParams()
  const caso = params.get('caso')
  const { data } = useResumenNavegacion()
  const lider = data?.lider?.nombre

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Mis casos asignados', to: PATHS.casos },
          { label: caso ? `Caso #${caso}` : 'Caso' },
        ]}
      />
      <AccesoRestringido
        titulo="No tienes acceso a este caso"
        texto={
          <>
            {caso ? (
              <>
                El caso <span className="codigo">#{caso}</span> está asignado a otro técnico.
              </>
            ) : (
              'Este caso está asignado a otro técnico.'
            )}{' '}
            Solo puedes ver y gestionar los casos que el líder técnico te asignó.
          </>
        }
        accion={
          <Link to={PATHS.casos} className={buttonClass('primary')}>
            Ir a mis casos
          </Link>
        }
        pista={
          lider
            ? `¿Crees que deberías atenderlo? Pídele a ${lider}, líder técnico, que te lo asigne.`
            : '¿Crees que deberías atenderlo? Pídele al líder técnico que te lo asigne.'
        }
      />
    </>
  )
}
