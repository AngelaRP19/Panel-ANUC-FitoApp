// Lee y valida las variables VITE_* una sola vez. El resto del código importa `env`.
// No hay banderas de reapertura: los casos cerrados no se reabren.
import { z } from 'zod'

const esquema = z
  .object({
    VITE_API_URL: z.string().min(1).default('/api/v1'),
    VITE_USE_MOCKS: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    VITE_COGNITO_USER_POOL_ID: z.string().default(''),
    VITE_COGNITO_CLIENT_ID: z.string().default(''),
  })
  .superRefine((v, ctx) => {
    // Sin mocks, la autenticación real necesita el User Pool de Cognito.
    if (!v.VITE_USE_MOCKS && (!v.VITE_COGNITO_USER_POOL_ID || !v.VITE_COGNITO_CLIENT_ID)) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Faltan VITE_COGNITO_USER_POOL_ID y VITE_COGNITO_CLIENT_ID (o activa VITE_USE_MOCKS=true).',
      })
    }
  })

function leerEnv() {
  const resultado = esquema.safeParse(import.meta.env)
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((i) => `· ${i.message}`).join('\n')
    throw new Error(`Configuración inválida en las variables de entorno:\n${detalle}`)
  }
  const v = resultado.data
  return {
    apiUrl: v.VITE_API_URL,
    /** true: la API y Cognito se simulan (MSW + adaptador de auth en memoria). */
    usarMocks: v.VITE_USE_MOCKS,
    cognito: { userPoolId: v.VITE_COGNITO_USER_POOL_ID, clientId: v.VITE_COGNITO_CLIENT_ID },
  }
}

export const env = leerEnv()
