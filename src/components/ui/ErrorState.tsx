import type { ReactNode } from 'react'
import { RotateCcw, WifiOff, type LucideIcon } from 'lucide-react'
import { MENSAJES } from '@/locales/es'
import { Button } from './Button'

interface ErrorStateProps {
  /** «No se pudo cargar la bandeja». (Compatibilidad: `message` hace de título.) */
  title?: string
  message?: string
  /** Texto de apoyo; por defecto, el de error de conexión del diseño. */
  description?: ReactNode
  icon?: LucideIcon
  onRetry?: () => void
}

/** Error al cargar (artboard «Estados»): icono rojo, título, explicación y «Reintentar». */
export function ErrorState({
  title,
  message,
  description = MENSAJES.errorConexionTexto,
  icon: Icono = WifiOff,
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="mb-2 grid size-14 place-items-center rounded-full bg-peligro-suave text-peligro">
        <Icono size={26} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <p className="titulo-h3">{title ?? message ?? 'No se pudo cargar la información'}</p>
      {description && <p className="max-w-75 text-cuerpo-sm text-tinta-terciaria">{description}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          <RotateCcw aria-hidden="true" />
          {MENSAJES.reintentar}
        </Button>
      )}
    </div>
  )
}
