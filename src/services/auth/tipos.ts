// Contrato del proveedor de identidad. Hoy lo implementa Cognito (cognito.ts) y, en
// desarrollo con VITE_USE_MOCKS=true, un simulador en memoria (mocks/authSimulado.ts).

/** Resultado de iniciar sesión: entra directo o debe cambiar la contraseña temporal (RQF11). */
export type ResultadoInicioSesion = { paso: 'LISTO' } | { paso: 'NUEVA_CONTRASENA' }

export type CodigoErrorAuth =
  /** Correo o contraseña incorrectos, o cuenta deshabilitada (mismo mensaje, RQF02). */
  | 'CREDENCIALES'
  | 'DEMASIADOS_INTENTOS'
  /** Recuperación: el correo no tiene cuenta (RQF06). */
  | 'CUENTA_INEXISTENTE'
  /** Recuperación: código incorrecto o vencido. */
  | 'CODIGO_INVALIDO'
  /** La nueva contraseña no cumple la política. */
  | 'CONTRASENA_INVALIDA'
  | 'RED'
  | 'DESCONOCIDO'

export class ErrorAuth extends Error {
  readonly codigo: CodigoErrorAuth
  constructor(codigo: CodigoErrorAuth, mensaje?: string) {
    super(mensaje ?? codigo)
    this.name = 'ErrorAuth'
    this.codigo = codigo
  }
}

export function esErrorAuth(error: unknown): error is ErrorAuth {
  return error instanceof ErrorAuth
}

export interface AdaptadorAuth {
  iniciarSesion(correo: string, contrasena: string): Promise<ResultadoInicioSesion>
  /** Completa el reto de contraseña temporal iniciado en `iniciarSesion`. */
  confirmarNuevaContrasena(nueva: string): Promise<void>
  cerrarSesion(): Promise<void>
  /** Token para la API (renovado por el proveedor). null si no hay sesión. */
  obtenerToken(): Promise<string | null>
  /** Recuperación, paso 1: envía un código al correo. */
  solicitarCodigo(correo: string): Promise<void>
  /** Recuperación, paso 2: valida el código y fija la nueva contraseña. */
  confirmarRecuperacion(correo: string, codigo: string, nueva: string): Promise<void>
}
