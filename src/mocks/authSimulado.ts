// Simulador de Cognito para desarrollo y pruebas (VITE_USE_MOCKS=true). Imita los mismos
// casos que la interfaz debe manejar: credenciales incorrectas, cuenta deshabilitada,
// contraseña temporal, demasiados intentos y recuperación con código.
//
// Cuentas: ver mocks/fixtures/usuarios.ts. Código de recuperación válido: 123456.
import { ErrorAuth, type AdaptadorAuth } from '@/services/auth/tipos'
import { usuarios, type UsuarioFixture } from './fixtures/usuarios'

export const CODIGO_RECUPERACION_DEMO = '123456'
const PREFIJO_TOKEN = 'simulado.'
const CLAVE_SESION = 'anuc.sesion-simulada'
const MAX_INTENTOS = 5
const POLITICA = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

let intentosFallidos = 0
let pendienteNuevaContrasena: UsuarioFixture | null = null
let sesionEnMemoria: string | null = null

// La sesión sobrevive a recargar la página (como Amplify). Si el almacenamiento falla,
// se conserva solo en memoria.
const almacen = {
  leer(): string | null {
    try {
      return sessionStorage.getItem(CLAVE_SESION) ?? sesionEnMemoria
    } catch {
      return sesionEnMemoria
    }
  },
  guardar(id: string | null) {
    sesionEnMemoria = id
    try {
      if (id) sessionStorage.setItem(CLAVE_SESION, id)
      else sessionStorage.removeItem(CLAVE_SESION)
    } catch {
      /* solo memoria */
    }
  },
}

const esperar = () => new Promise((r) => setTimeout(r, 300))
const buscar = (correo: string) =>
  usuarios.find((u) => u.correo.toLowerCase() === correo.trim().toLowerCase())

/** Usuario dueño de un token simulado (lo usan los handlers de MSW). */
export function usuarioDelToken(token: string | null | undefined): UsuarioFixture | undefined {
  if (!token?.startsWith(PREFIJO_TOKEN)) return undefined
  const id = token.slice(PREFIJO_TOKEN.length)
  return usuarios.find((u) => u.id === id && u.activo)
}

/** Reinicia el estado del simulador (pruebas). */
export function reiniciarAuthSimulada() {
  intentosFallidos = 0
  pendienteNuevaContrasena = null
  almacen.guardar(null)
}

export const adaptadorSimulado: AdaptadorAuth = {
  async iniciarSesion(correo, contrasena) {
    await esperar()
    if (intentosFallidos >= MAX_INTENTOS) throw new ErrorAuth('DEMASIADOS_INTENTOS')
    const u = buscar(correo)
    // Cuenta deshabilitada: mismo error genérico que credenciales incorrectas (RQF02).
    if (!u || !u.activo || u.contrasena !== contrasena) {
      intentosFallidos++
      throw new ErrorAuth('CREDENCIALES')
    }
    intentosFallidos = 0
    if (u.contrasenaTemporal) {
      pendienteNuevaContrasena = u
      return { paso: 'NUEVA_CONTRASENA' }
    }
    almacen.guardar(u.id)
    return { paso: 'LISTO' }
  },

  async confirmarNuevaContrasena(nueva) {
    await esperar()
    const u = pendienteNuevaContrasena
    if (!u) throw new ErrorAuth('DESCONOCIDO', 'No hay un cambio de contraseña en curso')
    if (!POLITICA.test(nueva)) throw new ErrorAuth('CONTRASENA_INVALIDA')
    u.contrasena = nueva
    u.contrasenaTemporal = false
    pendienteNuevaContrasena = null
    almacen.guardar(u.id)
  },

  async cerrarSesion() {
    almacen.guardar(null)
  },

  async obtenerToken() {
    const id = almacen.leer()
    return id ? PREFIJO_TOKEN + id : null
  },

  async solicitarCodigo(correo) {
    await esperar()
    if (!buscar(correo)) throw new ErrorAuth('CUENTA_INEXISTENTE')
  },

  async confirmarRecuperacion(correo, codigo, nueva) {
    await esperar()
    const u = buscar(correo)
    if (!u) throw new ErrorAuth('CUENTA_INEXISTENTE')
    if (codigo !== CODIGO_RECUPERACION_DEMO) throw new ErrorAuth('CODIGO_INVALIDO')
    if (!POLITICA.test(nueva)) throw new ErrorAuth('CONTRASENA_INVALIDA')
    u.contrasena = nueva
    u.contrasenaTemporal = false
  },
}
