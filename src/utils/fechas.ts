// Las fechas llegan en UTC (ISO 8601) y se muestran siempre en America/Bogota.
const ZONA = 'America/Bogota'

const fmtFecha = new Intl.DateTimeFormat('es-CO', { timeZone: ZONA, dateStyle: 'medium' })
const fmtFechaHora = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA,
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatearFecha(iso: string | null | undefined): string {
  return iso ? fmtFecha.format(new Date(iso)) : '—'
}

export function formatearFechaHora(iso: string | null | undefined): string {
  return iso ? fmtFechaHora.format(new Date(iso)) : '—'
}
