// Utilidades del feature "casos" (sin componentes, para no romper el refresco rápido).
import { esErrorApi } from '@/services/apiClient'
import { ESTADO_CASO_LABEL, TIPO_EVIDENCIA_LABEL, etiqueta } from '@/locales/es'
import type { EstadoCaso, TipoEvidencia } from '@/types/enums'
import { tiempoEspera } from '@/utils/fechas'
import type { CasoResumen, Evidencia, FiltrosCasos } from './types'

/** Estados en los que un caso todavía se atiende (admite técnico). */
export const ESTADOS_ACTIVOS: EstadoCaso[] = ['PENDIENTE_REVISION', 'EN_REVISION', 'REGISTRADO']

/**
 * Estados en los que el líder asigna o reasigna el técnico (igual que el backend). Un caso
 * Registrado ya no se reasigna: solo pasa a Cerrado (D-22). En el detalle manda `puede_asignar`.
 */
export const ESTADOS_ASIGNABLES: EstadoCaso[] = ['PENDIENTE_REVISION', 'EN_REVISION']

/** «Ana Lucía Becerra» → «Ana Becerra». */
export function nombreCorto(nombre: string) {
  const partes = nombre.split(/\s+/).filter(Boolean)
  return partes.length > 2 ? `${partes[0]} ${partes[partes.length - 1]}` : nombre
}

/** Nombre accesible de la fila: «Caso #0240, Pedro Nel Suárez, Pendiente de revisión, 6 h en espera. Ver resumen». */
export function etiquetaFila(c: CasoResumen) {
  const espera =
    c.estado === 'PENDIENTE_REVISION' && c.enviado_a_panel_en
      ? `, ${tiempoEspera(c.enviado_a_panel_en)}`
      : ''
  return `Caso #${c.id}, ${c.productor.nombre}, ${etiqueta(ESTADO_CASO_LABEL, c.estado)}${espera}. Ver resumen`
}

/** Filtros del panel «Filtros» (todo menos estado, búsqueda y página). */
export type FiltrosPanel = Pick<
  FiltrosCasos,
  | 'vereda'
  | 'finca'
  | 'cultivo'
  | 'especie'
  | 'categoria'
  | 'tecnico'
  | 'coincidencia'
  | 'vencimiento'
  | 'desde'
  | 'hasta'
>

export const CLAVES_PANEL: (keyof FiltrosPanel)[] = [
  'vereda',
  'finca',
  'cultivo',
  'especie',
  'categoria',
  'tecnico',
  'coincidencia',
  'vencimiento',
  'desde',
  'hasta',
]

/** Tipos de evidencia de la galería y el visor, en el orden del diseño. */
export const TIPOS_GALERIA: TipoEvidencia[] = ['HOJA', 'ENVES', 'FRUTO', 'TALLO']

/** Texto alternativo de una evidencia: «Evidencia fruto 2 · caso #0241». */
export function textoAlternativo(e: Evidencia, idCaso: string) {
  return `Evidencia ${etiqueta(TIPO_EVIDENCIA_LABEL, e.tipo).toLowerCase()} ${e.numero} · caso #${idCaso}`
}

/** El caso no existe (o se eliminó al vencer su conservación): la API respondió 404. */
export function esCasoNoEncontrado(error: unknown) {
  return esErrorApi(error) && error.status === 404
}
