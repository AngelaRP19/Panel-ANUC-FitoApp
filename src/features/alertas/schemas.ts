// Esquemas Zod de los formularios del feature "alertas" (mensajes de error en español).
import { z } from 'zod'
import { parsearDecimal } from '@/utils/numeros'

export const descarteSchema = z.object({
  justificacion: z
    .string()
    .trim()
    .min(1, 'Escribe el motivo del descarte.')
    .max(300, 'Máximo 300 caracteres.'),
})
export type DescarteValues = z.infer<typeof descarteSchema>

const entero = (min: number, max: number, mensaje: string) =>
  z
    .string()
    .trim()
    .min(1, 'Este campo es obligatorio.')
    .refine((t) => /^\d+$/.test(t) && Number(t) >= min && Number(t) <= max, mensaje)

/** Parámetros de una categoría: los campos llegan como texto (la distancia admite coma). */
export const parametrosSchema = z.object({
  num_casos: entero(2, 99, 'Escribe un número entero de 2 o más.'),
  distancia_km: z
    .string()
    .trim()
    .min(1, 'Este campo es obligatorio.')
    .refine((t) => {
      const n = parsearDecimal(t)
      return n !== null && n > 0 && n <= 50
    }, 'Escribe una distancia mayor que 0 y de máximo 50 km, por ejemplo 3,5.'),
  intervalo_dias: entero(1, 365, 'Escribe un número de días entre 1 y 365.'),
})
export type ParametrosValues = z.infer<typeof parametrosSchema>
