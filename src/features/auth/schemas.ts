// Esquemas Zod de los formularios del feature "auth" (mensajes de error en español).
import { z } from 'zod'
import { MENSAJES } from '@/locales/es'

/** Política de contraseñas del diseño: al menos 8 caracteres, con letras y números (P-09). */
export const REQUISITOS_CONTRASENA = [
  { id: 'largo', texto: 'Mínimo 8 caracteres', cumple: (v: string) => v.length >= 8 },
  {
    id: 'mezcla',
    texto: 'Letras y números',
    cumple: (v: string) => /[A-Za-zÀ-ÿ]/.test(v) && /\d/.test(v),
  },
] as const

const correo = z
  .string()
  .trim()
  .min(1, 'Escribe tu correo electrónico')
  .pipe(z.email(MENSAJES.correoInvalido))

export const loginSchema = z.object({
  correo,
  password: z.string().min(1, 'Escribe tu contraseña'),
})
export type LoginValues = z.infer<typeof loginSchema>

const contrasenaNueva = z
  .string()
  .min(1, 'Escribe la nueva contraseña')
  .refine((v) => REQUISITOS_CONTRASENA.every((r) => r.cumple(v)), MENSAJES.contrasenaReglas)

/** Nueva contraseña + confirmación (contraseña temporal, recuperación, primer uso). */
export const nuevaContrasenaSchema = z
  .object({
    nueva: contrasenaNueva,
    confirmar: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((v) => v.nueva === v.confirmar, {
    path: ['confirmar'],
    message: MENSAJES.contrasenasNoCoinciden,
  })
export type NuevaContrasenaValues = z.infer<typeof nuevaContrasenaSchema>
