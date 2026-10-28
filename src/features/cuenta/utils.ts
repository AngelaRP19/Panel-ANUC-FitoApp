import type { DatosMiCuenta } from './types'

/** Texto del toast según lo que cambió: «Tu celular quedó guardado.» */
export function textoDatosGuardados(antes: DatosMiCuenta, despues: DatosMiCuenta) {
  const cambios = (['nombre', 'correo', 'celular'] as const).filter((k) => antes[k] !== despues[k])
  if (cambios.length === 1 && cambios[0] === 'correo') {
    return 'Usa tu nuevo correo la próxima vez que inicies sesión.'
  }
  if (cambios.length === 1) return `Tu ${cambios[0]} quedó guardado.`
  if (cambios.includes('correo')) {
    return 'Tus datos quedaron guardados. Usa tu nuevo correo la próxima vez que inicies sesión.'
  }
  return 'Tus datos quedaron guardados.'
}
