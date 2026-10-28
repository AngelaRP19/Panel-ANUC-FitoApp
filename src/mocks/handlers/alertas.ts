import { http, HttpResponse } from 'msw'
import type { Vereda } from '@/types/enums'
import { type AlertaFixture, alertas, CASOS_HISTORICOS, parametros } from '../fixtures/alertas'
import { casos } from '../fixtures/casos'
import { diagnosticoDe } from '../fixtures/detalle'
import { fincas } from '../fixtures/fincas'
import { productores } from '../fixtures/productores'
import { usuarios } from '../fixtures/usuarios'
import { API, errorApi, noAutenticado, usuarioActual } from './comun'

const ESTADOS = [
  'GENERADA',
  'EN_REVISION',
  'CONFIRMADA',
  'COMUNICADA',
  'DESCARTADA',
  'CORREGIDA',
] as const

/** Mismo texto y reglas del guardrail del backend (`app/core/guardrail.py`), resumidas. */
const MENSAJE_BLOQUEADO = 'El mensaje no puede recomendar productos, dosis ni tratamientos.'
const RECETA =
  /\b(dosis|dosific\w*|dilu\w+|mezcl\w+|aplic\w+|fumig\w+|asperj\w+|roci\w+|insecticidas?|fungicidas?|pesticidas?|plaguicidas?|agroquimic\w+|veneno\w*|fertiliz\w+|abono\w*|tratamientos?|tratar\w*|productos?|remedios?|curar|cura)\b/
const recetaTratamiento = (t: string) =>
  RECETA.test(t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())

/** Estados en los que el líder todavía decide (confirmar o descartar). */
const ABIERTAS = ['GENERADA', 'EN_REVISION']

/** «2026-09-28 06:00» en Bogotá (UTC-5) → ISO en UTC. */
const bogota = (f: string) => new Date(`${f.replace(' ', 'T')}:00-05:00`).toISOString()

function resumen(a: AlertaFixture) {
  return {
    id: a.id,
    estado: a.estado,
    categoria: a.categoria,
    vereda: a.vereda,
    generada_en: a.generada_en,
    num_casos: a.casos.length,
    radio_km: a.radio_km,
    parametros: a.parametros,
    revisa: a.revisa,
    confirmada_por: a.confirmada_por,
    productores_notificados: a.productores_notificados,
    motivo_descarte: a.descarte?.motivo ?? null,
  }
}

/** Fila de un caso de la alerta. `enlazable`: quien consulta puede abrir el caso. */
function casoDeAlerta(codigo: string, usuarioId: string, esLider: boolean) {
  const c = casos.find((x) => x.codigo === codigo)
  if (c) {
    const finca = fincas.find((f) => f.id === c.finca.id)
    const diag = diagnosticoDe(c)
    return {
      id: c.id,
      codigo: c.codigo,
      productor_nombre: c.productor.nombre,
      finca_nombre: c.finca.nombre,
      resultado_tecnico: diag?.resultado_tecnico ?? 'CONFIRMADO',
      enviado_en: c.enviado_a_panel_en,
      latitud: finca?.latitud ?? null,
      longitud: finca?.longitud ?? null,
      enlazable: esLider || c.tecnico?.id === usuarioId,
    }
  }
  const h = CASOS_HISTORICOS[codigo]!
  const finca = fincas.find((f) => f.nombre === h.finca)
  return {
    id: codigo,
    codigo,
    productor_nombre: h.productor,
    finca_nombre: h.finca,
    resultado_tecnico: 'CONFIRMADO',
    enviado_en: bogota(h.enviado),
    latitud: finca?.latitud ?? null,
    longitud: finca?.longitud ?? null,
    enlazable: false,
  }
}

function detalle(a: AlertaFixture, usuarioId: string, esLider: boolean) {
  return {
    ...resumen(a),
    casos: a.casos.map((c) => casoDeAlerta(c, usuarioId, esLider)),
    sin_diagnostico: a.sin_diagnostico,
    confirmada_en: a.confirmada_en,
    comunicada_en: a.comunicada_en,
    descarte: a.descarte,
    correccion: a.correccion,
    borrador: a.borrador,
    siguiendo: a.seguidores.includes(usuarioId),
  }
}

function buscar(request: Request, id: string | readonly string[] | undefined) {
  const u = usuarioActual(request)
  if (!u) return { error: noAutenticado() }
  const a = alertas.find((x) => x.id === id)
  if (!a) return { error: errorApi(404, 'NO_ENCONTRADO', 'La alerta no existe.') }
  return { u, a }
}

const VEREDAS: Vereda[] = ['JURACAMBITA', 'CENTRO', 'SAN_LUIS']
const veredasValidas = (v: string[] = []) =>
  v.filter((x): x is Vereda => (VEREDAS as string[]).includes(x))

/** Productores de una vereda (por cualquiera de sus fincas). */
const productoresDe = (vereda: string) =>
  productores.filter((p) => p.fincas.some((f) => f.vereda === vereda))

/** Solo el líder y con la alerta confirmada (aún sin comunicar). */
function soloLiderConfirmada(u: { rol: string }, a: AlertaFixture) {
  if (u.rol !== 'LIDER_TECNICO') {
    return errorApi(403, 'SOLO_LIDER', 'Solo el líder técnico comunica alertas.')
  }
  if (a.estado !== 'CONFIRMADA') {
    return errorApi(409, 'ESTADO_INVALIDO', 'Solo se comunica una alerta confirmada.')
  }
  return null
}

interface CuerpoMensaje {
  mensaje?: string
  veredas?: string[]
}

function soloLiderAbierta(u: { rol: string }, a: AlertaFixture) {
  if (u.rol !== 'LIDER_TECNICO') {
    return errorApi(403, 'SOLO_LIDER', 'Solo el líder técnico puede confirmar o descartar alertas.')
  }
  if (!ABIERTAS.includes(a.estado)) {
    return errorApi(409, 'ESTADO_INVALIDO', 'La alerta ya no está pendiente de decisión.')
  }
  return null
}

export const alertasHandlers = [
  // Parámetros epidemiológicos (RQF25). Van antes de /alertas/:id para no confundirse con un id.
  http.get(`${API}/alertas/parametros`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    return HttpResponse.json(parametros)
  }),

  http.put(`${API}/alertas/parametros/:categoria`, async ({ request, params }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    if (u.rol !== 'LIDER_TECNICO') {
      return errorApi(403, 'SOLO_LIDER', 'Solo el líder técnico puede cambiar los parámetros.')
    }
    const p = parametros.find((x) => x.categoria === params.categoria)
    if (!p) return errorApi(404, 'NO_ENCONTRADO', 'La categoría no existe.')
    if (!p.habilitada) {
      return errorApi(409, 'NO_PARTICIPA', 'Esta categoría no participa en las alertas.')
    }
    const b = (await request.json()) as {
      num_casos?: number
      distancia_km?: number
      intervalo_dias?: number
    }
    const campos: Record<string, string> = {}
    if (!Number.isInteger(b.num_casos) || b.num_casos! < 2) {
      campos.num_casos = 'Escribe un número entero de 2 o más.'
    }
    if (typeof b.distancia_km !== 'number' || b.distancia_km <= 0 || b.distancia_km > 50) {
      campos.distancia_km = 'Escribe una distancia mayor que 0 y de máximo 50 km.'
    }
    if (!Number.isInteger(b.intervalo_dias) || b.intervalo_dias! < 1 || b.intervalo_dias! > 365) {
      campos.intervalo_dias = 'Escribe un número de días entre 1 y 365.'
    }
    if (Object.keys(campos).length) {
      return errorApi(422, 'VALIDACION', 'Revisa los campos marcados.', campos)
    }
    const lider = usuarios.find((x) => x.id === u.id)!
    Object.assign(p, {
      num_casos: b.num_casos,
      distancia_km: b.distancia_km,
      intervalo_dias: b.intervalo_dias,
      actualizado_por: { id: lider.id, nombre: lider.nombre },
      actualizado_en: new Date().toISOString(),
    })
    return HttpResponse.json(p)
  }),

  // Lista paginada con el número de alertas por estado (pestañas). Ambos roles.
  http.get(`${API}/alertas`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const p = new URL(request.url).searchParams
    const estado = p.get('estado')
    const ordenadas = [...alertas].sort((a, b) => b.generada_en.localeCompare(a.generada_en))
    const lista = estado ? ordenadas.filter((a) => a.estado === estado) : ordenadas
    const page = Math.max(1, Number(p.get('page') ?? 1))
    const size = Number(p.get('page_size') ?? 6)
    const conteos = Object.fromEntries(
      ESTADOS.map((e) => [e, alertas.filter((a) => a.estado === e).length]),
    )
    return HttpResponse.json({
      items: lista.slice((page - 1) * size, page * size).map(resumen),
      total: lista.length,
      page,
      page_size: size,
      conteos: { TODAS: alertas.length, ...conteos },
    })
  }),

  http.get(`${API}/alertas/:id`, ({ request, params }) => {
    const r = buscar(request, params.id)
    if (r.error) return r.error
    return HttpResponse.json(detalle(r.a, r.u.id, r.u.rol === 'LIDER_TECNICO'))
  }),

  // Confirmar (RQF26): solo el líder. Después redacta el mensaje (pantalla 12).
  http.post(`${API}/alertas/:id/confirmar`, ({ request, params }) => {
    const r = buscar(request, params.id)
    if (r.error) return r.error
    const bloqueo = soloLiderAbierta(r.u, r.a)
    if (bloqueo) return bloqueo
    const lider = usuarios.find((x) => x.id === r.u.id)!
    r.a.estado = 'CONFIRMADA'
    r.a.confirmada_por = { id: lider.id, nombre: lider.nombre }
    r.a.confirmada_en = new Date().toISOString()
    return HttpResponse.json(detalle(r.a, r.u.id, true))
  }),

  // Descartar con motivo obligatorio: queda en el historial y no se envía mensaje.
  http.post(`${API}/alertas/:id/descartar`, async ({ request, params }) => {
    const r = buscar(request, params.id)
    if (r.error) return r.error
    const bloqueo = soloLiderAbierta(r.u, r.a)
    if (bloqueo) return bloqueo
    const { justificacion } = (await request.json()) as { justificacion?: string }
    if (!justificacion?.trim()) {
      return errorApi(422, 'VALIDACION', 'Revisa los campos marcados.', {
        justificacion: 'Escribe el motivo del descarte.',
      })
    }
    const lider = usuarios.find((x) => x.id === r.u.id)!
    r.a.estado = 'DESCARTADA'
    r.a.descarte = {
      motivo: justificacion.trim(),
      por: { id: lider.id, nombre: lider.nombre },
      en: new Date().toISOString(),
    }
    return HttpResponse.json(detalle(r.a, r.u.id, true))
  }),

  // Destinatarios por vereda (pantalla 12): productores activos y deshabilitados de cada una.
  // Los deshabilitados no reciben mensajes.
  http.get(`${API}/alertas/:id/destinatarios`, ({ request, params }) => {
    const r = buscar(request, params.id)
    if (r.error) return r.error
    if (r.u.rol !== 'LIDER_TECNICO') {
      return errorApi(403, 'SOLO_LIDER', 'Esta sección es solo para el líder técnico.')
    }
    const veredas = [...VEREDAS]
      // La vereda de la alerta va primero.
      .sort((a, b) => Number(b === r.a.vereda) - Number(a === r.a.vereda))
      .map((v) => {
        const lista = productoresDe(v)
        return {
          vereda: v,
          zona_alerta: v === r.a.vereda,
          deshabilitados: lista.filter((p) => !p.activo).length,
          productores: lista
            .filter((p) => p.activo)
            .map((p) => ({ id: p.id, nombre: p.nombre, celular: p.celular })),
        }
      })
    return HttpResponse.json(veredas)
  }),

  http.put(`${API}/alertas/:id/borrador`, async ({ request, params }) => {
    const r = buscar(request, params.id)
    if (r.error) return r.error
    const bloqueo = soloLiderConfirmada(r.u, r.a)
    if (bloqueo) return bloqueo
    const b = (await request.json()) as CuerpoMensaje
    r.a.borrador = {
      mensaje: (b.mensaje ?? '').slice(0, 300),
      veredas: veredasValidas(b.veredas),
      guardado_en: new Date().toISOString(),
    }
    return HttpResponse.json(detalle(r.a, r.u.id, true))
  }),

  // Comunicar (RQF26, RQF45): envía el mensaje por WhatsApp a los productores activos de las
  // veredas elegidas y la alerta pasa a Comunicada.
  http.post(`${API}/alertas/:id/comunicar`, async ({ request, params }) => {
    const r = buscar(request, params.id)
    if (r.error) return r.error
    const bloqueo = soloLiderConfirmada(r.u, r.a)
    if (bloqueo) return bloqueo
    const b = (await request.json()) as CuerpoMensaje
    const campos: Record<string, string> = {}
    const mensaje = b.mensaje?.trim() ?? ''
    if (!mensaje) campos.mensaje = 'Escribe la recomendación para los productores.'
    else if (mensaje.length > 300) campos.mensaje = 'Máximo 300 caracteres.'
    const veredas = veredasValidas(b.veredas)
    const total = veredas.reduce((s, v) => s + productoresDe(v).filter((p) => p.activo).length, 0)
    if (!total) campos.veredas = 'Elige al menos una vereda con productores activos.'
    if (Object.keys(campos).length) {
      return errorApi(422, 'VALIDACION', 'Revisa los campos marcados.', campos)
    }
    r.a.estado = 'COMUNICADA'
    r.a.productores_notificados = total
    r.a.comunicada_en = new Date().toISOString()
    r.a.borrador = null
    return HttpResponse.json(detalle(r.a, r.u.id, true))
  }),

  // Corregir una alerta comunicada por error (D-17): solo el líder, una sola vez, a los mismos
  // productores que la recibieron. Plantilla fija + explicación; la alerta pasa a Corregida.
  http.post(`${API}/alertas/:id/corregir`, async ({ request, params }) => {
    const r = buscar(request, params.id)
    if (r.error) return r.error
    if (r.u.rol !== 'LIDER_TECNICO') {
      return errorApi(403, 'SOLO_LIDER', 'Solo el líder técnico corrige alertas.')
    }
    if (r.a.estado === 'CORREGIDA') {
      return errorApi(409, 'TRANSICION_INVALIDA', 'La alerta ya fue corregida.')
    }
    if (r.a.estado !== 'COMUNICADA') {
      return errorApi(409, 'TRANSICION_INVALIDA', 'Solo se corrige una alerta que ya se comunicó.')
    }
    if (!r.a.productores_notificados) {
      return errorApi(
        409,
        'TRANSICION_INVALIDA',
        'Nadie recibió la alerta, no hay a quién enviar la corrección.',
      )
    }
    const b = (await request.json()) as { mensaje?: string }
    const mensaje = b.mensaje?.trim() ?? ''
    let error = ''
    if (!mensaje) error = 'Escribe la explicación de la corrección.'
    else if (mensaje.length > 300) error = 'Máximo 300 caracteres.'
    else if (recetaTratamiento(mensaje)) error = MENSAJE_BLOQUEADO
    if (error) return errorApi(422, 'VALIDACION', 'Revisa los campos marcados.', { mensaje: error })
    const lider = usuarios.find((x) => x.id === r.u.id)!
    r.a.estado = 'CORREGIDA'
    r.a.correccion = {
      mensaje,
      por: { id: lider.id, nombre: lider.nombre },
      en: new Date().toISOString(),
    }
    return HttpResponse.json(detalle(r.a, r.u.id, true))
  }),

  // «Avisarme cuando cambie» (técnico): seguir / dejar de seguir la alerta.
  http.post(`${API}/alertas/:id/seguir`, ({ request, params }) => {
    const r = buscar(request, params.id)
    if (r.error) return r.error
    if (!r.a.seguidores.includes(r.u.id)) r.a.seguidores.push(r.u.id)
    return HttpResponse.json(detalle(r.a, r.u.id, r.u.rol === 'LIDER_TECNICO'))
  }),
  http.delete(`${API}/alertas/:id/seguir`, ({ request, params }) => {
    const r = buscar(request, params.id)
    if (r.error) return r.error
    r.a.seguidores = r.a.seguidores.filter((x) => x !== r.u.id)
    return HttpResponse.json(detalle(r.a, r.u.id, r.u.rol === 'LIDER_TECNICO'))
  }),
]
