// Tipos del feature "productores" (contrato propuesto en la guía, pantalla 8).
// TODO: reemplazar por los de '@/types/api' cuando exista el OpenAPI del backend.
import type { Especie, Vereda } from '@/types/enums'

export interface Productor {
  id: string
  nombre: string
  /** E.164 (+573134027781) */
  celular: string
  activo: boolean
  /** Vereda de su primera finca (para la tabla). */
  vereda: Vereda | string | null
  fincas: { id: string; nombre: string; vereda: Vereda | string; especies: (Especie | string)[] }[]
  registrado_en: string
  ultima_consulta_en: string | null
  casos_ultimo_anio: number
  casos_activos: number
}

/** Filtros de la lista tal como viven en la URL. '' = sin filtro. */
export type FiltrosProductores = {
  q: string
  /** 'activo' | 'deshabilitado' */
  estado: string
  vereda: string
  especie: string
  /** 'con' | 'sin' (casos activos) */
  casos: string
  /** Texto: nombre de la finca. */
  finca: string
  /** aaaa-mm-dd */
  desde: string
  hasta: string
  /** '30' (consultó en los últimos 30 días) | '90' (sin consultas en 90 días) */
  consulta: string
  page: string
  /** Filas por página: '10' | '25' | '50' */
  filas: string
}

export interface ResumenProductores {
  total: number
  activos: number
}

export interface DatosProductor {
  nombre: string
  /** E.164 */
  celular: string
  activo: boolean
}
