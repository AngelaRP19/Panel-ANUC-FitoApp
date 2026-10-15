// Notificaciones de la campana (artboards 02b y 12h · pantalla 18). Datos ficticios: solo mocks.
// Las horas son relativas a «ahora» para que siempre caigan dentro de los últimos 7 días.
import type { Rol } from '@/types/enums'

export type TipoNotificacion =
  | 'CASO_SIN_TECNICO'
  | 'ALERTA_GENERADA'
  | 'CASO_EN_REVISION'
  | 'PROXIMOS_A_VENCER'
  | 'CASO_ASIGNADO'
  | 'DIAGNOSTICO_REGISTRADO'
  | 'ALERTA_CONFIRMADA'

export interface NotificacionFixture {
  id: string
  tipo: TipoNotificacion
  titulo: string
  texto: string
  /** Ruta del panel a la que lleva el aviso. */
  enlace: string
  /** Horas transcurridas desde el aviso (se convierte en fecha al responder). */
  hace_horas: number
}

const LIDER: NotificacionFixture[] = [
  {
    id: 'n-l1',
    tipo: 'CASO_SIN_TECNICO',
    titulo: 'Caso nuevo sin técnico',
    texto: '#0240 · Pedro Nel Suárez · Trips 77 %',
    enlace: '/casos/0240',
    hace_horas: 2,
  },
  {
    id: 'n-l2',
    tipo: 'ALERTA_GENERADA',
    titulo: 'Alerta generada',
    texto: 'Posible concentración de Trips · Juracambita',
    enlace: '/alertas/ALR-012',
    hace_horas: 4,
  },
  {
    id: 'n-l3',
    tipo: 'CASO_EN_REVISION',
    titulo: 'Caso en revisión',
    texto: '#0237 · Rosa Elvira Moreno · asignado a Jhon Fredy Sanabria',
    enlace: '/casos/0237',
    hace_horas: 26,
  },
  {
    id: 'n-l4',
    tipo: 'PROXIMOS_A_VENCER',
    titulo: 'Casos próximos a vencer',
    texto: 'Fecha de vencimiento de conservación en menos de 15 días',
    enlace: '/casos?estado=CERRADO&vencimiento=15',
    hace_horas: 29,
  },
]

const TECNICO: NotificacionFixture[] = [
  {
    id: 'n-t1',
    tipo: 'CASO_ASIGNADO',
    titulo: 'Te asignaron un caso',
    texto: '#0241 · María Rojas Cárdenas · Botrytis 86 %',
    enlace: '/casos/0241',
    hace_horas: 1,
  },
  {
    id: 'n-t2',
    tipo: 'DIAGNOSTICO_REGISTRADO',
    titulo: 'Diagnóstico registrado',
    texto: '#0230 pasó a Registrado',
    enlace: '/casos/0230',
    hace_horas: 25,
  },
  {
    id: 'n-t3',
    tipo: 'ALERTA_CONFIRMADA',
    titulo: 'Alerta confirmada (consulta)',
    texto: 'Trips · Centro · confirmada por el líder técnico',
    enlace: '/alertas/ALR-010',
    hace_horas: 72,
  },
  {
    id: 'n-t4',
    tipo: 'PROXIMOS_A_VENCER',
    titulo: 'Casos próximos a vencer',
    texto: '#0216 · fecha de vencimiento de conservación en menos de 15 días',
    enlace: '/casos/0216',
    hace_horas: 96,
  },
]

/** Avisos del rol (los más recientes primero). */
export const notificacionesDe = (rol: Rol) => (rol === 'LIDER_TECNICO' ? LIDER : TECNICO)

/** Ids leídos por cuenta. Al iniciar, los dos primeros avisos de cada rol están sin leer. */
const leidas = new Map<string, Set<string>>()

function crearLeidas(rol: Rol) {
  return new Set(
    notificacionesDe(rol)
      .slice(2)
      .map((n) => n.id),
  )
}

export function leidasDe(usuarioId: string, rol: Rol) {
  if (!leidas.has(usuarioId)) leidas.set(usuarioId, crearLeidas(rol))
  return leidas.get(usuarioId)!
}

/** Restaura el estado de lectura del diseño (pruebas). */
export function reiniciarNotificaciones() {
  leidas.clear()
}
