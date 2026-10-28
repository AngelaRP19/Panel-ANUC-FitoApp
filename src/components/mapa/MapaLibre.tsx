import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { cn } from '@/utils/cn'
import { colorToken, svgCategoria, type Punto } from './estilo'

// Mapa interactivo sin clave ni facturación: Leaflet con el mapa base de OpenStreetMap (con su
// atribución, como pide su política de uso). Lo usa el mapa de vigilancia en lugar de Google Maps.

const TESELAS = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATRIBUCION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'

export interface Limites {
  north: number
  south: number
  east: number
  west: number
}

export type EncuadreLibre = { centro: Punto; zoom: number } | { limites: Limites }

const aBounds = (l: Limites) => L.latLngBounds([l.south, l.west], [l.north, l.east])

/** Mueve la cámara cuando cambia el encuadre (p. ej. al filtrar los casos). */
function Camara({ encuadre }: { encuadre: EncuadreLibre }) {
  const map = useMap()
  const clave = JSON.stringify(encuadre)
  useEffect(() => {
    const e = JSON.parse(clave) as EncuadreLibre
    if ('limites' in e) map.fitBounds(aBounds(e.limites), { padding: [24, 24] })
    else map.setView(e.centro, e.zoom)
  }, [map, clave])
  return null
}

function ClicEnMapa({ onClick }: { onClick?: () => void }) {
  useMapEvents({ click: () => onClick?.() })
  return null
}

interface MapaLibreProps {
  encuadre: EncuadreLibre
  /** Nombre accesible del mapa (qué muestra). */
  etiqueta: string
  className?: string
  /** Marcadores y figuras del mapa. */
  children?: ReactNode
  /** Contenido encima del mapa (p. ej. la leyenda). */
  superpuesto?: ReactNode
  /** Clic en el mapa, p. ej. para cerrar la ficha de un caso. */
  onClickMapa?: () => void
}

export function MapaLibre({
  encuadre,
  etiqueta,
  className,
  children,
  superpuesto,
  onClickMapa,
}: MapaLibreProps) {
  const inicial =
    'centro' in encuadre
      ? { center: encuadre.centro, zoom: encuadre.zoom }
      : { bounds: aBounds(encuadre.limites) }
  return (
    <div
      role="region"
      aria-label={etiqueta}
      className={cn(
        'relative isolate overflow-hidden rounded-lg border border-borde bg-verde-50',
        className,
      )}
    >
      <MapContainer {...inicial} className="size-full" scrollWheelZoom attributionControl>
        <TileLayer url={TESELAS} attribution={ATRIBUCION} maxZoom={19} />
        <Camara encuadre={encuadre} />
        <ClicEnMapa onClick={onClickMapa} />
        {children}
      </MapContainer>
      {superpuesto}
    </div>
  )
}

/** Caso con la forma y el color de su categoría (nunca solo color). */
export function MarcadorCasoLibre({
  posicion,
  categoria,
  titulo,
  onClick,
}: {
  posicion: Punto
  categoria: string
  titulo: string
  onClick?: () => void
}) {
  const icono = useMemo(
    () =>
      L.divIcon({
        html: svgCategoria(categoria),
        className: 'marcador-caso',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -14],
      }),
    [categoria],
  )
  return (
    <Marker
      position={posicion}
      icon={icono}
      title={titulo}
      alt={titulo}
      keyboard
      eventHandlers={{ click: () => onClick?.() }}
    />
  )
}

/** Escala de concentración 1-4 (tokens calor-1 a calor-4). */
const CALOR: Record<number, [string, string]> = {
  1: ['calor-1', '#e5f4ea'],
  2: ['calor-2', '#f2d27a'],
  3: ['calor-3', '#e38a3f'],
  4: ['calor-4', '#b42318'],
}

/** Mancha de concentración alrededor de un caso. */
export function CirculoConcentracionLibre({
  centro,
  nivel,
  radioM = 600,
}: {
  centro: Punto
  nivel: number
  radioM?: number
}) {
  const color = colorToken(...(CALOR[nivel] ?? CALOR[1]!))
  return (
    <Circle
      center={centro}
      radius={radioM}
      interactive={false}
      pathOptions={{ stroke: false, fillColor: color, fillOpacity: nivel >= 3 ? 0.42 : 0.3 }}
    />
  )
}

/** Círculo del radio de una alerta (borde punteado en el color de advertencia). */
export function CirculoRadioLibre({ centro, radioKm }: { centro: Punto; radioKm: number }) {
  const color = colorToken('advertencia', '#8a5300')
  return (
    <Circle
      center={centro}
      radius={radioKm * 1000}
      interactive={false}
      pathOptions={{
        color,
        opacity: 0.9,
        weight: 2.5,
        dashArray: '6 5',
        fillColor: color,
        fillOpacity: 0.08,
      }}
    />
  )
}

/**
 * Ficha emergente en un punto. Cuando la cierra la persona (botón o clic en el mapa) avisa para
 * quitar la selección; cuando se desmonta porque se eligió otro caso, no.
 */
export function FichaLibre({
  posicion,
  onCerrar,
  children,
}: {
  posicion: Punto
  onCerrar: () => void
  children: ReactNode
}) {
  const montada = useRef(false)
  useEffect(() => {
    montada.current = true
    return () => {
      montada.current = false
    }
  }, [])
  return (
    <Popup
      position={posicion}
      eventHandlers={{ remove: () => montada.current && onCerrar() }}
      minWidth={240}
      autoPan
    >
      {children}
    </Popup>
  )
}
