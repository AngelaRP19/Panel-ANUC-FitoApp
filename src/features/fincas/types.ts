// Tipos del feature "fincas" (contrato propuesto en la guía, pantalla 9).
// TODO: reemplazar por los de '@/types/api' cuando exista el OpenAPI del backend.
import type { Especie, TipoCultivo, Vereda } from '@/types/enums'

/** Un cultivo es una unidad productiva dentro de la finca, con una o varias especies. */
export interface CultivoFinca {
  id: string
  nombre: string
  tipo: TipoCultivo | string
  especies: (Especie | string)[]
  /** ids de los casos activos del cultivo. */
  casos_activos: string[]
}

export interface Finca {
  id: string
  nombre: string
  vereda: Vereda | string
  latitud: number
  longitud: number
  productor: { id: string; nombre: string; activo: boolean }
  cultivos: CultivoFinca[]
  casos_activos: number
}

export type FiltrosFincas = {
  q: string
  vereda: string
  especie: string
  /** 'INVERNADERO' | 'CAMPO_ABIERTO' */
  tipo: string
  /** 'con' | 'sin' */
  casos: string
  /** id del productor (desde «Ver fincas» en la ficha del productor). */
  productor: string
  page: string
}

export interface ResumenFincas {
  fincas: number
  cultivos: number
  veredas: string[]
}

export interface DatosFinca {
  nombre: string
  vereda: Vereda | string
  latitud: number
  longitud: number
  /** Solo al registrar. */
  productor_id?: string
  /** Solo al editar: tipo y especies de cada cultivo. */
  cultivos?: { id: string; tipo: TipoCultivo | string; especies: (Especie | string)[] }[]
  /** Guardar aunque se quite una especie que usan casos activos. */
  forzar?: boolean
}

/** Detalle del 409 al quitar una especie en uso. */
export interface EspecieEnUso {
  cultivo: string
  especie: Especie | string
  casos: string[]
}
