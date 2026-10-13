import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  /** Texto que anuncia el lector de pantalla («Cargando casos»). */
  etiqueta?: string
  /** Dentro de un botón que ya anuncia la carga: no se anuncia aparte. */
  decorativo?: boolean
  className?: string
}

export function Spinner({
  size = 'md',
  etiqueta = 'Cargando',
  decorativo = false,
  className,
}: SpinnerProps) {
  const px = { sm: 16, md: 24, lg: 36 }[size]
  const icono = (
    <Loader2
      size={px}
      aria-hidden="true"
      className={cn('animate-spin text-current motion-reduce:animate-none', className)}
    />
  )
  if (decorativo) return icono
  return (
    <span role="status" className="inline-flex text-verde-700">
      {icono}
      <span className="sr-only">{etiqueta}</span>
    </span>
  )
}
