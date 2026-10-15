import { urlGoogleMapsPunto } from '@/components/mapa/estilo'
import { ESPECIE_LABEL, etiqueta } from '@/locales/es'
import type { Especie } from '@/types/enums'

/** «Gulupa y granadilla» */
export function unirEspecies(especies: Especie[]) {
  const n = [...new Set(especies)].map((e) => etiqueta(ESPECIE_LABEL, e, e))
  const texto = n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n.at(-1)}` : (n[0] ?? '')
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

/** «1 caso» / «3 casos» */
export const textoCasos = (n: number) => (n === 1 ? '1 caso' : `${n} casos`)

/** Google Maps en la ubicación (el mapa de vigilancia del panel es solo del líder). */
export const urlUbicacion = (lat: number, lng: number) => urlGoogleMapsPunto({ lat, lng })
