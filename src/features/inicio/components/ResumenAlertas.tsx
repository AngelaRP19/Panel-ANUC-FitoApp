import { Link } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { ESTADO_ALERTA_TONO } from '@/features/alertas'
import { CATEGORIA_LABEL, ESTADO_ALERTA_LABEL, VEREDA_LABEL, etiqueta } from '@/locales/es'
import { formatearFechaCorta } from '@/utils/fechas'
import type { AlertaReciente, ResumenPanel } from '../types'

const vereda = (v: string) => etiqueta(VEREDA_LABEL, v, v)

function detalle(a: AlertaReciente) {
  const base = `${CATEGORIA_LABEL[a.categoria]} · ${vereda(a.vereda)}`
  if (a.estado === 'CONFIRMADA') return `${base} · falta comunicar`
  if (a.estado === 'COMUNICADA' && a.productores_notificados !== null)
    return `${base} · ${a.productores_notificados} productores`
  return `${base} · ${a.num_casos} casos`
}

export function ResumenAlertas({ alertas }: { alertas: ResumenPanel['alertas'] }) {
  const { generadas_sin_revisar: n, destacada, recientes } = alertas
  return (
    <Card labelledBy="t-al" className="lg:col-span-5">
      <CardHeader
        id="t-al"
        title="Resumen de alertas"
        actions={
          <Link to="/alertas" className="text-cuerpo-sm enlace">
            Ver alertas
          </Link>
        }
      />
      <div className="flex items-center gap-4 px-6 pt-4 pb-2">
        <div>
          <div className="sobretitulo">Alertas generadas</div>
          <div className="font-titulos text-kpi font-bold tabular-nums">{n}</div>
        </div>
        <p className="border-l border-borde pl-4 text-cuerpo-sm text-tinta-secundaria">
          {n > 0 && destacada
            ? `Sin revisar · posible concentración de ${CATEGORIA_LABEL[destacada.categoria]} en ${vereda(destacada.vereda)}. `
            : 'No hay alertas pendientes de revisión. '}
          Una alerta generada es una posibilidad, no un hecho.
        </p>
      </div>
      {recientes.length > 0 ? (
        <ul className="px-6 pb-4">
          {recientes.map((a) => (
            <li key={a.id} className="border-t border-borde">
              <Link
                to={`/alertas/${a.id}`}
                className="flex items-center gap-3 py-2.5 text-cuerpo-sm text-tinta no-underline hover:bg-verde-50"
              >
                <Badge tone={ESTADO_ALERTA_TONO[a.estado]}>{ESTADO_ALERTA_LABEL[a.estado]}</Badge>
                <span className="min-w-0 flex-1 truncate">{detalle(a)}</span>
                <span className="text-tinta-terciaria tabular-nums">
                  {formatearFechaCorta(a.generada_en)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-6 pb-6 text-cuerpo-sm text-tinta-terciaria">
          Aún no se han generado alertas.
        </p>
      )}
    </Card>
  )
}
