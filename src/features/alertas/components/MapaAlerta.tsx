import { Circle } from 'lucide-react'
import {
  CENTRO_ZETAQUIRA,
  hayGoogleMaps,
  urlGoogleMapsZona,
  zoomParaRadio,
  type Punto,
} from '@/components/mapa/estilo'
import { MapaEmbebido } from '@/components/mapa/MapaEmbebido'
import { MapaGoogle } from '@/components/mapa/MapaGoogle'
import { CirculoRadio, MarcadorCaso } from '@/components/mapa/Marcadores'
import { FormaCategoria } from '@/components/ui/CategoriaMarca'
import { CATEGORIA_FORMA_LABEL, CATEGORIA_LABEL } from '@/locales/es'
import type { Categoria } from '@/types/enums'
import type { CasoAlerta } from '../types'
import { formatearKm } from '../utils'

/** Alto del mapa en px (h-57.5): el zoom se elige para que el círculo quepa. */
const ALTO = 230
const KM_POR_GRADO = 111.32

interface MapaAlertaProps {
  casos: CasoAlerta[]
  categoria: Categoria
  radioKm: number
  /** Descripción accesible del mapa. */
  etiqueta: string
}

/**
 * Leyenda: forma de la categoría y radio de la alerta. No intercepta el clic del mapa. En el
 * mapa embebido (sin figuras dibujadas) resume la zona en texto.
 */
function Leyenda({
  categoria,
  radioKm,
  numCasos,
  dibujado,
}: {
  categoria: Categoria
  radioKm: number
  numCasos: number
  dibujado: boolean
}) {
  if (!dibujado) {
    return (
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-blanco/95 px-3 py-2 text-nota shadow-1">
        Zona de la alerta · {numCasos} casos de {CATEGORIA_LABEL[categoria]} en un radio de{' '}
        {formatearKm(radioKm)}
      </div>
    )
  }
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-x-4 gap-y-1 rounded-md bg-blanco/95 px-3 py-2 text-nota shadow-1">
      <span className="inline-flex items-center gap-1.5">
        <FormaCategoria categoria={categoria} />
        {CATEGORIA_LABEL[categoria]} confirmado ({CATEGORIA_FORMA_LABEL[categoria]})
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Circle size={14} className="text-advertencia" strokeDasharray="4 3" aria-hidden="true" />
        Radio {formatearKm(radioKm)}
      </span>
    </div>
  )
}

/** Centro de los casos y su posición; los de la misma finca se separan unos 70 m. */
function ubicar(casos: CasoAlerta[]) {
  const con = casos.filter((c) => c.latitud !== null && c.longitud !== null)
  if (!con.length) return null
  const centro = {
    lat: con.reduce((s, c) => s + c.latitud!, 0) / con.length,
    lng: con.reduce((s, c) => s + c.longitud!, 0) / con.length,
  }
  const vistos = new Map<string, number>()
  const puntos = con.map((c) => {
    const clave = `${c.latitud},${c.longitud}`
    const n = vistos.get(clave) ?? 0
    vistos.set(clave, n + 1)
    return { caso: c, posicion: { lat: c.latitud! + n * 0.0006, lng: c.longitud! + n * 0.0006 } }
  })
  return { centro, puntos }
}

/** Rectángulo que contiene el círculo del radio. */
function limitesCirculo(centro: Punto, radioKm: number) {
  const dLat = radioKm / KM_POR_GRADO
  const dLng = radioKm / (KM_POR_GRADO * Math.cos((centro.lat * Math.PI) / 180))
  return {
    north: centro.lat + dLat,
    south: centro.lat - dLat,
    east: centro.lng + dLng,
    west: centro.lng - dLng,
  }
}

/**
 * Mapa de la alerta (diseño 06) en Google Maps; un clic abre Google Maps en la zona. Con
 * clave de la API es el mapa en relieve con el círculo del radio y cada caso con la forma
 * de su categoría y su número (clic en un caso: su punto). Sin clave es el mapa embebido
 * de la zona: Google lo desplaza al cargar, así que no se dibujan figuras encima.
 */
export function MapaAlerta({ casos, categoria, radioKm, etiqueta }: MapaAlertaProps) {
  const u = ubicar(casos)
  const centro = u?.centro ?? CENTRO_ZETAQUIRA
  const zoom = zoomParaRadio(centro.lat, radioKm * 1000, ALTO - 40)
  const enlace = urlGoogleMapsZona(centro, zoom)
  const leyenda = (dibujado: boolean) => (
    <Leyenda categoria={categoria} radioKm={radioKm} numCasos={casos.length} dibujado={dibujado} />
  )

  const embebido = (clase: string) => (
    <MapaEmbebido
      centro={centro}
      zoom={zoom}
      etiqueta={etiqueta}
      enlace={enlace}
      className={clase}
      superpuesto={leyenda(false)}
    />
  )
  if (!hayGoogleMaps() || !u) return embebido('h-57.5')
  return (
    <MapaGoogle
      etiqueta={etiqueta}
      encuadre={{ limites: limitesCirculo(u.centro, radioKm) }}
      enlace={enlace}
      respaldo={embebido('h-full rounded-none border-0')}
      className="h-57.5"
      superpuesto={leyenda(true)}
    >
      <CirculoRadio centro={u.centro} radioKm={radioKm} />
      {u.puntos.map(({ caso, posicion }) => (
        <MarcadorCaso
          key={caso.id}
          posicion={posicion}
          categoria={categoria}
          codigo={caso.codigo}
          titulo={`Caso #${caso.codigo} · ${caso.productor_nombre} · ${caso.finca_nombre}`}
        />
      ))}
    </MapaGoogle>
  )
}
