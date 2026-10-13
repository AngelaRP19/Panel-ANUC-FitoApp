/** Estado de navegación con el que la recuperación de cuenta vuelve al login (diseño 01e). */
export interface EstadoVueltaLogin {
  contrasenaActualizada?: boolean
  /** El correo queda escrito y la contraseña vacía. */
  correo?: string
}
