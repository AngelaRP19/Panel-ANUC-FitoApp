import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'danger' | 'text'
type Size = 'sm' | 'md' | 'lg'

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
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
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
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent font-texto text-cuerpo-sm font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:border-borde disabled:bg-inactivo-suave disabled:text-inactivo',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
