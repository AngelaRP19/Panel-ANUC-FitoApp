// Contrato propuesto para el inicio del líder (pantalla 16): GET /panel/resumen y
// GET /panel/casos-por-categoria (solo líder).
// TODO: reemplazar por los tipos de '@/types/api' cuando el backend publique el OpenAPI.
import type { Categoria, EstadoAlerta, EstadoCaso, ResultadoTecnico } from '@/types/enums'

export interface ResumenPanel {
  /** Momento en que se calcularon los datos (UTC). */
  generado_en: string
  kpis: {
    /** Pendientes de revisión: sin técnico asignado. */
    pendientes_revision: number
    /** Pendientes con más de 48 h desde que llegaron al panel. */
    pendientes_mas_48h: number
    /** En revisión: con técnico asignado y sin diagnóstico. */
    en_revision: number
    /** Casos cerrados en el mes de `generado_en`, por resultado técnico. */
    cerrados_mes: {
      total: number
      confirmados: number
      otra_patologia: number
      no_identificado: number
      requiere_visita: number
    }
    /** Casos cuya fecha de vencimiento de conservación cae dentro de `dias_aviso_vencimiento`. */
    proximos_a_vencer: number
    dias_aviso_vencimiento: number
  }
  /** Casos sin diagnóstico (pendientes y en revisión) más antiguos, por envío ascendente. */
  pendientes_antiguos: CasoPendiente[]
  pendientes_sin_tecnico: number
  alertas: {
    generadas_sin_revisar: number
    /** Alerta GENERADA más reciente, para el texto destacado. */
    destacada: { categoria: Categoria; vereda: string } | null
    recientes: AlertaReciente[]
  }
  carga_tecnicos: CargaTecnico[]
}

export interface CasoPendiente {
  id: string
  numero: number
  productor_nombre: string
  enviado_a_panel_en: string
  tecnico_asignado_id: string | null
}

export interface AlertaReciente {
  id: string
  estado: EstadoAlerta
  categoria: Categoria
  vereda: string
  num_casos: number
  /** Productores a los que se envió el mensaje (solo COMUNICADA). */
  productores_notificados: number | null
  generada_en: string
}

export interface CargaTecnico {
  tecnico_id: string
  nombre: string
  /** Casos activos: en revisión y registrados sin cerrar. */
  activos: number
  /** En revisión (sin diagnóstico). */
  en_revision: number
}

export type PeriodoCategorias = '30d' | '90d' | 'anio'

/** Inicio del técnico (pantalla 17 · GET /panel/resumen-tecnico): solo sus casos. */
export interface ResumenTecnico {
  generado_en: string
  nombre: string
  /** Líder técnico activo, para pedirle un caso que no aparece. */
  lider_nombre: string | null
  kpis: {
    en_revision: number
    en_revision_mas_48h: number
    /** Ids de sus casos con diagnóstico guardado y sin cerrar. */
    registrados_sin_cerrar: string[]
    cerrados_mes: ResumenPanel['kpis']['cerrados_mes']
    proximos_a_vencer: number
    dias_aviso_vencimiento: number
  }
  /** En revisión (los que más esperan primero) y luego registrados sin cerrar. */
  por_atender: {
    id: string
    productor_nombre: string
    estado: EstadoCaso
    enviado_a_panel_en: string | null
    /** Lleva más de 48 h en espera (se resalta). */
    mas_48h: boolean
  }[]
  diagnosticos_recientes: {
    caso_id: string
    resultado_tecnico: ResultadoTecnico
    categoria: Categoria | null
    registrado_en: string
  }[]
}

export interface CasosPorCategoria {
  periodo: PeriodoCategorias
  total: number
  items: { categoria: Categoria; total: number }[]
}
