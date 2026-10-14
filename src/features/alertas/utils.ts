// Textos derivados de una alerta (diseño 06). Fuera de los componentes por react-refresh.
import { CATEGORIA_LABEL, VEREDA_LABEL } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import { formatearDecimal } from '@/utils/numeros'
import type { AlertaResumen } from './types'

const km = (n: number) => `${formatearDecimal(n, 1)} km`

/** «Posible concentración de Trips» / «Alerta fitosanitaria confirmada · Trips». */
export function tituloAlerta(a: AlertaResumen) {
  const cat = CATEGORIA_LABEL[a.categoria]
  if (a.estado === 'CONFIRMADA') return `Alerta fitosanitaria confirmada · ${cat}`
  if (a.estado === 'COMUNICADA') return `Alerta fitosanitaria comunicada · ${cat}`
  return `Posible concentración de ${cat}`
}

/** Encabezado del detalle: «Posible concentración de Trips en Juracambita». */
export function tituloDetalle(a: AlertaResumen) {
  const cat = CATEGORIA_LABEL[a.categoria]
  const vereda = VEREDA_LABEL[a.vereda]
  if (a.estado === 'CONFIRMADA') return `Alerta fitosanitaria confirmada: ${cat} en ${vereda}`
  if (a.estado === 'COMUNICADA') return `Alerta fitosanitaria comunicada: ${cat} en ${vereda}`
  return `Posible concentración de ${cat} en ${vereda}`
}

/** «Juracambita · 4 casos en 3,5 km · últimos 30 días» (cambia según el estado). */
export function subtituloAlerta(a: AlertaResumen) {
  const vereda = VEREDA_LABEL[a.vereda]
  const casos = `${a.num_casos} casos en ${km(a.radio_km)}`
  switch (a.estado) {
    case 'EN_REVISION':
      return `${vereda} · ${casos}${a.revisa ? ` · revisa ${a.revisa.nombre}` : ''}`
    case 'CONFIRMADA':
      return `${vereda} · ${a.confirmada_por ? `confirmada por ${a.confirmada_por.nombre} · ` : ''}falta comunicar`
    case 'COMUNICADA':
      return `${vereda} · mensaje enviado a ${a.productores_notificados ?? 0} productores`
    case 'DESCARTADA': {
      const m = a.motivo_descarte
      return m ? `${vereda} · ${m.charAt(0).toLowerCase()}${m.slice(1)}` : `${vereda} · descartada`
    }
    default:
      return `${vereda} · ${casos} · últimos ${a.parametros.intervalo_dias} días`
  }
}

/** Complemento de «Detectada el …»: «sin revisar», «revisa …», «confirmada por …». */
export function situacionAlerta(a: AlertaResumen) {
  switch (a.estado) {
    case 'EN_REVISION':
      return a.revisa ? `revisa ${a.revisa.nombre}` : 'en revisión'
    case 'CONFIRMADA':
      return a.confirmada_por ? `confirmada por ${a.confirmada_por.nombre}` : 'confirmada'
    case 'COMUNICADA':
      return `comunicada a ${a.productores_notificados ?? 0} productores`
    case 'DESCARTADA':
      return 'descartada'
    default:
      return 'sin revisar'
  }
}

/** «Trips · mínimo 3 casos · 3,5 km · 30 días» */
export function textoParametros(a: AlertaResumen) {
  const p = a.parametros
  return `${CATEGORIA_LABEL[a.categoria]} · mínimo ${p.num_casos} casos · ${km(p.distancia_km)} · ${p.intervalo_dias} días`
}

/** «Los Naranjos, Buenavista y La Cabaña» (sin repetir). */
export function unirNombres(nombres: string[]) {
  const unicos = [...new Set(nombres)]
  if (unicos.length <= 1) return unicos.join('')
  return `${unicos.slice(0, -1).join(', ')} y ${unicos.at(-1)}`
}

export { km as formatearKm }

/** La alerta pedida no existe (404): no tiene sentido reintentar. */
export function esAlertaNoEncontrada(error: unknown) {
  return esErrorApi(error) && error.status === 404
}
