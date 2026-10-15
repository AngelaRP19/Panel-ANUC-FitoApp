// Utilidades del feature "fincas" (sin componentes).
import { ESPECIE_LABEL, etiqueta } from '@/locales/es'
import type { CultivoFinca } from './types'

/** «gulupa y granadilla» */
export function listaEspecies(especies: CultivoFinca['especies']) {
  const nombres = especies.map((e) => etiqueta(ESPECIE_LABEL, e, e).toLowerCase())
  return nombres.length > 1
    ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
    : (nombres[0] ?? '')
}
