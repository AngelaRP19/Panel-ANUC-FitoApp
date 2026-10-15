import { http, HttpResponse } from 'msw'
import { casos } from '../fixtures/casos'
import { fincas } from '../fixtures/fincas'
import { productores } from '../fixtures/productores'
import { API, errorApi, noAutenticado, usuarioActual } from './comun'

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const CERRADOS = ['CERRADO', 'DESCARTADO']

/**
 * Productor + finca de los casos asignados al técnico (pantalla 14). Solo aparecen los
 * relacionados con sus casos; los cultivos son los de esos casos.
 */
function registrosDe(tecnicoId: string) {
  const mios = casos.filter((c) => c.tecnico?.id === tecnicoId)
  const grupos = new Map<string, typeof mios>()
  for (const c of mios) {
    const clave = `${c.productor.id}__${c.finca.id}`
    grupos.set(clave, [...(grupos.get(clave) ?? []), c])
  }
  return [...grupos.entries()].map(([id, lista]) => {
    const c0 = lista[0]!
    const finca = fincas.find((f) => f.id === c0.finca.id)
    const productor = productores.find((p) => p.id === c0.productor.id)
    const idsCultivo = new Set(lista.map((c) => c.cultivo.id))
    const cultivos = (finca?.cultivos ?? [])
      .filter((cu) => idsCultivo.has(cu.id))
      .map((cu) => ({ id: cu.id, nombre: cu.nombre, especies: cu.especies }))
    return {
      id,
      productor: {
        id: c0.productor.id,
        nombre: productor?.nombre ?? c0.productor.nombre,
        celular: productor?.celular ?? c0.productor.celular,
      },
      finca: {
        id: c0.finca.id,
        nombre: c0.finca.nombre,
        vereda: c0.finca.vereda,
        latitud: finca?.latitud ?? null,
        longitud: finca?.longitud ?? null,
      },
      cultivos: cultivos.length
        ? cultivos
        : [{ id: c0.cultivo.id, nombre: c0.cultivo.nombre, especies: [c0.especie] }],
      casos: lista
        .sort((a, b) => b.codigo.localeCompare(a.codigo))
        .map((c) => ({ id: c.id, codigo: c.codigo, estado: c.estado })),
    }
  })
}

function soloTecnico(request: Request) {
  const u = usuarioActual(request)
  if (!u) return { error: noAutenticado() }
  if (u.rol !== 'TECNICO') {
    return {
      error: errorApi(403, 'SOLO_TECNICO', 'El líder consulta productores y fincas en Registros.'),
    }
  }
  return { u }
}

export const consultaHandlers = [
  http.get(`${API}/consulta/productores-fincas`, ({ request }) => {
    const r = soloTecnico(request)
    if (r.error) return r.error
    const p = new URL(request.url).searchParams
    const todos = registrosDe(r.u.id)
    const q = normalizar(p.get('q') ?? '')
      .trim()
      .replace(/^#/, '')
    const lista = todos
      .filter((x) => {
        if (
          q &&
          !normalizar(`${x.productor.nombre} ${x.finca.nombre}`).includes(q) &&
          !x.casos.some((c) => c.codigo.includes(q))
        ) {
          return false
        }
        if (p.get('vereda') && x.finca.vereda !== p.get('vereda')) return false
        const especie = p.get('especie')
        if (especie && !x.cultivos.some((cu) => cu.especies.includes(especie as never))) {
          return false
        }
        const abiertos = x.casos.some((c) => !CERRADOS.includes(c.estado))
        if (p.get('estado_casos') === 'pendientes' && !abiertos) return false
        if (p.get('estado_casos') === 'cerrados' && abiertos) return false
        return true
      })
      .sort((a, b) => a.productor.nombre.localeCompare(b.productor.nombre))
    const page = Math.max(1, Number(p.get('page') ?? 1))
    const size = Number(p.get('page_size') ?? 10)
    return HttpResponse.json({
      items: lista.slice((page - 1) * size, page * size),
      total: lista.length,
      page,
      page_size: size,
      resumen: {
        productores: new Set(todos.map((x) => x.productor.id)).size,
        fincas: new Set(todos.map((x) => x.finca.id)).size,
        casos: todos.reduce((s, x) => s + x.casos.length, 0),
      },
    })
  }),

  http.get(`${API}/consulta/productores-fincas/:id`, ({ request, params }) => {
    const r = soloTecnico(request)
    if (r.error) return r.error
    const x = registrosDe(r.u.id).find((y) => y.id === params.id)
    // Lo que no está en sus casos no existe para el técnico.
    return x ? HttpResponse.json(x) : errorApi(404, 'NO_ENCONTRADO', 'No encontrado.')
  }),
]
