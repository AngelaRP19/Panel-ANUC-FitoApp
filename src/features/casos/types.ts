// Tipos del feature "casos" (contrato propuesto en la guía, pantalla 5).
// TODO: reemplazar por los de '@/types/api' cuando exista el OpenAPI del backend.
import type { Categoria, EstadoCaso, Especie, ResultadoAnalisis, Rol, Vereda } from '@/types/enums'

/** Fila de la bandeja (GET /casos). */
export interface CasoResumen {
  /** Código de 4 dígitos; se muestra «#0241». */
  id: string
  estado: EstadoCaso
  productor: { id: string; nombre: string; celular: string }
  finca: { id: string; nombre: string; vereda: Vereda | string }
  cultivo: { id: string; nombre: string }
  especie: Especie | string
  /** null mientras el chatbot no termina el análisis. */
  preliminar: {
    resultado: ResultadoAnalisis
    categoria: Categoria | null
    porcentaje: number | null
    alternativa?: { categoria: Categoria; porcentaje: number } | null
  } | null
  tecnico: { id: string; nombre: string } | null
  /** null: «Sin enviar». */
  enviado_a_panel_en: string | null
  vence_en: string | null
  conservacion_extendida: boolean
}

export interface Pagina<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

/** Conteos por estado para las pestañas (GET /casos/conteos), con los filtros aplicados. */
export type ConteosCasos = Partial<Record<EstadoCaso, number>> & { todos: number }

/** Filtros de la bandeja tal como viven en la URL. '' = sin filtro. */
export type FiltrosCasos = {
  /** 'todos' o un EstadoCaso. */
  estado: string
  q: string
  vereda: string
  finca: string
  cultivo: string
  especie: string
  /** Categoria o 'NO_IDENTIFICADA'. */
  categoria: string
  /** id del técnico o 'sin_asignar' (solo líder). */
  tecnico: string
  /** Coincidencia de síntomas mínima: '50', '70' u '85'. */
  coincidencia: string
  /** '15', '30' o 'extendida'. */
  vencimiento: string
  /** aaaa-mm-dd */
  desde: string
  hasta: string
  page: string
}

/** Opciones de los filtros (GET /casos/filtros): solo lo que existe en los casos visibles. */
export interface OpcionesFiltroCasos {
  veredas: { id: string; nombre: string }[]
  fincas: { id: string; nombre: string; vereda: string }[]
  cultivos: { id: string; nombre: string; finca_id: string }[]
}

/** Técnico que puede recibir casos, con su carga (GET /tecnicos?activo=true&con_carga=true). */
export interface TecnicoAsignable {
  id: string
  nombre: string
  rol: Rol
  /** Casos activos: en revisión y registrados sin cerrar. */
  activos: number
  en_revision: number
}
