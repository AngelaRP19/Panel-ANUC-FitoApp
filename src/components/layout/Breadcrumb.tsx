import { Fragment } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'

export interface Miga {
  label: string
  /** Sin `to`: es la página actual. */
  to?: string
}

/** Ruta de navegación en pantallas de detalle («Bandeja de casos / Caso #0241»). */
export function Breadcrumb({ items }: { items: Miga[] }) {
  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex flex-wrap items-center gap-1 text-cuerpo-sm text-tinta-secundaria">
        {items.map((m, i) => (
          <Fragment key={`${m.label}-${i}`}>
            {i > 0 && (
              <li aria-hidden="true" className="text-tinta-terciaria">
                <ChevronRight size={14} />
              </li>
            )}
            <li>
              {m.to ? (
                <Link to={m.to} className="enlace">
                  {m.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-tinta">
                  {m.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
