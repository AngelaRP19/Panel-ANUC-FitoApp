import { useEffect, type ReactNode } from 'react'
import {
  APIProvider,
  APILoadingStatus,
  Map,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps'
import { ExternalLink } from 'lucide-react'
import { env } from '@/config/env'
import { cn } from '@/utils/cn'
import { CENTRO_ZETAQUIRA, estiloMapa, type Encuadre } from './estilo'

/** Mueve la cámara cuando cambia el encuadre (p. ej. al escribir coordenadas). */
function Camara({ encuadre }: { encuadre: Encuadre }) {
  const map = useMap()
  const clave = JSON.stringify(encuadre)
  useEffect(() => {
    if (!map) return
    const e = JSON.parse(clave) as Encuadre
    if ('limites' in e) map.fitBounds(e.limites, 24)
    else {
      map.panTo(e.centro)
      map.setZoom(e.zoom)
    }
  }, [map, clave])
  return null
}

/** Mensaje cuando la API no carga (clave inválida, sin red o dominio no autorizado). */
function EstadoCarga({ respaldo }: { respaldo: ReactNode }) {
  const estado = useApiLoadingStatus()
  if (estado === APILoadingStatus.FAILED || estado === APILoadingStatus.AUTH_FAILURE) {
    return <div className="absolute inset-0">{respaldo}</div>
  }
  return null
}

interface MapaGoogleProps {
  encuadre: Encuadre
  /** Nombre accesible del mapa (qué muestra). */
  etiqueta: string
  /** Lo que se muestra si la API no carga (el mapa embebido). */
  respaldo: ReactNode
  className?: string
  /** Marcadores y figuras del mapa. */
  children?: ReactNode
  /** Contenido encima del mapa (p. ej. la leyenda). */
  superpuesto?: ReactNode
  /** Enlace a Google Maps que se abre al hacer clic en el mapa (pestaña nueva). */
  enlace: string
}

/**
 * Mapa interactivo de Google (con clave) en vista de relieve, sin comercios ni transporte.
 * Se acerca con los botones o con Ctrl + rueda; un clic en el mapa abre Google Maps.
 */
export function MapaGoogle({
  encuadre,
  etiqueta,
  respaldo,
  className,
  children,
  superpuesto,
  enlace,
}: MapaGoogleProps) {
  const inicial = 'centro' in encuadre ? encuadre : { centro: CENTRO_ZETAQUIRA, zoom: 13 }
  return (
    <div
      role="region"
      aria-label={etiqueta}
      className={cn(
        'relative overflow-hidden rounded-lg border border-borde bg-verde-50',
        className,
      )}
    >
      <APIProvider apiKey={env.googleMapsApiKey} language="es" region="CO">
        <Map
          className="size-full"
          defaultCenter={inicial.centro}
          defaultZoom={inicial.zoom}
          mapTypeId="terrain"
          onClick={() => window.open(enlace, '_blank', 'noopener,noreferrer')}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          keyboardShortcuts
        >
          <EstiloAlCargar />
          <Camara encuadre={encuadre} />
          {children}
        </Map>
        <EstadoCarga respaldo={respaldo} />
      </APIProvider>
      <a
        href={enlace}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-sm bg-blanco/95 px-2 py-1 text-nota font-semibold text-verde-700 no-underline shadow-1 hover:bg-blanco"
      >
        <ExternalLink size={13} aria-hidden="true" />
        Abrir en Google Maps
        <span className="sr-only"> (se abre en una pestaña nueva)</span>
      </a>
      {superpuesto}
    </div>
  )
}

/** El estilo necesita `google` cargado: se aplica en cuanto el mapa existe. */
function EstiloAlCargar() {
  const map = useMap()
  useEffect(() => {
    map?.setOptions({ styles: estiloMapa() })
  }, [map])
  return null
}
