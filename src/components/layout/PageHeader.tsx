import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  /** Contenido junto al título (p. ej. insignia de estado o «Solo consulta»). */
  titleExtra?: ReactNode
  /** Ruta de navegación sobre el título (pantallas de detalle). */
  breadcrumb?: ReactNode
  /** "display" solo para la página principal (inicio); el resto usa h1. */
  size?: 'display' | 'h1'
}

/** Encabezado de pantalla con el único h1 de la vista. */
export function PageHeader({
  title,
  description,
  actions,
  titleExtra,
  breadcrumb,
  size = 'h1',
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      {breadcrumb}
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={cn(size === 'display' ? 'titulo-display' : 'titulo-h1')}>{title}</h1>
            {titleExtra}
          </div>
          {description && (
            <p className="mt-0.5 text-cuerpo-sm text-tinta-terciaria">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
