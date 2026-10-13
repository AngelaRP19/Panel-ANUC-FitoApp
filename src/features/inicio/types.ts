// Contrato propuesto para el resumen del inicio (el CONTEXTO aún no define estos endpoints).
// TODO: reemplazar por los tipos de '@/types/api' cuando el backend publique el OpenAPI.
import type { Categoria, EstadoAlerta } from '@/types/enums'

export interface ResumenPanel {
  /** Momento en que se calcularon los datos (UTC). */
  generado_en: string
  kpis: {
    pendientes_revision: number
    /** Pendientes con más de 48 h desde que llegaron al panel. */
    pendientes_mas_48h: number
    en_analisis_tecnico: number
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
  /** Casos PENDIENTE_REVISION más antiguos (por enviado_a_panel_en ascendente). */
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
  /** PENDIENTE_REVISION + ANALISIS_TECNICO asignados. */
  activos: number
  pendientes: number
}

export type PeriodoCategorias = '30d' | '90d' | 'anio'

export interface CasosPorCategoria {
  periodo: PeriodoCategorias
  total: number
  items: { categoria: Categoria; total: number }[]
}
