import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /** Chip conmutable (pf-chip): activo en verde con `aria-pressed`. */
  pressed?: boolean
  children: ReactNode
}

/** Chip conmutable para filtros rápidos (p. ej. categorías del mapa). */
export function Chip({ pressed = false, children, className, disabled, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      className={cn(
        'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-pill border border-borde-control bg-blanco px-3 text-cuerpo-sm font-medium whitespace-nowrap text-tinta [&_svg]:size-3.5',
        pressed && 'border-verde-700 bg-verde-100 font-semibold text-verde-800',
        'disabled:cursor-not-allowed disabled:border-borde disabled:bg-inactivo-suave disabled:text-inactivo',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface FilterChipProps {
  /** Texto del filtro activo («Vereda: Juracambita»). */
  children: ReactNode
  onRemove: () => void
  /** Nombre accesible del botón de quitar. */
  removeLabel: string
}

/** Filtro activo (pf-chip-f) con botón para quitarlo. */
export function FilterChip({ children, onRemove, removeLabel }: FilterChipProps) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-pill border border-verde-300 bg-verde-100 pr-1.5 pl-2.5 text-nota font-medium text-verde-900">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="grid size-6 cursor-pointer place-items-center rounded-full hover:bg-verde-200"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </span>
  )
}
