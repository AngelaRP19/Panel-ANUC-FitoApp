import { Navigate, useParams } from 'react-router'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { EstadoAlertaBadge } from '@/components/ui/EstadoBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { CorreccionAlerta, esAlertaNoEncontrada, useAlerta } from '@/features/alertas'
import { CATEGORIA_LABEL, VEREDA_LABEL } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { formatearFechaHora } from '@/utils/fechas'

/**
 * Corregir alerta (D-17 · solo líder): una alerta comunicada por error se corrige una sola vez,
 * con la plantilla fija y la explicación del líder, a los mismos destinatarios. Solo se entra con
 * la alerta Comunicada; en cualquier otro estado vuelve a su detalle.
 */
export default function AlertaCorreccionPage() {
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
  if (a.estado !== 'COMUNICADA') return <Navigate to={detalle} replace />

  return (
    <>
      <PageHeader
        title="Corregir alerta"
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
              {a.comunicada_en ? ` · comunicada el ${formatearFechaHora(a.comunicada_en)}` : ''}
            </span>
          </>
        }
      />
      <CorreccionAlerta key={a.id} alerta={a} />
    </>
  )
}
