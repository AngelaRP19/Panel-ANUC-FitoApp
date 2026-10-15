// Textos de los avisos de notificación (artboards 11 y 12f). La API dice qué avisos tiene
// cada rol; aquí solo viven sus nombres y descripciones.
import type { DatosMiCuenta } from './types'

export const AVISOS: Record<string, { titulo: string; descripcion: string }> = {
  CASOS_SIN_TECNICO: {
    titulo: 'Casos nuevos sin técnico',
    descripcion: 'Cuando el chatbot registra un caso que aún no tiene técnico asignado.',
  },
  CAMBIOS_ESTADO: {
    titulo: 'Cambios de estado en los casos',
    descripcion: 'Cuando un técnico guarda su diagnóstico técnico o cierra un caso.',
  },
  ALERTAS_GENERADAS: {
    titulo: 'Alertas epidemiológicas generadas',
    descripcion: 'Cuando el sistema detecta una posible concentración de casos.',
  },
  PROXIMOS_VENCER: {
    titulo: 'Casos próximos a vencer',
    descripcion: 'Cuando faltan 15 días para la fecha de vencimiento de conservación.',
  },
  RESUMEN_DIARIO: {
    titulo: 'Resumen diario',
    descripcion: 'Un correo a las 6:00 con los casos pendientes de revisión.',
  },
  CASOS_ASIGNADOS: {
    titulo: 'Casos nuevos asignados a mí',
    descripcion: 'Cuando el líder técnico te asigna un caso.',
  },
  CAMBIOS_ESTADO_MIOS: {
    titulo: 'Cambios de estado en mis casos',
    descripcion: 'Cuando un caso tuyo cambia de estado o se extiende su conservación.',
  },
  ALERTAS_CONSULTA: {
    titulo: 'Alertas epidemiológicas (solo consulta)',
    descripcion:
      'Te avisa cuando se genera, confirma o comunica una alerta. Puedes verla, pero no gestionarla.',
  },
  MIOS_PROXIMOS_VENCER: {
    titulo: 'Casos míos próximos a vencer',
    descripcion: 'Cuando faltan 15 días para la fecha de vencimiento de conservación.',
  },
  COMENTARIOS_LIDER: {
    titulo: 'Comentarios del líder técnico',
    descripcion: 'Cuando el líder deja una nota en uno de tus casos.',
  },
}

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
