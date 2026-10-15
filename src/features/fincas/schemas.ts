// Esquemas Zod de los formularios del feature "fincas" (mensajes de error en español).
import { z } from 'zod'

/** Grados decimales con punto: «5.2481», «-73.1702». */
const decimal = /^-?\d{1,3}(\.\d+)?$/

/** Registrar / editar finca (artboard 09b). */
export const fincaSchema = z
  .object({
    nombre: z.string().trim().min(1, 'Escribe el nombre de la finca.'),
    vereda: z.string().min(1, 'Selecciona la vereda.'),
    latitud: z
      .string()
      .trim()
      .min(1, 'Escribe la latitud.')
      .regex(decimal, 'Escribe la latitud en grados decimales con punto · ej. 5.2481'),
    longitud: z
      .string()
      .trim()
      .min(1, 'Escribe la longitud.')
      .regex(decimal, 'Escribe la longitud en grados decimales con punto · ej. -73.1702')
      .refine((v) => v.startsWith('-'), 'La longitud lleva signo menos · ej. -73.1702'),
    /** Solo al registrar ('' al editar). */
    productor: z.string(),
    esNueva: z.boolean(),
    cultivos: z.array(
      z.object({
        id: z.string(),
        nombre: z.string(),
        tipo: z.string(),
        especies: z.array(z.string()).min(1, 'Selecciona al menos una especie'),
      }),
    ),
  })
  .superRefine((v, ctx) => {
    if (v.esNueva && !v.productor) {
      ctx.addIssue({ code: 'custom', path: ['productor'], message: 'Selecciona el productor.' })
    }
  })

export type FincaValues = z.infer<typeof fincaSchema>
