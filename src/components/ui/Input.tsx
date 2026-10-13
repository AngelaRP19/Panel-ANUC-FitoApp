import type { InputHTMLAttributes, Ref } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  /** Teléfonos, códigos y coordenadas en JetBrains Mono. */
  mono?: boolean
  ref?: Ref<HTMLInputElement>
}

/** Clases compartidas por Input, Select y Textarea (af-input). */
export const controlClass =
  'w-full rounded-sm border border-borde-control bg-blanco px-3 font-texto text-cuerpo text-tinta placeholder:text-tinta-terciaria focus:border-verde-600 focus:outline-2 focus:outline-offset-1 focus:outline-verde-600 aria-invalid:border-peligro disabled:cursor-not-allowed disabled:border-borde disabled:bg-inactivo-suave disabled:text-inactivo'

export function Input({ invalid, mono, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(controlClass, 'h-10', mono && 'font-mono text-[15px]', className)}
      {...props}
    />
  )
}
