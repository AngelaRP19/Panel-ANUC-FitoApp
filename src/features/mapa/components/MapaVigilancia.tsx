import { Link } from 'react-router'
import { InfoWindow } from '@vis.gl/react-google-maps'
import {
  CENTRO_ZETAQUIRA,
  hayGoogleMaps,
  urlGoogleMapsZona,
  type Punto,
} from '@/components/mapa/estilo'
import { MapaEmbebido } from '@/components/mapa/MapaEmbebido'
import { MapaGoogle } from '@/components/mapa/MapaGoogle'
import { CirculoConcentracion, CirculoRadio, MarcadorCaso } from '@/components/mapa/Marcadores'
import { Aviso } from '@/components/ui/Aviso'
import { FormaCategoria } from '@/components/ui/CategoriaMarca'
import { ResultadoTecnicoBadge } from '@/components/ui/ResultadoTecnicoBadge'
import { CATEGORIA_FORMA_LABEL, CATEGORIA_LABEL, ESPECIE_LABEL } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import type { CasoMapa } from '../api'
import { CATEGORIAS_MAPA, etiquetaCaso, lugarCaso } from '../utils'

const ALTO = 'h-[min(620px,70vh)] min-h-90'

/** Leyenda: forma de cada categoría y radio de la alerta. */
function Leyenda({ radioKm }: { radioKm: number | null }) {
  return (
    <div
      aria-label="Leyenda del mapa"
      className="pointer-events-none absolute bottom-3 left-3 flex max-w-72 flex-col gap-1 rounded-md bg-blanco/95 px-3 py-2 text-nota shadow-1"
    >
      <div className="sobretitulo text-[11px]">Leyenda</div>
      {CATEGORIAS_MAPA.map((c) => (
        <div key={c} className="flex items-center gap-1.5">
          <FormaCategoria categoria={c} />
          {CATEGORIA_LABEL[c]} · {CATEGORIA_FORMA_LABEL[c]}
          {c === 'TRIPS' && ' · participa en alertas'}
          {c === 'DEFICIENCIA_MAGNESIO' && ' · no participa en alertas'}
        </div>
      ))}
      <div className="text-[11px] text-tinta-terciaria">
        Cada categoría tiene forma propia: se distingue sin depender del color.
      </div>
      {radioKm !== null && (
        <div className="flex items-center gap-1.5 border-t border-borde pt-1.5">
          <svg width="22" height="12" aria-hidden="true">
            <path
              d="M1 6h20"
              className="stroke-advertencia"
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          </svg>
          Radio de alerta generada · {String(radioKm).replace('.', ',')} km
        </div>
      )}
    </div>
  )
}

/** Ficha del caso al elegir un marcador (popup del diseño). */
function FichaCaso({ caso }: { caso: CasoMapa }) {
  return (
    <div className="flex w-60 flex-col gap-1.5 text-nota">
      <div className="flex items-center gap-2">
        <Link to={PATHS.caso(caso.id)} className="codigo enlace">
          #{caso.codigo}
        </Link>
        <ResultadoTecnicoBadge resultado={caso.resultado_tecnico} />
      </div>
      <div className="flex items-center gap-1.5 font-semibold">
        <FormaCategoria categoria={caso.categoria} />
        {CATEGORIA_LABEL[caso.categoria]} ({CATEGORIA_FORMA_LABEL[caso.categoria]}) ·{' '}
        {ESPECIE_LABEL[caso.especie]}
      </div>
      <div className="text-tinta-secundaria">
        {caso.productor_nombre} · Finca {caso.finca_nombre}
      </div>
      <div className="text-tinta-terciaria tabular-nums">{lugarCaso(caso)}</div>
    </div>
  )
}

/** Rectángulo que contiene todos los casos (con margen). */
function limites(casos: CasoMapa[]) {
  if (!casos.length) return null
  const lats = casos.map((c) => c.latitud)
  const lngs = casos.map((c) => c.longitud)
  const m = 0.004
  return {
    north: Math.max(...lats) + m,
    south: Math.min(...lats) - m,
    east: Math.max(...lngs) + m,
    west: Math.min(...lngs) - m,
  }
}

/** Separa un poco los casos de la misma finca para que no se tapen (~60 m). */
function posiciones(casos: CasoMapa[]) {
  const vistos = new Map<string, number>()
  return casos.map((c) => {
    const k = `${c.latitud},${c.longitud}`
    const n = vistos.get(k) ?? 0
    vistos.set(k, n + 1)
    const angulo = n * 2.4
    const r = n === 0 ? 0 : 0.0005
    return {
      caso: c,
      posicion: { lat: c.latitud + r * Math.sin(angulo), lng: c.longitud + r * Math.cos(angulo) },
    }
  })
}

interface MapaVigilanciaProps {
  casos: CasoMapa[]
  /** Capa de concentración (solo categorías que participan en alertas). */
  calor: boolean
  /** Círculo de la alerta generada más reciente. */
  alerta: { centro: Punto; radioKm: number } | null
  seleccionado: string | null
  onSeleccionar: (id: string | null) => void
}

/**
 * Mapa de vigilancia (diseño 05). Con clave de Google Maps: mapa en relieve con un marcador
 * por caso (forma + color), ficha al elegirlo, círculo de la alerta y capa de concentración.
 * Sin clave: el mapa embebido de Zetaquirá y un aviso (los casos se listan en la tabla).
 */
export function MapaVigilancia({
  casos,
  calor,
  alerta,
  seleccionado,
  onSeleccionar,
}: MapaVigilanciaProps) {
  const etiqueta = `Mapa de casos confirmados en Zetaquirá: ${casos.length} casos`
  const leyenda = <Leyenda radioKm={alerta?.radioKm ?? null} />

  if (!hayGoogleMaps()) {
    return (
      <div className="flex flex-col gap-3">
        <Aviso tono="info" titulo="Los casos se muestran en la tabla.">
          Para ver cada caso sobre el mapa, con su forma, la capa de concentración y el radio de la
          alerta, falta configurar la clave de Google Maps (VITE_GOOGLE_MAPS_API_KEY).
        </Aviso>
        <MapaEmbebido
          centro={CENTRO_ZETAQUIRA}
          zoom={12}
          etiqueta="Mapa de Zetaquirá"
          enlace={urlGoogleMapsZona(CENTRO_ZETAQUIRA, 12)}
          className="h-80"
        />
      </div>
    )
  }

  const caja = limites(casos)
  const elegido = casos.find((c) => c.id === seleccionado) ?? null
  return (
    <MapaGoogle
      etiqueta={etiqueta}
      encuadre={caja ? { limites: caja } : { centro: CENTRO_ZETAQUIRA, zoom: 12 }}
      respaldo={
        <MapaEmbebido
          centro={CENTRO_ZETAQUIRA}
          zoom={12}
          etiqueta="Mapa de Zetaquirá"
          enlace={urlGoogleMapsZona(CENTRO_ZETAQUIRA, 12)}
          className="h-full rounded-none border-0"
        />
      }
      className={ALTO}
      gestos="greedy"
      onClickMapa={() => onSeleccionar(null)}
      superpuesto={leyenda}
    >
      {calor &&
        casos
          .filter((c) => c.concentracion !== null)
          .map((c) => (
            <CirculoConcentracion
              key={`k-${c.id}`}
              centro={{ lat: c.latitud, lng: c.longitud }}
              nivel={c.concentracion!}
            />
          ))}
      {alerta && <CirculoRadio centro={alerta.centro} radioKm={alerta.radioKm} />}
      {posiciones(casos).map(({ caso, posicion }) => (
        <MarcadorCaso
          key={caso.id}
          posicion={posicion}
          categoria={caso.categoria}
          codigo={caso.codigo}
          titulo={etiquetaCaso(caso)}
          conEtiqueta={false}
          onClick={() => onSeleccionar(caso.id)}
        />
      ))}
      {elegido && (
        <InfoWindow
          position={{ lat: elegido.latitud, lng: elegido.longitud }}
          onCloseClick={() => onSeleccionar(null)}
          headerContent={<b className="font-semibold">Caso #{elegido.codigo}</b>}
        >
          <FichaCaso caso={elegido} />
        </InfoWindow>
      )}
    </MapaGoogle>
  )
}
