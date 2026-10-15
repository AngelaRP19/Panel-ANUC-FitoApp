import { fechaCalendario, formatearFechaCorta, formatearHora } from '@/utils/fechas'

const DIA = 86_400_000

/** Hora del aviso como en el diseño: «07:52» (hoy), «ayer» o «26 sep». */
export function horaNotificacion(iso: string, ahora: Date = new Date()) {
  const dia = fechaCalendario(iso)
  if (dia === fechaCalendario(ahora.toISOString())) return formatearHora(iso)
  if (dia === fechaCalendario(new Date(ahora.getTime() - DIA).toISOString())) return 'ayer'
  return formatearFechaCorta(iso)
}
