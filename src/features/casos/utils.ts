// Utilidades del feature "casos" (sin componentes, para no romper el refresco rápido).
import { ESTADO_CASO_LABEL, etiqueta } from '@/locales/es'
import type { EstadoCaso } from '@/types/enums'
import { tiempoEspera } from '@/utils/fechas'
import type { CasoResumen, FiltrosCasos } from './types'

/** Estados en los que un caso todavía se atiende (admite técnico). */
export const ESTADOS_ACTIVOS: EstadoCaso[] = ['PENDIENTE_REVISION', 'EN_REVISION', 'REGISTRADO']

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
