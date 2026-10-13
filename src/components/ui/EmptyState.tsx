import type { ReactNode } from 'react'
import { Inbox, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  /** Título del estado vacío («No hay resultados para esta búsqueda»). */
  title?: string
  /** Texto de apoyo. (Compatibilidad: `message` sin título se muestra como texto.) */
  message?: ReactNode
  icon?: LucideIcon
  /** Botón o enlace («Limpiar filtros», «Ver todos mis casos»). */
  action?: ReactNode
}

/** Estado vacío (pf-vacio): icono en círculo verde, título, texto y acción. */
export function EmptyState({ title, message, icon: Icono = Inbox, action }: EmptyStateProps) {
  return (
    <div role="status" className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="mb-2 grid size-14 place-items-center rounded-full bg-verde-100 text-verde-700">
        <Icono size={26} strokeWidth={1.75} aria-hidden="true" />
      </span>
      {title && <p className="titulo-h3">{title}</p>}
      {message && <p className="max-w-75 text-cuerpo-sm text-tinta-terciaria">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
