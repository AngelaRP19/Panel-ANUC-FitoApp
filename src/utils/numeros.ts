// Coordenadas con punto decimal («5.2481, -73.1702») y parámetros decimales con coma («3,5»).

/** «5.2481, -73.1702» (4 decimales, punto decimal). */
export function formatearCoordenadas(
  lat: number | null | undefined,
  lng: number | null | undefined,
): string {
  if (lat == null || lng == null) return '—'
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

/** Rango de latitud esperado para las fincas de Zetaquirá (fuera de él, solo advertencia). */
export const LATITUD_ZETAQUIRA = { min: 5.2, max: 5.3 } as const

/** true si la latitud está en el rango habitual de Zetaquirá. No bloquea el guardado. */
export function latitudEnRango(lat: number): boolean {
  return lat >= LATITUD_ZETAQUIRA.min && lat <= LATITUD_ZETAQUIRA.max
}

/** 3.5 → «3,5». Sin ceros sobrantes. */
export function formatearDecimal(valor: number | null | undefined, maxDecimales = 2): string {
  if (valor == null || Number.isNaN(valor)) return '—'
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: maxDecimales,
    useGrouping: false,
  }).format(valor)
}

/** «3,5» o «3.5» → 3.5. Devuelve null si no es un número. */
export function parsearDecimal(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(limpio)) return null
  return Number(limpio)
}

/** «86 %» (porcentaje de coincidencia de síntomas, entero). */
export function formatearPorcentaje(valor: number | null | undefined): string {
  if (valor == null || Number.isNaN(valor)) return '—'
  return `${Math.round(valor)} %`
}
