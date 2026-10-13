// Tipos del feature "casos" (contrato propuesto en la guía, pantalla 5).
// TODO: reemplazar por los de '@/types/api' cuando exista el OpenAPI del backend.
import type {
  Categoria,
  EstadoCaso,
  Especie,
  ResultadoAnalisis,
  ResultadoTecnico,
  Rol,
  TipoCultivo,
  TipoEvidencia,
  Vereda,
} from '@/types/enums'

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

/** Detalle consolidado de un caso (GET /casos/{id}). */
export interface CasoDetalle extends Omit<CasoResumen, 'productor' | 'finca' | 'cultivo'> {
  productor: { id: string; nombre: string; celular: string; casos_ultimo_anio: number }
  finca: {
    id: string
    nombre: string
    vereda: Vereda | string
    latitud: number | null
    longitud: number | null
  }
  cultivo: {
    id: string
    nombre: string
    tipo: TipoCultivo | string
    especies: (Especie | string)[]
  }
  /** «fruto y hojas» */
  zona_afectada: string
  /** Texto que acompaña al resultado preliminar. */
  preliminar_resumen: string | null
  /** Resultado ambiguo: en qué coincide cada categoría. */
  preliminar_coincidencias: { categoria: Categoria; texto: string }[]
  /** Pista para el técnico (cómo distinguir o verificar). */
  preliminar_pista: string | null
  cerrado_en: string | null
  evidencias_resumen: {
    total: number
    /** Máximo de evidencias útiles que pide el chatbot (12). */
    maximo: number
    por_tipo: Partial<Record<TipoEvidencia, number>>
  }
  cuestionario_resumen: { respuestas: number; desde: string | null; hasta: string | null }
  historial_ultimo: { titulo: string; en: string } | null
  /** Diagnóstico técnico guardado (Registrado o Cerrado). */
  diagnostico: Diagnostico | null
}

/** Resultado técnico · decisión humana (POST /casos/{id}/diagnostico). */
export interface Diagnostico {
  resultado_tecnico: ResultadoTecnico
  categoria_determinada: Categoria | null
  motivo_visita: string | null
  descripcion: string
  observaciones: string
  tecnico_responsable: { id: string; nombre: string }
  registrado_en: string
}

export interface DatosDiagnostico {
  resultado_tecnico: ResultadoTecnico
  categoria_determinada?: Categoria | null
  motivo_visita?: string | null
  descripcion?: string
  observaciones?: string
  /** Solo el líder lo elige; el técnico es siempre el responsable de sus casos. */
  tecnico_responsable_id?: string | null
}

/** Foto de evidencia (GET /casos/{id}/evidencias). La URL es prefirmada y vence. */
export interface Evidencia {
  id: string
  tipo: TipoEvidencia
  /** Número dentro de su tipo (Fruto 2). */
  numero: number
  descripcion: string
  url: string | null
  recibida_en: string
  pregunta: string
}

export interface Cuestionario {
  desde: string | null
  hasta: string | null
  respuestas: { pregunta: string; respuesta: string }[]
}

export type TipoEventoHistorial =
  | 'CREADO'
  | 'ANALISIS'
  | 'ENVIADO'
  | 'ASIGNADO'
  | 'DIAGNOSTICO'
  | 'CIERRE'
  | 'EXTENSION'
  | 'DESCARTE'

/** Paso del historial (GET /casos/{id}/historial). Los pasos futuros llegan con `pendiente`. */
export interface EventoHistorial {
  tipo: TipoEventoHistorial | string
  titulo: string
  en: string | null
  detalle: string
  pendiente: boolean
}

/** Explicación del resultado preliminar (GET /casos/{id}/explicacion). */
export interface Explicacion {
  coincide: string[]
  descarta: { categoria: Categoria; texto: string }[]
  /** Categorías por debajo del mínimo para sugerirse, o las más cercanas si no se identificó. */
  cercanas: { categoria: Categoria; porcentaje: number }[]
  texto: string | null
}
