// Esquemas Zod de los formularios del feature "alertas" (mensajes de error en español).
import { z } from 'zod'

export const descarteSchema = z.object({
  justificacion: z
    .string()
    .trim()
    .min(1, 'Escribe el motivo del descarte.')
    .max(300, 'Máximo 300 caracteres.'),
})
export type DescarteValues = z.infer<typeof descarteSchema>
