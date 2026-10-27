// Esquemas Zod de los formularios del feature "casos" (mensajes de error en español).
import { z } from 'zod'

/** Registrar diagnóstico técnico (pantalla 7): campos condicionales según el resultado. */
export const diagnosticoSchema = z
  .object({
    resultado: z.string(),
    categoria: z.string(),
    motivo: z.string(),
    descripcion: z.string(),
    observaciones: z.string(),
  })
  .superRefine((v, ctx) => {
    if (!v.resultado) {
      ctx.addIssue({
        code: 'custom',
        path: ['resultado'],
        message: 'Selecciona un resultado técnico.',
      })
    }
    if (v.resultado === 'OTRA_PATOLOGIA' && !v.categoria) {
      ctx.addIssue({
        code: 'custom',
        path: ['categoria'],
        message: 'Selecciona la categoría fitosanitaria que determinaste.',
      })
    }
    if (v.resultado === 'REQUIERE_VISITA' && !v.motivo.trim()) {
      ctx.addIssue({ code: 'custom', path: ['motivo'], message: 'Escribe el motivo de la visita.' })
    }
  })

export type DiagnosticoValues = z.infer<typeof diagnosticoSchema>
