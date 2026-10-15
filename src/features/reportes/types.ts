// Tipos del feature "reportes" (pantallas 23 y 24 · Fase C).
// Contrato propuesto: la API devuelve cada reporte como KPI + secciones genéricas (barras,
// tablas y datos), así el panel dibuja los cinco reportes con un solo renderizador y cada
// gráfica se puede ver también como tabla. Los reportes no incluyen fotos ni conservación.
// TODO: reemplazar por los tipos de '@/types/api' cuando el backend publique el OpenAPI.
import type { Categoria } from '@/types/enums'

export type TipoReporte = 'casos' | 'identificacion' | 'alertas' | 'productores' | 'tecnicos'

/** Panel de filtros de cada reporte: F1 generales, F2 alertas, F3 productores, F4 técnicos. */
export type PanelFiltros = 'general' | 'alertas' | 'productores' | 'tecnicos'

/** Filtros tal como viven en la URL y viajan a la API (listas separadas por coma). */
export type FiltrosReporte = Record<string, string>

export type TonoKpiReporte = 'info' | 'ok' | 'adv' | 'revision' | 'peligro' | 'neutro'

export interface KpiReporte {
  rotulo: string
  valor: string
  pie: string
  tono: TonoKpiReporte
}

export interface ItemBarra {
  etiqueta: string
  valor: number
  /** Texto de la cifra («10 · 6 conf.», «1,5 días»). Por defecto, el valor. */
  texto?: string
  /** Muestra la forma de la categoría junto a la etiqueta. */
  categoria?: Categoria | null
}

interface SeccionBase {
  id: string
  titulo: string
  subtitulo?: string
  ancho: 'mitad' | 'completo'
  nota?: string
}

export interface SeccionBarras extends SeccionBase {
  tipo: 'barras'
  items: ItemBarra[]
}

export interface ColumnaTabla {
  clave: string
  titulo: string
  alinear?: 'derecha'
}

export interface SeccionTabla extends SeccionBase {
  tipo: 'tabla'
  columnas: ColumnaTabla[]
  /** `_caso`: id del caso de la fila (la primera columna enlaza a él). */
  filas: Record<string, string | number>[]
  porPagina?: number
  /** Sustantivo del pie de paginación («casos», «alertas»). */
  sustantivo?: string
  vacio?: string
}

export interface SeccionDatos extends SeccionBase {
  tipo: 'datos'
  items: { termino: string; valor: string }[]
}

export type SeccionReporte = SeccionBarras | SeccionTabla | SeccionDatos

export interface ReporteDatos {
  tipo: TipoReporte
  titulo: string
  subtitulo: string
  /** Elementos que coinciden con los filtros (pie del panel de filtros). */
  total: number
  sustantivo: string
  kpis: KpiReporte[]
  secciones: SeccionReporte[]
}

export interface TarjetaReporte {
  tipo: TipoReporte
  titulo: string
  descripcion: string
  destacados: string[]
}

export interface ResumenReportes {
  subtitulo: string
  total: number
  sustantivo: string
  kpis: KpiReporte[]
  reportes: TarjetaReporte[]
  secciones: SeccionReporte[]
}

export type Visibilidad = 'yo' | 'equipo'
export type Frecuencia = 'no' | 'semana' | 'mes'

export interface ConsultaGuardada {
  id: string
  nombre: string
  tipo: TipoReporte
  descripcion: string
  filtros: FiltrosReporte
  /** Resultado actual («6 casos»), recalculado al pedir la lista. */
  resultado: string
  visibilidad: Visibilidad
  envio: { frecuencia: Frecuencia; dia_hora: string; formato: string; correos: string[] } | null
  creada_por: string
}

export interface DatosConsulta {
  nombre: string
  tipo: TipoReporte
  filtros: FiltrosReporte
  visibilidad: Visibilidad
  envio: ConsultaGuardada['envio']
}
