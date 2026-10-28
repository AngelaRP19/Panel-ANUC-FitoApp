import { http, HttpResponse } from 'msw'
import type { Categoria, EstadoCaso, ResultadoTecnico } from '@/types/enums'
import { casos, type CasoFixture } from '../fixtures/casos'
import {
  cuestionarioDe,
  detalleDe,
  diagnosticoDe,
  evidenciasDe,
  explicacionDe,
  historialDe,
} from '../fixtures/detalle'
import { usuarios, type UsuarioFixture } from '../fixtures/usuarios'
import { API, errorApi, noAutenticado, usuarioActual } from './comun'

const MS_DIA = 86_400_000
/** Igual que `ESTADOS_ASIGNABLES` del backend: un caso Registrado ya no se reasigna (D-22). */
const ASIGNABLES: EstadoCaso[] = ['PENDIENTE_REVISION', 'EN_REVISION']

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Fecha de calendario en Bogotá (aaaa-mm-dd) de un ISO. */
const diaBogota = (iso: string) =>
  new Date(new Date(iso).getTime() - 5 * 3_600_000).toISOString().slice(0, 10)

/** El técnico solo ve sus casos asignados; el líder, todos. */
function visibles(u: UsuarioFixture): CasoFixture[] {
  return u.rol === 'LIDER_TECNICO' ? casos : casos.filter((c) => c.tecnico?.id === u.id)
}

/**
 * Permisos del usuario sobre el caso, calculados en el servidor (guía backend 10.4). El líder
 * nunca diagnostica (D-02): si atiende casos, usa su cuenta de técnico aparte.
 */
function permisosDe(c: CasoFixture, u: UsuarioFixture) {
  const esLider = u.rol === 'LIDER_TECNICO'
  const asignado = c.tecnico?.id === u.id
  return {
    // D-22: solo En revisión. Un caso Registrado ya no se edita; solo pasa a Cerrado.
    puede_diagnosticar: !esLider && asignado && c.estado === 'EN_REVISION',
    puede_cerrar: c.estado === 'REGISTRADO' && (esLider || asignado),
    puede_asignar: esLider && ASIGNABLES.includes(c.estado),
  }
}

/** Detalle consolidado con los permisos del usuario actual. */
const detalleCon = (c: CasoFixture, u: UsuarioFixture) => ({ ...detalleDe(c), ...permisosDe(c, u) })

/** Caso que el usuario puede ver, o la respuesta de error (401 / 404). */
function casoVisible(request: Request, id: string): CasoFixture | Response {
  const u = usuarioActual(request)
  if (!u) return noAutenticado()
  const caso = visibles(u).find((c) => c.id === id)
  return caso ?? errorApi(404, 'CASO_NO_ENCONTRADO', 'El caso no existe.')
}

/** Aplica los filtros de la bandeja (todos menos el de estado). */
function filtrar(lista: CasoFixture[], p: URLSearchParams): CasoFixture[] {
  const q = normalizar(p.get('q') ?? '')
    .trim()
    .replace(/^#/, '')
  const ahora = Date.now()
  return lista.filter((c) => {
    if (q && !normalizar(`${c.id} ${c.productor.nombre} ${c.finca.nombre}`).includes(q)) {
      return false
    }
    if (p.get('vereda') && c.finca.vereda !== p.get('vereda')) return false
    if (p.get('finca_id') && c.finca.id !== p.get('finca_id')) return false
    if (p.get('cultivo_id') && c.cultivo.id !== p.get('cultivo_id')) return false
    if (p.get('especie') && c.especie !== p.get('especie')) return false

    const categoria = p.get('categoria')
    if (categoria === 'NO_IDENTIFICADA' && c.preliminar?.resultado !== 'NO_IDENTIFICADO') {
      return false
    }
    if (categoria && categoria !== 'NO_IDENTIFICADA' && c.preliminar?.categoria !== categoria) {
      return false
    }

    const tecnico = p.get('tecnico_id')
    if (tecnico === 'sin_asignar' && c.tecnico) return false
    if (tecnico && tecnico !== 'sin_asignar' && c.tecnico?.id !== tecnico) return false

    const min = Number(p.get('coincidencia_min') ?? 0)
    if (min && (c.preliminar?.porcentaje ?? 0) < min) return false

    const venc = p.get('vencimiento')
    if (venc === '15' || venc === '30') {
      if (!c.vence_en) return false
      const dias = (new Date(c.vence_en).getTime() - ahora) / MS_DIA
      if (dias < 0 || dias > Number(venc)) return false
    }

    const desde = p.get('desde')
    const hasta = p.get('hasta')
    if ((desde || hasta) && !c.enviado_a_panel_en) return false
    if (desde && diaBogota(c.enviado_a_panel_en!) < desde) return false
    if (hasta && diaBogota(c.enviado_a_panel_en!) > hasta) return false
    return true
  })
}

/** Más recientes primero; los que aún no se envían al panel, al final. */
function ordenar(lista: CasoFixture[]) {
  return [...lista].sort((a, b) => {
    if (!a.enviado_a_panel_en || !b.enviado_a_panel_en) {
      return (
        (a.enviado_a_panel_en ? 0 : 1) - (b.enviado_a_panel_en ? 0 : 1) || b.id.localeCompare(a.id)
      )
    }
    return b.enviado_a_panel_en.localeCompare(a.enviado_a_panel_en)
  })
}

export const casosHandlers = [
  // Bandeja paginada (RQF20).
  http.get(`${API}/casos`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const p = new URL(request.url).searchParams
    let lista = filtrar(visibles(u), p)
    const estado = p.get('estado')
    if (estado) lista = lista.filter((c) => c.estado === estado)
    const page = Math.max(1, Number(p.get('page') ?? 1))
    const pageSize = Number(p.get('page_size') ?? 15)
    const ordenados = ordenar(lista)
    return HttpResponse.json({
      items: ordenados.slice((page - 1) * pageSize, page * pageSize),
      total: ordenados.length,
      page,
      page_size: pageSize,
    })
  }),

  // Conteo por estado con los filtros aplicados (pestañas).
  http.get(`${API}/casos/conteos`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const lista = filtrar(visibles(u), new URL(request.url).searchParams)
    const conteos: Record<string, number> = { todos: lista.length }
    for (const c of lista) conteos[c.estado] = (conteos[c.estado] ?? 0) + 1
    return HttpResponse.json(conteos)
  }),

  // Opciones de los filtros, a partir de los casos que el usuario puede ver.
  http.get(`${API}/casos/filtros`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const lista = visibles(u)
    const unicos = <T extends { id: string }>(xs: T[]) => [
      ...new Map(xs.map((x) => [x.id, x])).values(),
    ]
    const nombreVereda: Record<string, string> = {
      JURACAMBITA: 'Juracambita',
      CENTRO: 'Centro',
      SAN_LUIS: 'San Luis',
    }
    return HttpResponse.json({
      veredas: unicos(
        lista.map((c) => ({
          id: c.finca.vereda,
          nombre: nombreVereda[c.finca.vereda] ?? c.finca.vereda,
        })),
      ).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      fincas: unicos(
        lista.map((c) => ({ id: c.finca.id, nombre: c.finca.nombre, vereda: c.finca.vereda })),
      ).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      cultivos: unicos(
        lista.map((c) => ({ id: c.cultivo.id, nombre: c.cultivo.nombre, finca_id: c.finca.id })),
      ).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    })
  }),

  // Detalle de un caso y sus partes. Al técnico solo le responde sus casos asignados: el resto
  // da 404 para no revelar que existe (guía 6.4).
  http.get(`${API}/casos/:id`, ({ request, params }) => {
    const r = casoVisible(request, String(params.id))
    return r instanceof Response ? r : HttpResponse.json(detalleCon(r, usuarioActual(request)!))
  }),
  http.get(`${API}/casos/:id/evidencias`, ({ request, params }) => {
    const r = casoVisible(request, String(params.id))
    return r instanceof Response ? r : HttpResponse.json(evidenciasDe(r))
  }),
  http.get(`${API}/casos/:id/cuestionario`, ({ request, params }) => {
    const r = casoVisible(request, String(params.id))
    return r instanceof Response ? r : HttpResponse.json(cuestionarioDe(r))
  }),
  http.get(`${API}/casos/:id/historial`, ({ request, params }) => {
    const r = casoVisible(request, String(params.id))
    return r instanceof Response ? r : HttpResponse.json(historialDe(r))
  }),
  http.get(`${API}/casos/:id/explicacion`, ({ request, params }) => {
    const r = casoVisible(request, String(params.id))
    if (r instanceof Response) return r
    const explicacion = explicacionDe(r)
    return explicacion
      ? HttpResponse.json(explicacion)
      : errorApi(404, 'SIN_ANALISIS', 'El chatbot aún no termina el análisis.')
  }),

  // Guardar el diagnóstico técnico (RQF22): el caso pasa a Registrado. Solo el técnico asignado
  // (el responsable es siempre él). El líder recibe 403 (D-02). Se puede volver a guardar
  // mientras el caso no esté cerrado.
  http.post(`${API}/casos/:id/diagnostico`, async ({ request, params }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    if (u.rol === 'LIDER_TECNICO') {
      return errorApi(
        403,
        'SIN_PERMISO',
        'El líder técnico no registra diagnósticos. Usa tu cuenta de técnico.',
      )
    }
    const caso = visibles(u).find((c) => c.id === params.id)
    if (!caso) return errorApi(404, 'CASO_NO_ENCONTRADO', 'El caso no existe.')
    // Mismas respuestas que el backend (D-22): el diagnóstico se guarda una sola vez.
    if (caso.estado !== 'EN_REVISION') {
      const yaTiene = caso.estado === 'REGISTRADO' || caso.estado === 'CERRADO'
      return errorApi(
        409,
        'TRANSICION_INVALIDA',
        yaTiene
          ? 'Este caso ya tiene diagnóstico.'
          : 'El caso debe estar En revisión para diagnosticarlo.',
      )
    }
    const b = (await request.json()) as {
      resultado_tecnico?: ResultadoTecnico
      categoria_determinada?: Categoria | null
      motivo_visita?: string | null
      descripcion?: string
      observaciones?: string
    }
    const campos: Record<string, string> = {}
    if (!b.resultado_tecnico) campos.resultado_tecnico = 'Selecciona un resultado técnico.'
    if (b.resultado_tecnico === 'OTRA_PATOLOGIA' && !b.categoria_determinada) {
      campos.categoria_determinada = 'Selecciona la categoría fitosanitaria que determinaste.'
    }
    if (b.resultado_tecnico === 'REQUIERE_VISITA' && !b.motivo_visita?.trim()) {
      campos.motivo_visita = 'Escribe el motivo de la visita.'
    }
    if (Object.keys(campos).length > 0) {
      return errorApi(422, 'VALIDACION', 'Revisa los campos marcados.', campos)
    }
    const responsable = u
    caso.estado = 'REGISTRADO'
    caso.diagnostico = {
      resultado_tecnico: b.resultado_tecnico!,
      categoria_determinada:
        b.resultado_tecnico === 'OTRA_PATOLOGIA' ? b.categoria_determinada! : null,
      motivo_visita: b.resultado_tecnico === 'REQUIERE_VISITA' ? b.motivo_visita!.trim() : null,
      descripcion: b.descripcion?.trim() ?? '',
      observaciones: b.observaciones?.trim() ?? '',
      tecnico_responsable: { id: responsable.id, nombre: responsable.nombre },
      registrado_en: new Date().toISOString(),
    }
    return HttpResponse.json(detalleCon(caso, u))
  }),

  // Cerrar el caso (RQF23): solo con el diagnóstico guardado. Fija el vencimiento en 6 meses.
  http.post(`${API}/casos/:id/cierre`, ({ request, params }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const caso = visibles(u).find((c) => c.id === params.id)
    if (!caso) return errorApi(404, 'CASO_NO_ENCONTRADO', 'El caso no existe.')
    if (caso.estado !== 'REGISTRADO') {
      return errorApi(
        409,
        'ESTADO_INVALIDO',
        'Guarda el diagnóstico técnico antes de cerrar el caso.',
      )
    }
    const ahora = new Date()
    const vence = new Date(ahora)
    vence.setMonth(vence.getMonth() + 6)
    caso.diagnostico = diagnosticoDe(caso)
    caso.estado = 'CERRADO'
    caso.cerrado_en = ahora.toISOString()
    caso.vence_en = vence.toISOString()
    return HttpResponse.json(detalleCon(caso, u))
  }),

  // Asignar o reasignar el técnico (solo líder). Pendiente de revisión → En revisión.
  http.patch(`${API}/casos/:id/asignacion`, async ({ request, params }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    if (u.rol !== 'LIDER_TECNICO') {
      return errorApi(403, 'SOLO_LIDER', 'Solo el líder técnico asigna casos.')
    }
    const caso = casos.find((c) => c.id === params.id)
    if (!caso) return errorApi(404, 'CASO_NO_ENCONTRADO', 'El caso no existe.')
    if (!ASIGNABLES.includes(caso.estado)) {
      return errorApi(409, 'TRANSICION_INVALIDA', 'El caso ya no admite asignación.')
    }
    const { tecnico_id } = (await request.json()) as { tecnico_id: string }
    // Solo cuentas de rol técnico (D-02): el rol líder no recibe casos.
    const tecnico = usuarios.find((x) => x.id === tecnico_id && x.activo && x.rol === 'TECNICO')
    if (!tecnico) {
      return errorApi(422, 'TECNICO_INVALIDO', 'El técnico no existe o está deshabilitado.', {
        tecnico_id: 'Elige un técnico activo.',
      })
    }
    caso.tecnico = { id: tecnico.id, nombre: tecnico.nombre }
    if (caso.estado === 'PENDIENTE_REVISION') caso.estado = 'EN_REVISION'
    return HttpResponse.json(caso)
  }),
]
