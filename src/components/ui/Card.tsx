import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  /** id del título (CardHeader) para aria-labelledby */
  labelledBy?: string
}

/** Tarjeta principal (pf-card). Se renderiza como <section>. */
export function Card({ children, className, labelledBy }: CardProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn('min-w-0 rounded-lg border border-borde bg-blanco shadow-1', className)}
    >
      {children}
    </section>
  )
}

interface CardHeaderProps {
  id: string
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  /** Sobretítulo en mayúsculas sobre el título («Resultado técnico · decisión humana»). */
  overline?: string
}

/** Cabecera de tarjeta (pf-card__cab) con título, subtítulo y acciones a la derecha. */
export function CardHeader({ id, title, subtitle, actions, overline }: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-borde px-6 py-4">
      <div className="min-w-0 flex-1">
        {overline && <p className="mb-0.5 sobretitulo">{overline}</p>}
        <h2 id={id} className="titulo-h2">
          {title}
        </h2>
        {subtitle && <p className="text-cuerpo-sm text-tinta-terciaria">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}

export type TonoKpi = 'adv' | 'revision' | 'ok' | 'neutro' | 'peligro' | 'info'

const TONO_KPI: Record<TonoKpi, string> = {
  adv: 'bg-advertencia-suave text-advertencia',
  revision: 'bg-revision-suave text-revision',
  ok: 'bg-verde-100 text-verde-700',
  neutro: 'bg-neutro-suave text-neutro',
  peligro: 'bg-peligro-suave text-peligro',
  info: 'bg-info-suave text-info',
}

interface KpiCardProps {
  to: string
  rotulo: string
  valor: number | string
  pie?: ReactNode
  icon?: LucideIcon
  tono?: TonoKpi
  /** Nombre accesible completo del enlace («7 casos pendientes de revisión. Ver en casos»). */
  ariaLabel: string
}

/** Indicador clicable (af-kpi / pf-kpi): toda la tarjeta es un enlace. */
export function KpiCard({
  to,
  rotulo,
  valor,
  pie,
  icon: Icono,
  tono = 'neutro',
  ariaLabel,
}: KpiCardProps) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className="block rounded-lg border border-borde bg-blanco p-5 text-tinta no-underline shadow-1 hover:border-verde-300"
    >
      {Icono && (
        <span
          className={cn('float-right grid size-9 place-items-center rounded-md', TONO_KPI[tono])}
        >
          <Icono size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      <span className="block sobretitulo">{rotulo}</span>
      <span className="block font-titulos text-kpi font-bold tabular-nums">{valor}</span>
      {pie && <span className="block text-nota text-tinta-terciaria">{pie}</span>}
    </Link>
  )
}
