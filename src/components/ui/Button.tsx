import type { ButtonHTMLAttributes, Ref } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

// Variantes del diseño (af-btn): primario, secundario, peligro y texto.
type Variant = 'primary' | 'secondary' | 'danger' | 'text'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-verde-700 text-blanco hover:bg-verde-800',
  secondary: 'border-borde-control bg-blanco text-verde-700 hover:bg-verde-100',
  danger: 'bg-peligro text-blanco hover:brightness-90',
  text: 'bg-transparent text-verde-700 hover:bg-verde-100',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3',
  md: 'h-10 px-4',
  lg: 'h-11 px-4',
  icon: 'size-10 px-0',
}

/** Clases del botón, para usarlas también en enlaces con aspecto de botón (<Link>). */
// eslint-disable-next-line react-refresh/only-export-components
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent font-texto text-cuerpo-sm font-semibold no-underline transition-colors [&_svg]:size-4.5 [&_svg]:flex-none',
    'disabled:cursor-not-allowed disabled:border-borde disabled:bg-inactivo-suave disabled:text-inactivo disabled:hover:brightness-100',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Muestra el indicador de carga y deshabilita el botón (evita envíos dobles). */
  loading?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {loading && <Spinner size="sm" decorativo />}
      {children}
    </button>
  )
}
