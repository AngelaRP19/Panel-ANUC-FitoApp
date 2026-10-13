// Esquemas Zod de los formularios del feature "productores" (mensajes de error en español).
import { z } from 'zod'
import { MENSAJES } from '@/locales/es'
import { esCelularValido } from '@/utils/telefono'

/** Registrar / editar productor (artboard 08b): los mismos dos campos y el estado. */
export const productorSchema = z.object({
  nombre: z.string().trim().min(1, 'Escribe el nombre completo del productor.'),
  celular: z
    .string()
    .trim()
    .min(1, 'Escribe el número de WhatsApp.')
    .refine(esCelularValido, MENSAJES.celularInvalido),
  activo: z.boolean(),
})

export type ProductorValues = z.infer<typeof productorSchema>
