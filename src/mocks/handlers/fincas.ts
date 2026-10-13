import { http, HttpResponse } from 'msw'
import type { Especie, TipoCultivo, Vereda } from '@/types/enums'
import { casos } from '../fixtures/casos'
import { fincas, type CultivoFixture, type FincaFixture } from '../fixtures/fincas'
import { productores } from '../fixtures/productores'
import { API, errorApi, noAutenticado, usuarioActual } from './comun'

const ACTIVOS = ['PENDIENTE_REVISION', 'EN_REVISION', 'REGISTRADO']
const VEREDAS: Record<string, string> = {
  JURACAMBITA: 'Juracambita',
  CENTRO: 'Centro',
  SAN_LUIS: 'San Luis',
}

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const slug = (t: string) => normalizar(t).replace(/[^a-z0-9]+/g, '-')

/** Casos activos de un cultivo (opcionalmente, solo los de una especie). */
function casosActivos(cultivoId: string, especie?: string) {
  return casos.filter(
    (c) =>
      c.cultivo.id === cultivoId &&
      ACTIVOS.includes(c.estado) &&
      (!especie || c.especie === especie),
  )
}

function aFinca(f: FincaFixture) {
  const p = productores.find((x) => x.id === f.productor_id)
  const cultivos = f.cultivos.map((c) => ({
    ...c,
    casos_activos: casosActivos(c.id).map((x) => x.id),
  }))
  return {
    ...f,
    productor: { id: f.productor_id, nombre: p?.nombre ?? '—', activo: p?.activo ?? false },
    cultivos,
    casos_activos: cultivos.reduce((n, c) => n + c.casos_activos.length, 0),
  }
}

function soloLider(request: Request) {
  const u = usuarioActual(request)
  if (!u) return noAutenticado()
  if (u.rol !== 'LIDER_TECNICO') {
    return errorApi(403, 'SOLO_LIDER', 'Esta sección es solo para el líder técnico.')
  }
  return null
}

interface CuerpoFinca {
  nombre?: string
  vereda?: Vereda
  latitud?: number
  longitud?: number
  productor_id?: string
  cultivos?: { id: string; tipo: TipoCultivo; especies: Especie[] }[]
  /** Guardar aunque se quite una especie usada por casos activos. */
  forzar?: boolean
}

function validarFinca(b: CuerpoFinca) {
  const campos: Record<string, string> = {}
  if (!b.nombre?.trim()) campos.nombre = 'Escribe el nombre de la finca.'
  if (!b.vereda) campos.vereda = 'Selecciona la vereda.'
  if (typeof b.latitud !== 'number' || Number.isNaN(b.latitud)) {
    campos.latitud = 'Escribe la latitud en grados decimales con punto.'
  }
  if (typeof b.longitud !== 'number' || !(b.longitud < 0)) {
    campos.longitud = 'Escribe la longitud en grados decimales con signo menos.'
  }
  return campos
}

export const fincasHandlers = [
  http.get(`${API}/fincas`, ({ request }) => {
    const r = soloLider(request)
    if (r) return r
    const p = new URL(request.url).searchParams
    const q = normalizar(p.get('q') ?? '').trim()
    let lista = fincas.map(aFinca).filter((f) => {
      if (q && !normalizar(`${f.nombre} ${f.productor.nombre}`).includes(q)) return false
      if (p.get('vereda') && f.vereda !== p.get('vereda')) return false
      if (
        p.get('especie') &&
        !f.cultivos.some((c) => c.especies.includes(p.get('especie') as Especie))
      ) {
        return false
      }
      if (p.get('tipo') && !f.cultivos.some((c) => c.tipo === p.get('tipo'))) return false
      if (p.get('casos') === 'con' && f.casos_activos === 0) return false
      if (p.get('casos') === 'sin' && f.casos_activos > 0) return false
      if (p.get('productor_id') && f.productor_id !== p.get('productor_id')) return false
      return true
    })
    // Agrupadas por vereda, como en el diseño, y por nombre dentro de cada una.
    const orden = ['JURACAMBITA', 'CENTRO', 'SAN_LUIS']
    lista = lista.sort(
      (a, b) =>
        orden.indexOf(a.vereda) - orden.indexOf(b.vereda) || a.nombre.localeCompare(b.nombre),
    )
    const page = Math.max(1, Number(p.get('page') ?? 1))
    const size = Number(p.get('page_size') ?? 10)
    return HttpResponse.json({
      items: lista.slice((page - 1) * size, page * size),
      total: lista.length,
      page,
      page_size: size,
    })
  }),

  http.get(`${API}/fincas/resumen`, ({ request }) => {
    const r = soloLider(request)
    if (r) return r
    const veredas = [...new Set(fincas.map((f) => f.vereda))]
    return HttpResponse.json({
      fincas: fincas.length,
      cultivos: fincas.reduce((n, f) => n + f.cultivos.length, 0),
      veredas: ['JURACAMBITA', 'CENTRO', 'SAN_LUIS']
        .filter((v) => veredas.includes(v as Vereda))
        .map((v) => VEREDAS[v]),
    })
  }),

  http.get(`${API}/fincas/:id`, ({ request, params }) => {
    const r = soloLider(request)
    if (r) return r
    const f = fincas.find((x) => x.id === params.id)
    return f ? HttpResponse.json(aFinca(f)) : errorApi(404, 'NO_ENCONTRADO', 'La finca no existe.')
  }),

  // Registrar finca (RQF14): solo para un productor activo.
  http.post(`${API}/fincas`, async ({ request }) => {
    const r = soloLider(request)
    if (r) return r
    const b = (await request.json()) as CuerpoFinca
    const campos = validarFinca(b)
    const p = productores.find((x) => x.id === b.productor_id)
    if (!p) campos.productor_id = 'Selecciona el productor.'
    else if (!p.activo) campos.productor_id = 'Solo se registran fincas de productores activos.'
    if (Object.keys(campos).length) {
      return errorApi(422, 'VALIDACION', 'Revisa los campos marcados.', campos)
    }
    const nueva: FincaFixture = {
      id: `f-${slug(b.nombre!)}-${Date.now()}`,
      nombre: b.nombre!.trim(),
      vereda: b.vereda!,
      latitud: b.latitud!,
      longitud: b.longitud!,
      productor_id: b.productor_id!,
      cultivos: [],
    }
    fincas.push(nueva)
    return HttpResponse.json(aFinca(nueva), { status: 201 })
  }),

  // Editar finca y las especies/tipo de sus cultivos (RQF15, RQF18). Quitar una especie que usa
  // un caso activo responde 409 con los casos afectados, salvo que llegue `forzar`.
  http.patch(`${API}/fincas/:id`, async ({ request, params }) => {
    const r = soloLider(request)
    if (r) return r
    const f = fincas.find((x) => x.id === params.id)
    if (!f) return errorApi(404, 'NO_ENCONTRADO', 'La finca no existe.')
    const b = (await request.json()) as CuerpoFinca
    const campos = validarFinca(b)
    for (const c of b.cultivos ?? []) {
      if (!c.especies?.length) campos[`cultivos.${c.id}`] = 'Selecciona al menos una especie'
    }
    if (Object.keys(campos).length) {
      return errorApi(422, 'VALIDACION', 'Revisa los campos marcados.', campos)
    }
    const afectados: { cultivo: string; especie: Especie; casos: string[] }[] = []
    for (const c of b.cultivos ?? []) {
      const actual = f.cultivos.find((x) => x.id === c.id)
      for (const e of actual?.especies ?? []) {
        if (c.especies.includes(e)) continue
        const enUso = casosActivos(c.id, e)
        if (enUso.length)
          afectados.push({ cultivo: actual!.nombre, especie: e, casos: enUso.map((x) => x.id) })
      }
    }
    if (afectados.length && !b.forzar) {
      return errorApi(
        409,
        'ESPECIE_EN_USO',
        'Hay especies en uso por casos activos.',
        {},
        afectados,
      )
    }
    f.nombre = b.nombre!.trim()
    f.vereda = b.vereda!
    f.latitud = b.latitud!
    f.longitud = b.longitud!
    for (const c of b.cultivos ?? []) {
      const actual = f.cultivos.find((x) => x.id === c.id)
      if (actual) {
        actual.tipo = c.tipo
        actual.especies = [...c.especies]
      }
    }
    return HttpResponse.json(aFinca(f))
  }),

  // Agregar cultivo a una finca (RQF17).
  http.post(`${API}/fincas/:id/cultivos`, async ({ request, params }) => {
    const r = soloLider(request)
    if (r) return r
    const f = fincas.find((x) => x.id === params.id)
    if (!f) return errorApi(404, 'NO_ENCONTRADO', 'La finca no existe.')
    const b = (await request.json()) as {
      nombre?: string
      tipo?: TipoCultivo
      especies?: Especie[]
    }
    const campos: Record<string, string> = {}
    if (!b.nombre?.trim()) campos.nombre = 'Escribe el nombre del cultivo.'
    else if (f.cultivos.some((c) => normalizar(c.nombre) === normalizar(b.nombre!.trim()))) {
      campos.nombre = 'Esta finca ya tiene un cultivo con ese nombre.'
    }
    if (!b.tipo) campos.tipo = 'Selecciona el tipo de cultivo.'
    if (!b.especies?.length) campos.especies = 'Selecciona al menos una especie'
    if (Object.keys(campos).length) {
      return errorApi(422, 'VALIDACION', 'Revisa los campos marcados.', campos)
    }
    const nuevo: CultivoFixture = {
      id: `cu-${slug(f.nombre)}-${slug(b.nombre!)}`,
      nombre: b.nombre!.trim(),
      tipo: b.tipo!,
      especies: [...b.especies!],
    }
    f.cultivos.push(nuevo)
    return HttpResponse.json(aFinca(f), { status: 201 })
  }),
]
