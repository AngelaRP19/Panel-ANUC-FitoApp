// Tipos del feature "cuenta" (pantalla 15 · Mi cuenta).
// TODO: reemplazar por los de '@/types/api' cuando exista el OpenAPI del backend.
import type { Vereda } from '@/types/enums'

export interface DatosMiCuenta {
  nombre: string
  correo: string
  /** E.164 */
  celular: string
}

export type Canal = 'panel' | 'whatsapp' | 'correo'

/** Preferencia de un aviso. Cada rol recibe sus propios avisos desde la API. */
export interface PreferenciaAviso {
  clave: string
  activo: boolean
  canales: Record<Canal, boolean>
  /** Alertas del técnico: vereda a seguir (null = todas). Ausente si no aplica. */
  vereda?: Vereda | null
}
