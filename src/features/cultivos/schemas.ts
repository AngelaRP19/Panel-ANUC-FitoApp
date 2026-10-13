// Esquemas Zod de los formularios del feature "cultivos" (mensajes de error en español).
import { z } from 'zod'

/** Agregar cultivo: nombre, tipo (invernadero / campo abierto) y al menos una especie. */
export const cultivoSchema = z.object({
  nombre: z.string().trim().min(1, 'Escribe el nombre del cultivo.'),
  tipo: z.string().min(1, 'Selecciona el tipo de cultivo.'),
  especies: z.array(z.string()).min(1, 'Selecciona al menos una especie'),
})

export type CultivoValues = z.infer<typeof cultivoSchema>
