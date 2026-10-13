import { ImageOff, Leaf } from 'lucide-react'
import { cn } from '@/utils/cn'

interface FotoEvidenciaProps {
  /** Número de la evidencia en el caso (esquina superior izquierda). */
  numero?: number
  /** Pie descriptivo («Fruto 2 · mancha húmeda»). */
  caption: string
  /** Texto alternativo («Evidencia fruto 2 · caso #0241»). */
  alt: string
  src?: string | null
  /** Abre el visor ampliado. */
  onOpen?: () => void
  /** Hueco sin foto para un tipo («Sin fotos»). */
  vacia?: boolean
  className?: string
}

/** Foto de evidencia (pf-foto), 4:3 con radio grande. Es un botón que abre el visor. */
export function FotoEvidencia({
  numero,
  caption,
  alt,
  src,
  onOpen,
  vacia = false,
  className,
}: FotoEvidenciaProps) {
  const base =
    'relative flex aspect-[4/3] flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border p-2 text-center'

  if (vacia) {
    return (
      <div
        className={cn(
          base,
          'border-dashed border-borde-control bg-blanco text-tinta-terciaria',
          className,
        )}
      >
        <ImageOff size={22} strokeWidth={1.75} aria-hidden="true" />
        <span className="text-xs leading-4 font-medium">{caption}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${alt}. Ampliar`}
      className={cn(
        base,
        'cursor-zoom-in border-borde bg-verde-100 text-verde-800 hover:border-verde-300',
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <Leaf size={22} strokeWidth={1.75} aria-hidden="true" />
      )}
      {numero !== undefined && (
        <span className="absolute top-2 left-2 rounded-sm border border-borde bg-blanco px-1.5 text-[11px] leading-4 font-semibold text-tinta-secundaria">
          {numero}
        </span>
      )}
      <span
        className={cn(
          'text-xs leading-4 font-medium text-tinta-secundaria',
          src && 'absolute inset-x-0 bottom-0 bg-blanco/90 px-2 py-1',
        )}
      >
        {caption}
      </span>
    </button>
  )
}
