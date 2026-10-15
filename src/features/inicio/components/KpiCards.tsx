import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Archive, ClipboardCheck, ClipboardList, Search, type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'
import { nombreMes } from '@/utils/fechas'
import type { ResumenPanel } from '../types'

interface KpiProps {
  to: string
  rotulo: string
  valor: number
  pie: ReactNode
  pieDestacado?: boolean
  icon: LucideIcon
  iconClass: string
  ariaLabel: string
}

/** Tarjeta KPI enlazada (pf-kpi): rótulo, valor, pie e icono. La usan ambos inicios. */
export function Kpi({
  to,
  rotulo,
  valor,
  pie,
  pieDestacado,
  icon: Icon,
  iconClass,
  ariaLabel,
}: KpiProps) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className="block rounded-lg border border-borde bg-blanco p-6 text-tinta no-underline shadow-1 transition-colors hover:border-verde-300"
    >
      <span
        aria-hidden="true"
        className={cn('float-right grid size-9 place-items-center rounded-md', iconClass)}
      >
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <div className="sobretitulo">{rotulo}</div>
      <div className="font-titulos text-kpi font-bold tabular-nums">{valor}</div>
      <div
        className={cn(
          'text-nota',
          pieDestacado ? 'font-medium text-advertencia' : 'text-tinta-terciaria',
        )}
      >
        {pie}
      </div>
    </Link>
  )
}

function plural(n: number, singular: string, pluralTxt: string) {
  return `${n} ${n === 1 ? singular : pluralTxt}`
}

export function KpiCards({ resumen }: { resumen: ResumenPanel }) {
  const { kpis, generado_en } = resumen
  const mes = nombreMes(generado_en)
  const c = kpis.cerrados_mes
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
        to="/casos?estado=PENDIENTE_REVISION"
        rotulo="Pendientes de revisión"
        valor={kpis.pendientes_revision}
        pie={
          kpis.pendientes_mas_48h > 0
            ? `Sin técnico asignado · ${kpis.pendientes_mas_48h} con más de 48 h`
            : 'Sin técnico asignado'
        }
        pieDestacado={kpis.pendientes_mas_48h > 0}
        icon={ClipboardList}
        iconClass="bg-advertencia-suave text-advertencia"
        ariaLabel={`${plural(kpis.pendientes_revision, 'caso pendiente', 'casos pendientes')} de revisión sin técnico asignado, ${kpis.pendientes_mas_48h} con más de 48 horas en espera. Ver en casos`}
      />
      <Kpi
        to="/casos?estado=EN_REVISION"
        rotulo="En revisión"
        valor={kpis.en_revision}
        pie="Con técnico asignado y sin diagnóstico"
        icon={Search}
        iconClass="bg-revision-suave text-revision"
        ariaLabel={`${plural(kpis.en_revision, 'caso', 'casos')} en revisión, con técnico asignado y sin diagnóstico. Ver en casos`}
      />
      <Kpi
        to="/casos?estado=CERRADO"
        rotulo={`Cerrados en ${mes}`}
        valor={c.total}
        pie={desglose || 'Aún no hay casos cerrados este mes'}
        icon={ClipboardCheck}
        iconClass="bg-verde-100 text-verde-700"
        ariaLabel={`${plural(c.total, 'caso cerrado', 'casos cerrados')} en ${mes}. Ver en casos`}
      />
      <Kpi
        to="/casos?estado=CERRADO&vencimiento=15"
        rotulo="Próximos a vencer"
        valor={kpis.proximos_a_vencer}
        pie={`Fecha de vencimiento de conservación en menos de ${kpis.dias_aviso_vencimiento} días`}
        icon={Archive}
        iconClass="bg-neutro-suave text-neutro"
        ariaLabel={`${plural(kpis.proximos_a_vencer, 'caso próximo', 'casos próximos')} a vencer. Ver en casos`}
      />
    </div>
  )
}
