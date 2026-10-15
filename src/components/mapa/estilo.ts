// Utilidades de los mapas de Google: clave, encuadre, estilo, enlaces a Google Maps, zoom
// e iconos de marcadores. Los colores salen
// de los tokens CSS (src/styles/index.css); los respaldos son los mismos valores del tema.
import { env } from '@/config/env'

/** Hay clave de Google Maps (fuera de las pruebas): mapa interactivo de la API. */
export const hayGoogleMaps = () => !!env.googleMapsApiKey

/** Encuadre: un punto con zoom o un rectángulo que debe verse completo. */
export type Encuadre =
  { centro: google.maps.LatLngLiteral; zoom: number } | { limites: google.maps.LatLngBoundsLiteral }

export interface Punto {
  lat: number
  lng: number
}

/** Valor de un token de color (`--color-<nombre>`). */
export function colorToken(nombre: string, respaldo: string): string {
  if (typeof document === 'undefined') return respaldo
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--color-${nombre}`)
  return v.trim() || respaldo
}

/** Centro aproximado de Zetaquirá (vista inicial cuando no hay coordenadas). */
export const CENTRO_ZETAQUIRA: Punto = { lat: 5.2835, lng: -73.1705 }

/**
 * Estilo sobre el relieve de Google: se conserva el mapa tal cual (relieve, vías, ríos y
 * nombres) y solo se quita el ruido que no sirve en el panel (comercios y transporte).
 */
export function estiloMapa(): google.maps.MapTypeStyle[] {
  return [
    { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ]
}

const coord = (p: Punto) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`

/** Google Maps con un pin en el punto (pestaña nueva). */
export const urlGoogleMapsPunto = (p: Punto) =>
  `https://www.google.com/maps/search/?api=1&query=${coord(p)}`

/** Google Maps en relieve centrado en un punto, sin pin (p. ej. la zona de una alerta). */
export const urlGoogleMapsZona = (p: Punto, zoom: number) =>
  `https://www.google.com/maps/@?api=1&map_action=map&center=${coord(p)}&zoom=${zoom}&basemap=terrain`

/** Mapa embebido de Google en relieve (`t=p`). No necesita clave. `pin` marca el centro. */
export const urlEmbebido = (centro: Punto, zoom: number, pin: boolean) =>
  `https://maps.google.com/maps?${pin ? `q=${coord(centro)}&` : ''}ll=${coord(centro)}&z=${zoom}&t=p&hl=es&output=embed`

const MPP_ECUADOR = 156543.03392

/** Mayor zoom en el que un círculo de `radioM` metros cabe en `ladoPx` píxeles. */
export function zoomParaRadio(lat: number, radioM: number, ladoPx: number) {
  const z = Math.log2((MPP_ECUADOR * Math.cos((lat * Math.PI) / 180) * (ladoPx / 2)) / radioM)
  return Math.max(3, Math.min(18, Math.floor(z)))
}

const svg = (contenido: string, ancho: number, alto: number) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">${contenido}</svg>`,
  )}`

/** Pin verde del panel (ubicación de una finca). */
export function iconoPin(): google.maps.Icon {
  const verde = colorToken('verde-700', '#1e6b3e')
  const blanco = colorToken('blanco', '#ffffff')
  return {
    url: svg(
      `<path d="M16 39s13-11.5 13-22.3A13 13 0 0 0 3 16.7C3 27.5 16 39 16 39z" fill="${verde}" stroke="${blanco}" stroke-width="2.5"/><circle cx="16" cy="16.5" r="4.8" fill="${blanco}"/>`,
      32,
      42,
    ),
    scaledSize: new google.maps.Size(32, 42),
    anchor: new google.maps.Point(16, 40),
    labelOrigin: new google.maps.Point(16, -8),
  }
}

/** Forma de cada categoría (triángulo, círculo, rombo, cruz, cuadrado) con su color. */
const FORMAS: Record<string, { color: [string, string]; forma: string }> = {
  TRIPS: { color: ['cat-trips', '#7b4fb0'], forma: '<polygon points="13,2 24,22 2,22"/>' },
  BOTRYTIS: { color: ['cat-botrytis', '#5e6a79'], forma: '<circle cx="13" cy="13" r="10"/>' },
  RONA: { color: ['cat-rona', '#8c5a2e'], forma: '<polygon points="13,1 25,13 13,25 1,13"/>' },
  FUSARIUM: {
    color: ['cat-fusarium', '#b23a48'],
    forma: '<polygon points="9,2 17,2 17,9 24,9 24,17 17,17 17,24 9,24 9,17 2,17 2,9 9,9"/>',
  },
  DEFICIENCIA_MAGNESIO: {
    color: ['cat-magnesio', '#a88400'],
    forma: '<rect x="3" y="3" width="20" height="20" rx="1"/>',
  },
}

/** Marcador de un caso con la forma y el color de su categoría (nunca solo color). */
export function iconoCategoria(categoria: string): google.maps.Icon {
  const f = FORMAS[categoria] ?? FORMAS.BOTRYTIS!
  const color = colorToken(...f.color)
  const blanco = colorToken('blanco', '#ffffff')
  return {
    url: svg(
      `<g fill="${color}" stroke="${blanco}" stroke-width="2.5" stroke-linejoin="round">${f.forma}</g>`,
      26,
      26,
    ),
    scaledSize: new google.maps.Size(26, 26),
    anchor: new google.maps.Point(13, 13),
    labelOrigin: new google.maps.Point(13, -9),
  }
}
