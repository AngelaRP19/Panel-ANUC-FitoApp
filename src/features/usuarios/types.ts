// Tipos del feature "usuarios" (cuentas del panel · pantalla 10 «Técnicos»).
// TODO: reemplazar por los de '@/types/api' cuando exista el OpenAPI del backend.
import type { Rol } from '@/types/enums'

export interface Cuenta {
  id: string
  nombre: string
  correo: string
  /** E.164 */
  celular: string
  rol: Rol
  activo: boolean
  /** En revisión y registrados sin cerrar. */
  casos_activos: number
  /** En revisión (sin diagnóstico). */
  casos_pendientes: number
  /** Es la única cuenta activa de su rol: no se puede desactivar. */
  unica_activa_del_rol: boolean
}

export type FiltrosCuentas = {
  q: string
  /** 'LIDER_TECNICO' | 'TECNICO' */
  rol: string
  /** 'activa' | 'deshabilitada' */
  estado: string
  /** 'pendientes' | 'sin' */
  carga: string
  page: string
}

export interface DatosCuenta {
  nombre: string
  correo: string
  /** E.164 */
  celular: string
  rol: Rol
}
