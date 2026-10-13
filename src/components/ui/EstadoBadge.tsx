import { ESTADO_ALERTA_LABEL, ESTADO_CASO_LABEL, ESTADO_CUENTA_LABEL, etiqueta } from '@/locales/es'
import type { EstadoAlerta, EstadoCaso } from '@/types/enums'
import { Badge, type BadgeTone } from './Badge'

// Color de cada estado según el diseño (guía, sección 9).
const TONO_CASO: Record<EstadoCaso, BadgeTone> = {
  CREADO: 'neutral',
  EN_ANALISIS: 'info',
  PENDIENTE_REVISION: 'warning',
  EN_REVISION: 'review',
  REGISTRADO: 'neutral',
  CERRADO: 'success',
  DESCARTADO: 'inactive',
}

const TONO_ALERTA: Record<EstadoAlerta, BadgeTone> = {
  GENERADA: 'warning',
  EN_REVISION: 'review',
  CONFIRMADA: 'danger',
  COMUNICADA: 'success',
  DESCARTADA: 'inactive',
}

/** Estado del caso. Un valor desconocido de la API se muestra en tono neutro. */
export function EstadoCasoBadge({ estado }: { estado: EstadoCaso | string }) {
  const tono = TONO_CASO[estado as EstadoCaso] ?? 'neutral'
  return <Badge tone={tono}>{etiqueta(ESTADO_CASO_LABEL, estado)}</Badge>
}

/** Estado de la alerta epidemiológica. */
export function EstadoAlertaBadge({ estado }: { estado: EstadoAlerta | string }) {
  const tono = TONO_ALERTA[estado as EstadoAlerta] ?? 'neutral'
  return <Badge tone={tono}>{etiqueta(ESTADO_ALERTA_LABEL, estado)}</Badge>
}

/** Estado de una cuenta o de un productor: Activo / Deshabilitado. */
export function EstadoCuentaBadge({ activo }: { activo: boolean }) {
  return (
    <Badge tone={activo ? 'success' : 'inactive'}>
      {activo ? ESTADO_CUENTA_LABEL.activo : ESTADO_CUENTA_LABEL.inactivo}
    </Badge>
  )
}
