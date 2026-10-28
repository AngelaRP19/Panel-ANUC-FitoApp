// Tipos del feature "cuenta" (pantalla 15 · Mi cuenta).
// TODO: reemplazar por los de '@/types/api' cuando exista el OpenAPI del backend.

export interface DatosMiCuenta {
  nombre: string
  correo: string
  /** E.164 */
  celular: string
}
