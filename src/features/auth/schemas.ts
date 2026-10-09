// Esquemas Zod de los formularios del feature "auth" (mensajes de error en español).
import { z } from 'zod'

export const loginSchema = z.object({
  correo: z
    .string()
    .trim()
    .min(1, 'Ingresa tu correo electrónico')
    .pipe(z.email('Escribe un correo válido, con formato nombre@dominio')),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

export type LoginValues = z.infer<typeof loginSchema>
