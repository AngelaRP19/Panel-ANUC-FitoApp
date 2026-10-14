// Esquemas Zod de los formularios del feature "cuenta" (mensajes de error en español).
import { z } from 'zod'
import { MENSAJES } from '@/locales/es'
import { esCelularValido } from '@/utils/telefono'

export const datosSchema = z.object({
  nombre: z.string().trim().min(1, 'Escribe tu nombre completo'),
  correo: z
    .string()
    .trim()
    .min(1, 'Escribe tu correo electrónico')
    .pipe(z.email(MENSAJES.correoInvalido)),
  celular: z
    .string()
    .trim()
    .min(1, 'Escribe tu celular')
    .refine(esCelularValido, MENSAJES.celularInvalido),
})
export type DatosValues = z.infer<typeof datosSchema>

/** Política de contraseñas: al menos 8 caracteres, con letras y números. */
const cumplePolitica = (v: string) => v.length >= 8 && /[A-Za-zÀ-ÿ]/.test(v) && /\d/.test(v)

export const contrasenaSchema = z
  .object({
    actual: z.string().min(1, 'Escribe tu contraseña actual'),
    nueva: z
      .string()
      .min(1, 'Escribe la nueva contraseña')
      .refine(cumplePolitica, MENSAJES.contrasenaReglas),
    confirmar: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((v) => v.nueva === v.confirmar, {
    path: ['confirmar'],
    message: MENSAJES.contrasenasNoCoinciden,
  })
  .refine((v) => !v.actual || v.nueva !== v.actual, {
    path: ['nueva'],
    message: 'La nueva contraseña debe ser distinta de la actual',
  })
export type ContrasenaValues = z.infer<typeof contrasenaSchema>
