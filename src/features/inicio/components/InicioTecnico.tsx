import { Link } from 'react-router'
import { Archive, ChevronRight, ClipboardCheck, ClipboardList, Clock, Search } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { EstadoCasoBadge } from '@/components/ui/EstadoBadge'
import { ResultadoTecnicoBadge } from '@/components/ui/ResultadoTecnicoBadge'
import { CATEGORIA_LABEL } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { formatearFechaCorta, formatearHora, nombreMes, tiempoEspera } from '@/utils/fechas'
import type { ResumenTecnico } from '../types'
import { Kpi } from './KpiCards'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** KPI del técnico (artboard 12a): en revisión, registrados sin cerrar, cerrados y por vencer. */
export function KpisTecnico({ resumen }: { resumen: ResumenTecnico }) {
  const { kpis, generado_en } = resumen
  const mes = nombreMes(generado_en)
  const c = kpis.cerrados_mes
  const registrados = kpis.registrados_sin_cerrar
  const desglose = [
    c.confirmados && plural(c.confirmados, 'confirmado', 'confirmados'),
    c.otra_patologia && `${c.otra_patologia} otra patología`,
    c.requiere_visita && `${c.requiere_visita} requiere visita`,
    c.no_identificado && `${c.no_identificado} no identificado`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        to={`${PATHS.casos}?estado=EN_REVISION`}
        rotulo="Mis casos en revisión"
        valor={kpis.en_revision}
        pie={
          kpis.en_revision_mas_48h > 0
            ? `${kpis.en_revision_mas_48h} con más de 48 h en espera`
            : 'Ninguno con más de 48 h en espera'
        }
        pieDestacado={kpis.en_revision_mas_48h > 0}
        icon={ClipboardList}
        iconClass="bg-advertencia-suave text-advertencia"
        ariaLabel={`${plural(kpis.en_revision, 'caso tuyo', 'casos tuyos')} en revisión, ${kpis.en_revision_mas_48h} con más de 48 horas. Ver mis casos`}
      />
      <Kpi
        to={`${PATHS.casos}?estado=REGISTRADO`}
        rotulo="Registrados sin cerrar"
        valor={registrados.length}
        pie={
          registrados.length === 0
            ? 'Ninguno pendiente de cerrar'
            : registrados.length === 1
              ? `#${registrados[0]} con diagnóstico guardado, falta cerrar`
              : `${registrados.map((id) => `#${id}`).join(', ')} con diagnóstico guardado`
        }
        icon={Search}
        iconClass="bg-revision-suave text-revision"
        ariaLabel={`${plural(registrados.length, 'caso tuyo registrado', 'casos tuyos registrados')}, falta cerrarlos. Ver mis casos`}
      />
      <Kpi
        to={`${PATHS.casos}?estado=CERRADO`}
        rotulo={`Cerrados por ti en ${mes}`}
        valor={c.total}
        pie={desglose || 'Aún no has cerrado casos este mes'}
        icon={ClipboardCheck}
        iconClass="bg-verde-100 text-verde-700"
        ariaLabel={`${plural(c.total, 'caso cerrado', 'casos cerrados')} por ti en ${mes}. Ver mis casos`}
      />
      <Kpi
        to={`${PATHS.casos}?estado=CERRADO&vencimiento=15`}
        rotulo="Próximos a vencer"
        valor={kpis.proximos_a_vencer}
        pie={`Fecha de vencimiento de conservación en menos de ${kpis.dias_aviso_vencimiento} días`}
        icon={Archive}
        iconClass="bg-neutro-suave text-neutro"
        ariaLabel={`${plural(kpis.proximos_a_vencer, 'caso tuyo próximo', 'casos tuyos próximos')} a vencer. Ver mis casos`}
      />
    </div>
  )
}

/** «Tus casos por atender»: en revisión (los que más esperan primero) y registrados. */
export function CasosPorAtender({ casos }: { casos: ResumenTecnico['por_atender'] }) {
  return (
    <Card labelledBy="t-mis" className="lg:col-span-8">
      <CardHeader
        id="t-mis"
        title="Tus casos por atender"
        actions={
          <Link to={PATHS.casos} className="text-cuerpo-sm enlace">
            Ver mis casos
          </Link>
        }
      />
      {casos.length === 0 ? (
        <div className="p-6">
          <EmptyState message="No tienes casos por atender. Cuando el líder técnico te asigne uno, aparecerá aquí." />
        </div>
      ) : (
        <ul className="m-0 list-none p-0 text-cuerpo-sm">
          {casos.map((c) => {
            const espera = c.enviado_a_panel_en ? tiempoEspera(c.enviado_a_panel_en) : '—'
            const larga = c.estado === 'EN_REVISION' && c.mas_48h
            return (
              <li key={c.id} className="border-b border-borde last:border-b-0">
                <Link
                  to={PATHS.caso(c.id)}
                  aria-label={`Caso #${c.id}, ${c.productor_nombre}, ${c.estado === 'EN_REVISION' ? 'En revisión' : 'Registrado'}, ${espera}`}
                  className="grid min-h-12 grid-cols-[88px_1fr_auto_40px] items-center text-tinta no-underline hover:bg-verde-100 sm:grid-cols-[96px_1fr_150px_110px_44px]"
                >
                  <span className="pl-6 codigo font-semibold text-verde-700">#{c.id}</span>
                  <span className="truncate px-3 py-2.5">{c.productor_nombre}</span>
                  <span className="hidden px-3 sm:block">
                    <EstadoCasoBadge estado={c.estado} />
                  </span>
                  <span className="px-3">
                    {larga ? (
                      <span className="inline-flex items-center gap-1 text-nota font-semibold text-advertencia">
                        <Clock size={14} strokeWidth={2} aria-hidden="true" />
                        {espera}
                      </span>
                    ) : (
                      <span className="text-tinta-secundaria">{espera}</span>
                    )}
                  </span>
                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    className="mr-4 justify-self-end text-tinta-terciaria"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/** «Tus diagnósticos recientes»: caso, fecha y resultado técnico con su categoría. */
export function DiagnosticosRecientes({
  diagnosticos,
}: {
  diagnosticos: ResumenTecnico['diagnosticos_recientes']
}) {
  return (
    <Card labelledBy="t-rec" className="lg:col-span-4">
      <CardHeader id="t-rec" title="Tus diagnósticos recientes" />
      {diagnosticos.length === 0 ? (
        <p className="px-6 py-6 text-cuerpo-sm text-tinta-terciaria">
          Aún no has registrado diagnósticos.
        </p>
      ) : (
        <ul className="m-0 list-none px-6 pt-1 pb-4">
          {diagnosticos.map((d) => (
            <li
              key={d.caso_id}
              className="flex flex-col gap-1.5 border-b border-borde py-2.5 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <Link to={PATHS.caso(d.caso_id)} className="codigo enlace">
                  #{d.caso_id}
                </Link>
                <span className="ml-auto text-cuerpo-sm text-tinta-terciaria tabular-nums">
                  {formatearFechaCorta(d.registrado_en)} · {formatearHora(d.registrado_en)}
                </span>
              </div>
              <span className="self-start">
                <ResultadoTecnicoBadge
                  resultado={d.resultado_tecnico}
                  detalle={d.categoria ? CATEGORIA_LABEL[d.categoria] : null}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
