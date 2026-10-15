import { CATEGORIA_FORMA_LABEL, CATEGORIA_LABEL, VEREDA_LABEL } from '@/locales/es'
import type { Categoria } from '@/types/enums'
import { formatearFecha } from '@/utils/fechas'
import { formatearCoordenadas } from '@/utils/numeros'
import type { CasoMapa } from './api'

export const CATEGORIAS_MAPA: Categoria[] = [
  'TRIPS',
  'BOTRYTIS',
  'RONA',
  'FUSARIUM',
  'DEFICIENCIA_MAGNESIO',
]

/** Nombre corto para los chips («Def. magnesio»). */
export const NOMBRE_CORTO: Record<Categoria, string> = {
  ...CATEGORIA_LABEL,
  DEFICIENCIA_MAGNESIO: 'Def. magnesio',
}

export const NIVEL_CONCENTRACION: Record<number, string> = {
  1: 'Sin casos o 1 caso',
  2: 'Casos aislados',
  3: 'Cerca del umbral',
  4: 'Umbral alcanzado',
}

/** Categorías ocultas de la URL («TRIPS,RONA»). */
export const leerOcultas = (texto: string) =>
  new Set(texto.split(',').filter(Boolean) as Categoria[])

/** «Trips (triángulo) · caso #0229 · Los Naranjos · 22 sep 2026» (nombre del marcador). */
export function etiquetaCaso(c: CasoMapa) {
  return `${CATEGORIA_LABEL[c.categoria]} (${CATEGORIA_FORMA_LABEL[c.categoria]}) · caso #${c.codigo} · ${c.finca_nombre} · ${formatearFecha(c.fecha)}`
}

/** «Juracambita · 22 sep 2026 · 5.2523, -73.1788» */
export function lugarCaso(c: CasoMapa) {
  return `${VEREDA_LABEL[c.vereda]} · ${formatearFecha(c.fecha)} · ${formatearCoordenadas(c.latitud, c.longitud)}`
}
