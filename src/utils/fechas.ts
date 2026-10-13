// Las fechas llegan en UTC (ISO 8601) y se muestran siempre en America/Bogota.
// Aspecto del diseño: «28 sep 2026 · 09:14». Las fechas de entrada son dd/mm/aaaa.
const ZONA = 'America/Bogota'
const MS_HORA = 3_600_000
const MS_DIA = 86_400_000

const fmtPartes = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const fmtFechaLarga = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const fmtMes = new Intl.DateTimeFormat('es-CO', { timeZone: ZONA, month: 'long' })

/** Partes de una fecha en Bogotá, con el mes abreviado a 3 letras sin punto («sep»). */
function partes(iso: string) {
  const p = fmtPartes.formatToParts(new Date(iso))
  const v = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)?.value ?? ''
  return {
    dia: v('day'),
    mes: v('month').replace('.', '').slice(0, 3),
    anio: v('year'),
    hora: `${v('hour')}:${v('minute')}`,
  }
}

/** «28 sep 2026» */
export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  const { dia, mes, anio } = partes(iso)
  return `${dia} ${mes} ${anio}`
}

/** «28 sep 2026 · 09:14» */
export function formatearFechaHora(iso: string | null | undefined): string {
  if (!iso) return '—'
  const { dia, mes, anio, hora } = partes(iso)
  return `${dia} ${mes} ${anio} · ${hora}`
}

/** «Lunes, 28 de septiembre de 2026» */
export function formatearFechaLarga(iso: string): string {
  const texto = fmtFechaLarga.format(new Date(iso))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** «28 sep» */
export function formatearFechaCorta(iso: string): string {
  const { dia, mes } = partes(iso)
  return `${dia} ${mes}`
}

/** «15:10» */
export function formatearHora(iso: string): string {
  return partes(iso).hora
}

/** «septiembre» */
export function nombreMes(iso: string): string {
  return fmtMes.format(new Date(iso))
}

/** Días completos transcurridos desde `iso` hasta `ahora`. */
export function diasDesde(iso: string, ahora: Date = new Date()): number {
  return Math.max(0, Math.floor((ahora.getTime() - new Date(iso).getTime()) / MS_DIA))
}

/** «1 día» / «8 días» */
export function textoDias(dias: number): string {
  return dias === 1 ? '1 día' : `${dias} días`
}

/** Tiempo de espera: «6 h en espera» (menos de un día) o «8 días». */
export function tiempoEspera(iso: string, ahora: Date = new Date()): string {
  const ms = Math.max(0, ahora.getTime() - new Date(iso).getTime())
  if (ms < MS_DIA) return `${Math.floor(ms / MS_HORA)} h en espera`
  return textoDias(Math.floor(ms / MS_DIA))
}

/** Días que faltan para `iso`: «faltan 175 días», «falta 1 día» o «vencido». */
export function textoFaltan(iso: string, ahora: Date = new Date()): string {
  const dias = Math.ceil((new Date(iso).getTime() - ahora.getTime()) / MS_DIA)
  if (dias <= 0) return 'vencido'
  return dias === 1 ? 'falta 1 día' : `faltan ${dias} días`
}

/**
 * Convierte una fecha de entrada «dd/mm/aaaa» a «aaaa-mm-dd» (fecha de calendario, sin hora).
 * Devuelve null si el texto no es una fecha válida.
 */
export function parsearFechaEntrada(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim())
  if (!m) return null
  const [, dd, mm, aaaa] = m
  const fecha = new Date(Date.UTC(Number(aaaa), Number(mm) - 1, Number(dd)))
  const valida =
    fecha.getUTCFullYear() === Number(aaaa) &&
    fecha.getUTCMonth() === Number(mm) - 1 &&
    fecha.getUTCDate() === Number(dd)
  return valida ? `${aaaa}-${mm}-${dd}` : null
}

/** «aaaa-mm-dd» → «dd/mm/aaaa» (para rellenar campos de fecha). */
export function formatearFechaEntrada(fecha: string | null | undefined): string {
  const m = fecha ? /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha) : null
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}
