import type { BadgeTone } from '@/components/ui/Badge'
import type { EstadoAlerta } from '@/types/enums'

/** Tono de la insignia de cada estado de alerta (identidad visual). */
export const ESTADO_ALERTA_TONO: Record<EstadoAlerta, BadgeTone> = {
  GENERADA: 'warning',
  EN_REVISION: 'review',
  DESCARTADA: 'inactive',
  CONFIRMADA: 'danger',
  COMUNICADA: 'success',
  CORREGIDA: 'info',
}
