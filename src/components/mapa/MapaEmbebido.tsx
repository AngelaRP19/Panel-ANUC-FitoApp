import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { urlEmbebido, type Punto } from './estilo'

interface MapaEmbebidoProps {
  centro: Punto
  zoom: number
  /** Pin de Google en el centro (ubicación de una finca). */
  pin?: boolean
  /** Descripción del mapa (qué muestra). */
  etiqueta: string
  /** A dónde lleva el clic: Google Maps en ese punto (pestaña nueva). */
  enlace: string
  /** Contenido sobre el mapa (p. ej. la leyenda). Debe dejar pasar el clic. */
  superpuesto?: ReactNode
  className?: string
}

/**
 * Mapa embebido de Google (no necesita clave). El mapa no se manipula: todo él es un enlace
 * que abre Google Maps en ese punto, en una pestaña nueva. Se pide en relieve (`t=p`), pero
 * hoy el embebido sin clave lo muestra en la vista estándar; el relieve real llega con la
 * clave de la API (MapaGoogle).
 */
export function MapaEmbebido({
  centro,
  zoom,
  pin = false,
  etiqueta,
  enlace,
  superpuesto,
  className,
}: MapaEmbebidoProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-borde bg-neutro-suave',
        className,
      )}
    >
      <div role="img" aria-label={etiqueta} className="absolute inset-0">
        <iframe
          src={urlEmbebido(centro, zoom, pin)}
          title={etiqueta}
          aria-hidden="true"
          tabIndex={-1}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="pointer-events-none absolute inset-0 size-full border-0"
        />
      </div>
      <a
        href={enlace}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir en Google Maps: ${etiqueta} (se abre en una pestaña nueva)`}
        className="absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-verde-600"
      />
      {superpuesto}
    </div>
  )
}
