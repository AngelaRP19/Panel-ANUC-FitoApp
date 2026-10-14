// Tipos del feature "alertas" (pantalla 11 «Alertas epidemiológicas»).
// TODO: reemplazar por los de '@/types/api' cuando exista el OpenAPI del backend.
import type { Pagina } from '@/features/casos'
import type { Categoria, EstadoAlerta, ResultadoTecnico, Vereda } from '@/types/enums'

interface Persona {
  id: string
  nombre: string
}

export interface ParametrosAlerta {
  num_casos: number
  distancia_km: number
  intervalo_dias: number
}

export interface AlertaResumen {
  /** «ALR-012» */
  id: string
  estado: EstadoAlerta
  categoria: Categoria
  vereda: Vereda
  generada_en: string
  num_casos: number
  /** Distancia máxima real entre los casos (km). */
  radio_km: number
  /** Parámetros con que se generó la alerta. */
  parametros: ParametrosAlerta
  revisa: Persona | null
  confirmada_por: Persona | null
  productores_notificados: number | null
  motivo_descarte: string | null
}

export type FiltroEstadoAlerta = EstadoAlerta | 'TODAS'

export interface ListaAlertas extends Pagina<AlertaResumen> {
  conteos: Record<FiltroEstadoAlerta, number>
}

export interface CasoAlerta {
  id: string
  codigo: string
  productor_nombre: string
  finca_nombre: string
  resultado_tecnico: ResultadoTecnico
  enviado_en: string | null
  latitud: number | null
  longitud: number | null
  /** Quien consulta puede abrir el caso (el técnico solo los suyos). */
  enlazable: boolean
}

export interface Alerta extends AlertaResumen {
  casos: CasoAlerta[]
  /** Casos de la misma categoría en la zona aún sin diagnóstico técnico (no cuentan). */
  sin_diagnostico: string[]
  confirmada_en: string | null
  comunicada_en: string | null
  descarte: { motivo: string; por: Persona; en: string } | null
  /** Mensaje a productores guardado como borrador (pantalla 12). */
  borrador: BorradorMensaje | null
  /** Quien consulta pidió «Avisarme cuando cambie». */
  siguiendo: boolean
}

export type FiltrosAlertas = {
  /** '' = todas */
  estado: string
  page: string
}

export interface BorradorMensaje {
  /** Recomendación del técnico (máx. 300 caracteres). */
  mensaje: string
  veredas: Vereda[]
  guardado_en?: string
}

export interface DestinatariosVereda {
  vereda: Vereda
  /** Es la vereda donde se detectó la alerta. */
  zona_alerta: boolean
  /** Productores activos: los únicos que reciben el mensaje. */
  productores: { id: string; nombre: string; celular: string }[]
  deshabilitados: number
}

/** Parámetros epidemiológicos de una categoría (pantalla 13 · RQF25). */
export interface ParametroCategoria extends ParametrosAlerta {
  categoria: Categoria
  /** Participa en la detección de concentraciones. */
  habilitada: boolean
  /** Explicación extra de por qué no participa. */
  nota: string | null
  actualizado_por: Persona | null
  actualizado_en: string | null
}
