// Adaptador de Amazon Cognito. ÚNICO archivo del proyecto que conoce Amplify:
// si el equipo cambia de proveedor, se reescribe solo este archivo.
import { Amplify } from 'aws-amplify'
import {
  confirmResetPassword,
  confirmSignIn,
  fetchAuthSession,
  resetPassword,
  signIn,
  signOut,
} from 'aws-amplify/auth'
import { env } from '@/config/env'
import { ErrorAuth, type AdaptadorAuth, type CodigoErrorAuth } from './tipos'

let configurado = false

function configurar() {
  if (configurado) return
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: env.cognito.userPoolId,
        userPoolClientId: env.cognito.clientId,
        loginWith: { email: true },
      },
    },
  })
  configurado = true
}

/** Traduce las excepciones de Cognito a los códigos que entiende la interfaz. */
function traducirError(error: unknown): ErrorAuth {
  const nombre = error instanceof Error ? error.name : ''
  const mensaje = error instanceof Error ? error.message : ''
  const mapa: Record<string, CodigoErrorAuth> = {
    NotAuthorizedException: /attempts exceeded/i.test(mensaje)
      ? 'DEMASIADOS_INTENTOS'
      : 'CREDENCIALES',
    UserNotFoundException: 'CREDENCIALES',
    UserNotConfirmedException: 'CREDENCIALES',
    PasswordResetRequiredException: 'CREDENCIALES',
    TooManyRequestsException: 'DEMASIADOS_INTENTOS',
    LimitExceededException: 'DEMASIADOS_INTENTOS',
    TooManyFailedAttemptsException: 'DEMASIADOS_INTENTOS',
    CodeMismatchException: 'CODIGO_INVALIDO',
    ExpiredCodeException: 'CODIGO_INVALIDO',
    InvalidPasswordException: 'CONTRASENA_INVALIDA',
    NetworkError: 'RED',
  }
  return new ErrorAuth(mapa[nombre] ?? 'DESCONOCIDO', mensaje)
}

async function conErrores<T>(fn: () => Promise<T>): Promise<T> {
  configurar()
  try {
    return await fn()
  } catch (error) {
    throw error instanceof ErrorAuth ? error : traducirError(error)
  }
}

export const adaptadorCognito: AdaptadorAuth = {
  iniciarSesion: (correo, contrasena) =>
    conErrores(async () => {
      const { isSignedIn, nextStep } = await signIn({ username: correo, password: contrasena })
      if (isSignedIn) return { paso: 'LISTO' }
      if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        return { paso: 'NUEVA_CONTRASENA' }
      }
      // Otros retos (MFA, verificación) no están contemplados en el panel (P-09).
      throw new ErrorAuth('DESCONOCIDO', `Paso de inicio no soportado: ${nextStep.signInStep}`)
    }),

  confirmarNuevaContrasena: (nueva) =>
    conErrores(async () => {
      const { isSignedIn } = await confirmSignIn({ challengeResponse: nueva })
      if (!isSignedIn) throw new ErrorAuth('DESCONOCIDO', 'No se completó el cambio de contraseña')
    }),

  cerrarSesion: () => conErrores(() => signOut()),

  obtenerToken: async () => {
    configurar()
    try {
      const sesion = await fetchAuthSession()
      return sesion.tokens?.accessToken?.toString() ?? null
    } catch {
      return null
    }
  },

  // Nota: con la protección contra enumeración de usuarios activa, Cognito no informa si el
  // correo existe. Para el mensaje de RQF06 hace falta el endpoint propio del backend (P-08).
  solicitarCodigo: (correo) =>
    conErrores(async () => {
      try {
        await resetPassword({ username: correo })
      } catch (error) {
        if (error instanceof Error && error.name === 'UserNotFoundException') {
          throw new ErrorAuth('CUENTA_INEXISTENTE')
        }
        throw error
      }
    }),

  confirmarRecuperacion: (correo, codigo, nueva) =>
    conErrores(() =>
      confirmResetPassword({ username: correo, confirmationCode: codigo, newPassword: nueva }),
    ),
}
