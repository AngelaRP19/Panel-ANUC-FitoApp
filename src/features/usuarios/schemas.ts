// Esquemas Zod de los formularios del feature "usuarios" (mensajes de error en español).
import { z } from 'zod'
import { MENSAJES } from '@/locales/es'
import { esCelularValido } from '@/utils/telefono'

/** Registrar / editar cuenta (artboard 10). */
export const cuentaSchema = z.object({
  nombre: z.string().trim().min(1, 'Escribe el nombre completo.'),
  correo: z
    .string()
    .trim()
    .min(1, 'Escribe el correo electrónico.')
    .pipe(z.email(MENSAJES.correoInvalido)),
  celular: z
    .string()
    .trim()
    .min(1, 'Escribe el número de celular.')
    .refine(esCelularValido, MENSAJES.celularInvalido),
  rol: z.enum(['TECNICO', 'LIDER_TECNICO'], { message: 'Selecciona el rol.' }),
})

export type CuentaValues = z.infer<typeof cuentaSchema>
