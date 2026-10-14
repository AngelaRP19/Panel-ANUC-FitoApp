import {
  CENTRO_ZETAQUIRA,
  hayGoogleMaps,
  urlGoogleMapsPunto,
  urlGoogleMapsZona,
} from '@/components/mapa/estilo'
import { MapaEmbebido } from '@/components/mapa/MapaEmbebido'
import { MapaGoogle } from '@/components/mapa/MapaGoogle'
import { MarcadorPin } from '@/components/mapa/Marcadores'
import { cn } from '@/utils/cn'

interface MiniMapaProps {
  latitud: number | null
  longitud: number | null
  /** Descripción accesible («Ubicación de la finca El Porvenir en 5.2481, -73.1702»). */
  etiqueta: string
  className?: string
}

const ZOOM_FINCA = 15
const ZOOM_MUNICIPIO = 12

/**
 * Mapa de Google en relieve con la ubicación de una finca. Un clic abre Google Maps en ese
 * punto. Con clave de la API es interactivo; sin clave, es el mapa embebido de Google.
 * Sin coordenadas válidas muestra Zetaquirá sin pin.
 */
export function MiniMapa({ latitud, longitud, etiqueta, className }: MiniMapaProps) {
  const valida =
    latitud !== null && longitud !== null && Number.isFinite(latitud) && Number.isFinite(longitud)
  const punto = valida ? { lat: latitud, lng: longitud } : null
  const centro = punto ?? CENTRO_ZETAQUIRA
  const zoom = punto ? ZOOM_FINCA : ZOOM_MUNICIPIO
  const enlace = punto ? urlGoogleMapsPunto(punto) : urlGoogleMapsZona(centro, zoom)
  const clases = cn('h-37.5', className)

  const embebido = (clase: string) => (
    <MapaEmbebido
      centro={centro}
      zoom={zoom}
      pin={!!punto}
      etiqueta={etiqueta}
      enlace={enlace}
      className={clase}
    />
  )
  if (!hayGoogleMaps()) return embebido(clases)
  return (
    <MapaGoogle
      etiqueta={etiqueta}
      encuadre={{ centro, zoom }}
      enlace={enlace}
      respaldo={embebido('h-full rounded-none border-0')}
      className={clases}
    >
      {punto && <MarcadorPin posicion={punto} titulo={etiqueta} />}
    </MapaGoogle>
  )
}
