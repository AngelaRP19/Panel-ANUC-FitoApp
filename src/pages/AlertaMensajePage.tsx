import { Navigate, useParams } from 'react-router'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { EstadoAlertaBadge } from '@/components/ui/EstadoBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  esAlertaNoEncontrada,
  MensajeProductores,
  PasosAlerta,
  useAlerta,
} from '@/features/alertas'
import { CATEGORIA_LABEL, VEREDA_LABEL } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { formatearFechaHora } from '@/utils/fechas'

/**
 * Mensaje a productores (diseño 06b · RQF26, RQF45 · solo líder): paso 3 de la comunicación de
 * una alerta. Solo se entra con la alerta confirmada y sin comunicar; si no, vuelve a su detalle.
 */
export default function AlertaMensajePage() {
  const { id = '' } = useParams()
  const alerta = useAlerta(id)
  const detalle = `${PATHS.alertas}/${encodeURIComponent(id)}`

  if (alerta.isError) {
    if (esAlertaNoEncontrada(alerta.error)) return <Navigate to={PATHS.alertas} replace />
    return (
      <Card>
        <ErrorState title="No se pudo cargar la alerta" onRetry={() => alerta.refetch()} />
      </Card>
    )
  }
  if (!alerta.data) return <Skeleton style={{ height: 480 }} />

  const a = alerta.data
  if (a.estado !== 'CONFIRMADA') return <Navigate to={detalle} replace />

  return (
    <>
      <PageHeader
        title="Mensaje a productores"
        breadcrumb={
          <Breadcrumb
            items={[{ label: 'Alertas epidemiológicas', to: detalle }, { label: a.id }]}
          />
        }
        titleExtra={
          <>
            <EstadoAlertaBadge estado={a.estado} />
            <span className="text-cuerpo-sm text-tinta-terciaria tabular-nums">
              {a.id} · {CATEGORIA_LABEL[a.categoria]} · {VEREDA_LABEL[a.vereda]}
              {a.confirmada_por && a.confirmada_en
                ? ` · confirmada por ${a.confirmada_por.nombre} el ${formatearFechaHora(a.confirmada_en)}`
                : ''}
            </span>
          </>
        }
      />
      <PasosAlerta actual={3} />
      <MensajeProductores key={a.id} alerta={a} />
    </>
  )
}
