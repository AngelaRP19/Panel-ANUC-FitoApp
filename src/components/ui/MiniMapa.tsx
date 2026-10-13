import { cn } from '@/utils/cn'

/** Encuadre aproximado de Zetaquirá usado para ubicar el punto (artboard 09). */
const ENCUADRE = { oeste: -73.19, norte: 5.305, ancho: 0.07, alto: 0.07 }

/** Posición del punto en porcentaje, limitada al recuadro. */
function posicion(latitud: number, longitud: number) {
  const x = ((longitud - ENCUADRE.oeste) / ENCUADRE.ancho) * 100
  const y = ((ENCUADRE.norte - latitud) / ENCUADRE.alto) * 100
  const limitar = (n: number) => Math.min(96, Math.max(4, n))
  return { x: limitar(x), y: limitar(y) }
}

interface MiniMapaProps {
  latitud: number | null
  longitud: number | null
  /** Descripción accesible («Ubicación de la finca El Porvenir en 5.2481, -73.1702»). */
  etiqueta: string
  className?: string
}

/**
 * Mini mapa ilustrativo de una ubicación (pf-mapa): fondo esquemático y un punto según las
 * coordenadas. No es un mapa real; el de Leaflet llega con el mapa de vigilancia (pantalla 19).
 */
export function MiniMapa({ latitud, longitud, etiqueta, className }: MiniMapaProps) {
  const valida =
    latitud !== null && longitud !== null && Number.isFinite(latitud) && Number.isFinite(longitud)
  const p = valida ? posicion(latitud, longitud) : null
  return (
    <div
      role="img"
      aria-label={etiqueta}
      className={cn(
        'relative h-37.5 overflow-hidden rounded-lg border border-borde bg-neutro-suave',
        className,
      )}
    >
      <svg
        viewBox="0 0 600 200"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <path
          d="M0 130 C 120 110, 220 150, 330 120 S 500 100, 600 130"
          className="fill-none stroke-borde"
          strokeWidth={2}
        />
        <path
          d="M140 0 C 170 60, 200 110, 190 200"
          className="fill-none stroke-info-suave"
          strokeWidth={10}
        />
        <path
          d="M380 0 L 420 200"
          className="fill-none stroke-borde-control"
          strokeWidth={1.5}
          strokeDasharray="8 6"
        />
      </svg>
      {p && (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="absolute -mt-6.5 -ml-3.5 size-7 drop-shadow"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <path
            d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"
            className="fill-verde-700 stroke-blanco"
            strokeWidth={1.5}
          />
          <circle cx="12" cy="10" r="2.6" className="fill-blanco" />
        </svg>
      )}
    </div>
  )
}
