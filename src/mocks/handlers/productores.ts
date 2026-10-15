import { http, HttpResponse } from 'msw'
import { casos } from '../fixtures/casos'
import { productores, type ProductorFixture } from '../fixtures/productores'
import { API, errorApi, noAutenticado, usuarioActual } from './comun'

const DIA = 86_400_000
const ACTIVOS = ['PENDIENTE_REVISION', 'EN_REVISION', 'REGISTRADO']

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const diaBogota = (iso: string) =>
  new Date(new Date(iso).getTime() - 5 * 3_600_000).toISOString().slice(0, 10)

/** Productor como lo devuelve la API (con los conteos de casos). */
function aProductor(p: ProductorFixture) {
  const suyos = casos.filter((c) => c.productor.id === p.id)
  const haceUnAnio = Date.now() - 365 * DIA
  return {
    ...p,
    vereda: p.fincas[0]?.vereda ?? null,
    casos_ultimo_anio: suyos.filter(
      (c) => !c.enviado_a_panel_en || new Date(c.enviado_a_panel_en).getTime() >= haceUnAnio,
    ).length,
    casos_activos: suyos.filter((c) => ACTIVOS.includes(c.estado)).length,
  }
}

function filtrar(p: URLSearchParams) {
  const q = normalizar(p.get('q') ?? '').trim()
  const qDigitos = q.replace(/\D/g, '')
  const finca = normalizar(p.get('finca') ?? '').trim()
  const ahora = Date.now()
  return productores.map(aProductor).filter((x) => {
    if (q) {
      const porNombre = normalizar(x.nombre).includes(q)
      const porCelular = qDigitos.length >= 3 && x.celular.replace(/\D/g, '').includes(qDigitos)
      if (!porNombre && !porCelular) return false
    }
    const estado = p.get('estado')
    if (estado === 'activo' && !x.activo) return false
    if (estado === 'deshabilitado' && x.activo) return false
    if (p.get('vereda') && !x.fincas.some((f) => f.vereda === p.get('vereda'))) return false
    if (p.get('especie') && !x.fincas.some((f) => f.especies.includes(p.get('especie') as never))) {
      return false
    }
    if (p.get('con_casos') === 'con' && x.casos_activos === 0) return false
    if (p.get('con_casos') === 'sin' && x.casos_activos > 0) return false
    if (finca && !x.fincas.some((f) => normalizar(f.nombre).includes(finca))) return false
    const desde = p.get('desde')
    const hasta = p.get('hasta')
    if (desde && diaBogota(x.registrado_en) < desde) return false
    if (hasta && diaBogota(x.registrado_en) > hasta) return false
    const consulta = p.get('consulta')
    const dias = x.ultima_consulta_en
      ? (ahora - new Date(x.ultima_consulta_en).getTime()) / DIA
      : Infinity
    if (consulta === '30' && dias > 30) return false
    if (consulta === '90' && dias <= 90) return false
    return true
  })
}

/** Valida nombre y celular; el celular no puede repetirse entre productores. */
function validar(b: { nombre?: string; celular?: string }, excluirId?: string) {
  const campos: Record<string, string> = {}
  if (!b.nombre?.trim()) campos.nombre = 'Escribe el nombre completo del productor.'
  if (!b.celular || !/^\+573\d{9}$/.test(b.celular)) {
    campos.celular = 'Escribe un celular de 10 dígitos que empiece por 3'
  } else if (productores.some((p) => p.celular === b.celular && p.id !== excluirId)) {
    campos.celular = 'Este número de celular ya está registrado'
  }
  return campos
}

function soloLider(request: Request) {
  const u = usuarioActual(request)
  if (!u) return noAutenticado()
  if (u.rol !== 'LIDER_TECNICO') {
    return errorApi(403, 'SOLO_LIDER', 'Esta sección es solo para el líder técnico.')
  }
  return null
}

export const productoresHandlers = [
  http.get(`${API}/productores`, ({ request }) => {
    const r = soloLider(request)
    if (r) return r
    const p = new URL(request.url).searchParams
    const lista = filtrar(p).sort((a, b) => a.nombre.localeCompare(b.nombre))
    const page = Math.max(1, Number(p.get('page') ?? 1))
    const size = Number(p.get('page_size') ?? 10)
    return HttpResponse.json({
      items: lista.slice((page - 1) * size, page * size),
      total: lista.length,
      page,
      page_size: size,
    })
  }),

  http.get(`${API}/productores/resumen`, ({ request }) => {
    const r = soloLider(request)
    if (r) return r
    return HttpResponse.json({
      total: productores.length,
      activos: productores.filter((p) => p.activo).length,
    })
  }),

  // Exportar CSV (pantalla 21): la selección (`ids`) o la lista con los filtros aplicados.
  // Va antes de /productores/:id para no confundirse con un id.
  http.get(`${API}/productores/exportar`, ({ request }) => {
    const r = soloLider(request)
    if (r) return r
    const p = new URL(request.url).searchParams
    const ids = p.get('ids')?.split(',').filter(Boolean)
    const lista = (
      ids ? productores.map(aProductor).filter((x) => ids.includes(x.id)) : filtrar(p)
    ).sort((a, b) => a.nombre.localeCompare(b.nombre))
    const celda = (t: string) => (/[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t)
    const filas = [
      ['Nombre', 'WhatsApp', 'Vereda', 'Fincas', 'Estado', 'Casos activos'],
      ...lista.map((x) => [
        x.nombre,
        x.celular,
        x.vereda ?? '',
        x.fincas.map((f) => f.nombre).join(' / '),
        x.activo ? 'Activo' : 'Deshabilitado',
        String(x.casos_activos),
      ]),
    ]
    // BOM para que Excel abra bien las tildes.
    const csv = '﻿' + filas.map((f) => f.map(celda).join(',')).join('\r\n')
    return new HttpResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } })
  }),

  // Activar o desactivar varios productores (pantalla 21). Queda en el registro de actividad.
  http.post(`${API}/productores/estado`, async ({ request }) => {
    const r = soloLider(request)
    if (r) return r
    const { ids, activo } = (await request.json()) as { ids?: string[]; activo?: boolean }
    if (!ids?.length || typeof activo !== 'boolean') {
      return errorApi(422, 'VALIDACION', 'Elige al menos un productor.')
    }
    const cambiados = productores.filter((p) => ids.includes(p.id) && p.activo !== activo)
    for (const p of cambiados) p.activo = activo
    return HttpResponse.json({ actualizados: cambiados.length, solicitados: ids.length })
  }),

  // Mensaje por WhatsApp a varios productores (pantalla 21). Solo a los activos.
  http.post(`${API}/productores/mensaje`, async ({ request }) => {
    const r = soloLider(request)
    if (r) return r
    const { ids, mensaje } = (await request.json()) as { ids?: string[]; mensaje?: string }
    const texto = mensaje?.trim() ?? ''
    if (!texto) {
      return errorApi(422, 'VALIDACION', 'Revisa los campos marcados.', {
        mensaje: 'Escribe el mensaje para los productores.',
      })
    }
    const elegidos = productores.filter((p) => ids?.includes(p.id))
    const activos = elegidos.filter((p) => p.activo)
    return HttpResponse.json({
      enviados: activos.length,
      omitidos: elegidos.length - activos.length,
    })
  }),

  http.get(`${API}/productores/:id`, ({ request, params }) => {
    const r = soloLider(request)
    if (r) return r
    const p = productores.find((x) => x.id === params.id)
    return p
      ? HttpResponse.json(aProductor(p))
      : errorApi(404, 'NO_ENCONTRADO', 'El productor no existe.')
  }),

  // Registrar productor (RQF07): nombre y WhatsApp; el chatbot lo reconoce por el número.
  http.post(`${API}/productores`, async ({ request }) => {
    const r = soloLider(request)
    if (r) return r
    const b = (await request.json()) as { nombre?: string; celular?: string; activo?: boolean }
    const campos = validar(b)
    if (Object.keys(campos).length)
      return errorApi(409, 'VALIDACION', 'Revisa los campos marcados.', campos)
    const nuevo: ProductorFixture = {
      id: `p-${Date.now()}`,
      nombre: b.nombre!.trim(),
      celular: b.celular!,
      activo: b.activo ?? true,
      registrado_en: new Date().toISOString(),
      ultima_consulta_en: null,
      fincas: [],
    }
    productores.push(nuevo)
    return HttpResponse.json(aProductor(nuevo), { status: 201 })
  }),

  // Editar productor (RQF08).
  http.patch(`${API}/productores/:id`, async ({ request, params }) => {
    const r = soloLider(request)
    if (r) return r
    const p = productores.find((x) => x.id === params.id)
    if (!p) return errorApi(404, 'NO_ENCONTRADO', 'El productor no existe.')
    const b = (await request.json()) as { nombre?: string; celular?: string; activo?: boolean }
    const campos = validar({ nombre: b.nombre ?? p.nombre, celular: b.celular ?? p.celular }, p.id)
    if (Object.keys(campos).length)
      return errorApi(409, 'VALIDACION', 'Revisa los campos marcados.', campos)
    p.nombre = b.nombre?.trim() ?? p.nombre
    p.celular = b.celular ?? p.celular
    if (b.activo !== undefined) p.activo = b.activo
    return HttpResponse.json(aProductor(p))
  }),

  // Activar o desactivar (RQF09): un productor deshabilitado no puede consultar por WhatsApp.
  http.patch(`${API}/productores/:id/estado`, async ({ request, params }) => {
    const r = soloLider(request)
    if (r) return r
    const p = productores.find((x) => x.id === params.id)
    if (!p) return errorApi(404, 'NO_ENCONTRADO', 'El productor no existe.')
    const { activo } = (await request.json()) as { activo: boolean }
    p.activo = activo
    return HttpResponse.json(aProductor(p))
  }),
]
