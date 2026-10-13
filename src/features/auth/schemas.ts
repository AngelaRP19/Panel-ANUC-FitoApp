// Esquemas Zod de los formularios del feature "auth" (mensajes de error en español).
import { z } from 'zod'
import { MENSAJES } from '@/locales/es'
import { esCelularValido } from '@/utils/telefono'

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

/** Contraseña que debe cumplir la política. */
const contrasenaNueva = (mensajeVacio: string) =>
  z
    .string()
    .min(1, mensajeVacio)
    .refine((v) => REQUISITOS_CONTRASENA.every((r) => r.cumple(v)), MENSAJES.contrasenaReglas)

/** Nueva contraseña + confirmación (contraseña temporal, recuperación, primer uso). */
export const nuevaContrasenaSchema = z
  .object({
    nueva: contrasenaNueva('Escribe la nueva contraseña'),
    confirmar: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((v) => v.nueva === v.confirmar, {
    path: ['confirmar'],
    message: MENSAJES.contrasenasNoCoinciden,
  })
export type NuevaContrasenaValues = z.infer<typeof nuevaContrasenaSchema>

/** Registro del primer líder técnico (artboard 01b). */
export const primerLiderSchema = z
  .object({
    nombre: z.string().trim().min(1, 'Escribe tu nombre completo'),
    correo,
    celular: z
      .string()
      .trim()
      .min(1, 'Escribe tu número de celular')
      .refine(esCelularValido, MENSAJES.celularInvalido),
    nueva: contrasenaNueva('Escribe una contraseña'),
    confirmar: z.string().min(1, 'Confirma la contraseña'),
  })
  .refine((v) => v.nueva === v.confirmar, {
    path: ['confirmar'],
    message: MENSAJES.contrasenasNoCoinciden,
  })
export type PrimerLiderValues = z.infer<typeof primerLiderSchema>

/** Recuperar cuenta, paso 1: correo (artboard 01c). */
export const solicitarCodigoSchema = z.object({ correo })
export type SolicitarCodigoValues = z.infer<typeof solicitarCodigoSchema>

/** Recuperar cuenta, paso 2: código de 6 dígitos y nueva contraseña (artboard 01d). */
export const recuperacionSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .min(1, 'Escribe el código de verificación')
      .regex(/^\d{6}$/, 'El código tiene 6 dígitos'),
    nueva: contrasenaNueva('Escribe la nueva contraseña'),
    confirmar: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((v) => v.nueva === v.confirmar, {
    path: ['confirmar'],
    message: MENSAJES.contrasenasNoCoinciden,
  })
export type RecuperacionValues = z.infer<typeof recuperacionSchema>
