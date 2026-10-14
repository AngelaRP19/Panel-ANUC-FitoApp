import { Circle } from 'lucide-react'
import { FormaCategoria } from '@/components/ui/CategoriaMarca'
import { CATEGORIA_FORMA_LABEL, CATEGORIA_LABEL } from '@/locales/es'
import type { Categoria } from '@/types/enums'
import type { CasoAlerta } from '../types'
import { formatearKm } from '../utils'

const ANCHO = 600
const ALTO = 230
/** Radio del círculo de la alerta en el dibujo (px del viewBox). */
const RADIO = 95
const KM_POR_GRADO = 111.32

/** Relleno de la marca de cada categoría (la forma la da FormaCategoria en la leyenda). */
const RELLENO: Record<Categoria, string> = {
  TRIPS: 'fill-cat-trips',
  BOTRYTIS: 'fill-cat-botrytis',
  RONA: 'fill-cat-rona',
  FUSARIUM: 'fill-cat-fusarium',
  DEFICIENCIA_MAGNESIO: 'fill-cat-magnesio',
}

interface MapaAlertaProps {
  casos: CasoAlerta[]
  categoria: Categoria
  radioKm: number
  /** Descripción accesible del mapa. */
  etiqueta: string
}

/** Puntos de los casos alrededor de su centro, a escala del radio de la alerta. */
function proyectar(casos: CasoAlerta[], radioKm: number) {
  const conUbicacion = casos.filter((c) => c.latitud !== null && c.longitud !== null)
  if (!conUbicacion.length) return []
  const lat0 = conUbicacion.reduce((s, c) => s + c.latitud!, 0) / conUbicacion.length
  const lng0 = conUbicacion.reduce((s, c) => s + c.longitud!, 0) / conUbicacion.length
  const escala = RADIO / radioKm
  const cos = Math.cos((lat0 * Math.PI) / 180)
  const vistos = new Map<string, number>()
  return conUbicacion.map((c) => {
    // Casos de la misma finca: se separan un poco para que no se tapen.
    const clave = `${c.latitud},${c.longitud}`
    const repetido = vistos.get(clave) ?? 0
    vistos.set(clave, repetido + 1)
    return {
      codigo: c.codigo,
      x: ANCHO / 2 + (c.longitud! - lng0) * KM_POR_GRADO * cos * escala + repetido * 16,
      y: ALTO / 2 - (c.latitud! - lat0) * KM_POR_GRADO * escala - repetido * 14,
    }
  })
}

/**
 * Mapa ilustrativo de la alerta (pf-mapa del diseño 06): círculo del radio y los casos con la
 * forma de su categoría. No es un mapa real; el de Leaflet llega con la pantalla 19.
 */
export function MapaAlerta({ casos, categoria, radioKm, etiqueta }: MapaAlertaProps) {
  const puntos = proyectar(casos, radioKm)
  return (
    <div
      role="img"
      aria-label={etiqueta}
      className="relative h-57.5 overflow-hidden rounded-lg border border-borde bg-neutro-suave"
    >
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <path
          d="M0 190 C 120 170, 220 210, 330 185 S 500 160, 600 190"
          className="fill-none stroke-borde"
          strokeWidth={2}
        />
        <path
          d="M90 0 C 120 60, 150 110, 170 150 S 190 210, 180 230"
          className="fill-none stroke-info-suave"
          strokeWidth={10}
        />
        <path
          d="M0 60 C 120 55, 250 45, 360 50 S 520 60, 600 45"
          className="fill-none stroke-blanco"
          strokeWidth={8}
        />
        <path
          d="M360 50 C 352 100, 340 150, 330 230"
          className="fill-none stroke-blanco"
          strokeWidth={6}
        />
        <circle
          cx={ANCHO / 2}
          cy={ALTO / 2}
          r={RADIO}
          className="fill-advertencia/8 stroke-advertencia"
          strokeWidth={2.5}
          strokeDasharray="10 7"
        />
        {puntos.map((p) => (
          <g key={p.codigo}>
            {categoria === 'TRIPS' ? (
              <polygon
                points={`${p.x},${p.y - 11} ${p.x + 10},${p.y + 7} ${p.x - 10},${p.y + 7}`}
                className={`${RELLENO[categoria]} stroke-blanco`}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
            ) : (
              <circle
                cx={p.x}
                cy={p.y}
                r={9}
                className={`${RELLENO[categoria]} stroke-blanco`}
                strokeWidth={2.5}
              />
            )}
            <text
              x={p.x + 13}
              y={p.y + 5}
              className="fill-tinta font-mono text-[13px] font-semibold"
            >
              #{p.codigo}
            </text>
          </g>
        ))}
      </svg>
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-x-4 gap-y-1 rounded-md bg-blanco/95 px-3 py-2 text-nota shadow-1">
        <span className="inline-flex items-center gap-1.5">
          <FormaCategoria categoria={categoria} />
          {CATEGORIA_LABEL[categoria]} confirmado ({CATEGORIA_FORMA_LABEL[categoria]})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Circle size={14} className="text-advertencia" strokeDasharray="4 3" aria-hidden="true" />
          Radio {formatearKm(radioKm)}
        </span>
      </div>
    </div>
  )
}
