import { Circle, Marker } from '@vis.gl/react-google-maps'
import { colorToken, iconoCategoria, iconoPin, urlGoogleMapsPunto } from './estilo'

// Se renderizan dentro de <MapaGoogle>: ahí la API ya cargó y existe `google.maps`.
// Un clic en un marcador abre Google Maps en su punto (pestaña nueva).

const abrir = (url: string) => window.open(url, '_blank', 'noopener,noreferrer')

/** Pin verde de una ubicación (finca). */
export function MarcadorPin({
  posicion,
  titulo,
}: {
  posicion: google.maps.LatLngLiteral
  titulo: string
}) {
  return (
    <Marker
      position={posicion}
      icon={iconoPin()}
      title={titulo}
      onClick={() => abrir(urlGoogleMapsPunto(posicion))}
    />
  )
}

/** Caso con la forma y el color de su categoría y su número encima («#0229»). */
export function MarcadorCaso({
  posicion,
  categoria,
  codigo,
  titulo,
  conEtiqueta = true,
  onClick,
}: {
  posicion: google.maps.LatLngLiteral
  categoria: string
  codigo: string
  titulo: string
  /** Número encima del marcador (en mapas con muchos casos se puede omitir). */
  conEtiqueta?: boolean
  /** Por defecto abre Google Maps en el punto. */
  onClick?: () => void
}) {
  return (
    <Marker
      position={posicion}
      icon={iconoCategoria(categoria)}
      title={titulo}
      onClick={onClick ?? (() => abrir(urlGoogleMapsPunto(posicion)))}
      label={
        conEtiqueta
          ? {
              text: `#${codigo}`,
              color: colorToken('tinta', '#16241b'),
              fontFamily: 'JetBrains Mono Variable, JetBrains Mono, monospace',
              fontSize: '12px',
              fontWeight: '600',
            }
          : undefined
      }
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

/** Mancha de concentración alrededor de un caso (capa de concentración del mapa). */
export function CirculoConcentracion({
  centro,
  nivel,
  radioM = 600,
}: {
  centro: google.maps.LatLngLiteral
  nivel: number
  radioM?: number
}) {
  const color = colorToken(...(CALOR[nivel] ?? CALOR[1]!))
  return (
    <Circle
      center={centro}
      radius={radioM}
      strokeOpacity={0}
      fillColor={color}
      fillOpacity={nivel >= 3 ? 0.42 : 0.3}
      clickable={false}
    />
  )
}

/** Círculo del radio de una alerta (borde punteado en el color de advertencia). */
export function CirculoRadio({
  centro,
  radioKm,
}: {
  centro: google.maps.LatLngLiteral
  radioKm: number
}) {
  const color = colorToken('advertencia', '#8a5300')
  return (
    <Circle
      center={centro}
      radius={radioKm * 1000}
      strokeColor={color}
      strokeOpacity={0.9}
      strokeWeight={2.5}
      fillColor={color}
      fillOpacity={0.08}
      clickable={false}
    />
  )
}
