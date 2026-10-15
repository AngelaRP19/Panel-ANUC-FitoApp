import { http, HttpResponse } from 'msw'
import type { PeriodoCategorias } from '@/features/inicio/types'
import type { Categoria } from '@/types/enums'
import { alertas } from '../fixtures/alertas'
import { casos } from '../fixtures/casos'
import { cerradoEn, diagnosticoDe } from '../fixtures/detalle'
import { usuarios } from '../fixtures/usuarios'
import { API, errorApi, noAutenticado, usuarioActual } from './comun'

const DIA = 86_400_000
const DIAS_AVISO_VENCIMIENTO = 15
/** Casos que todavía no tienen diagnóstico técnico (sin técnico o en revisión). */
const SIN_DIAGNOSTICO = ['PENDIENTE_REVISION', 'EN_REVISION']
const CATEGORIAS: Categoria[] = ['TRIPS', 'BOTRYTIS', 'RONA', 'DEFICIENCIA_MAGNESIO', 'FUSARIUM']

const ms = (iso: string) => new Date(iso).getTime()

function soloLider(request: Request) {
  const u = usuarioActual(request)
  if (!u) return noAutenticado()
  if (u.rol !== 'LIDER_TECNICO') {
    return errorApi(403, 'SOLO_LIDER', 'El resumen del panel es del líder técnico.')
  }
  return null
}

/** Resumen del inicio del líder calculado con los datos simulados (bandeja, alertas, cuentas). */
function resumen() {
  const ahora = Date.now()
  const hoy = new Date(ahora)
  const pendientes = casos.filter((c) => c.estado === 'PENDIENTE_REVISION')

  // Cerrados en el mes en curso, por resultado técnico.
  const cerrados = casos.filter((c) => {
    const f = cerradoEn(c)
    if (!f) return false
    const d = new Date(f)
    return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth()
  })
  const porResultado = (r: string) =>
    cerrados.filter((c) => diagnosticoDe(c)?.resultado_tecnico === r).length

  const proximos = casos.filter((c) => {
    if (c.estado !== 'CERRADO' || !c.vence_en) return false
    const dias = (ms(c.vence_en) - ahora) / DIA
    return dias >= 0 && dias <= DIAS_AVISO_VENCIMIENTO
  })

  const antiguos = casos
    .filter((c) => SIN_DIAGNOSTICO.includes(c.estado) && c.enviado_a_panel_en)
    .sort((a, b) => ms(a.enviado_a_panel_en!) - ms(b.enviado_a_panel_en!))
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      numero: Number(c.codigo),
      productor_nombre: c.productor.nombre,
      enviado_a_panel_en: c.enviado_a_panel_en!,
      tecnico_asignado_id: c.tecnico?.id ?? null,
    }))

  const recientes = [...alertas].sort((a, b) => b.generada_en.localeCompare(a.generada_en))
  const generadas = recientes.filter((a) => a.estado === 'GENERADA')

  const carga = usuarios
    .filter((u) => u.activo)
    .map((u) => {
      const mios = casos.filter((c) => c.tecnico?.id === u.id)
      return {
        tecnico_id: u.id,
        nombre: u.nombre,
        activos: mios.filter((c) => c.estado === 'EN_REVISION' || c.estado === 'REGISTRADO').length,
        en_revision: mios.filter((c) => c.estado === 'EN_REVISION').length,
        es_lider: u.rol === 'LIDER_TECNICO',
      }
    })
    // Técnicos primero y, dentro de cada grupo, los de más carga.
    .sort((a, b) => (a.es_lider === b.es_lider ? b.activos - a.activos : a.es_lider ? 1 : -1))
    .map((t) => ({
      tecnico_id: t.tecnico_id,
      nombre: t.nombre,
      activos: t.activos,
      en_revision: t.en_revision,
    }))

  return {
    generado_en: new Date(ahora).toISOString(),
    kpis: {
      pendientes_revision: pendientes.length,
      pendientes_mas_48h: pendientes.filter(
        (c) => c.enviado_a_panel_en && ahora - ms(c.enviado_a_panel_en) > 2 * DIA,
      ).length,
      en_revision: casos.filter((c) => c.estado === 'EN_REVISION').length,
      cerrados_mes: {
        total: cerrados.length,
        confirmados: porResultado('CONFIRMADO'),
        otra_patologia: porResultado('OTRA_PATOLOGIA'),
        no_identificado: porResultado('NO_IDENTIFICADO'),
        requiere_visita: porResultado('REQUIERE_VISITA'),
      },
      proximos_a_vencer: proximos.length,
      dias_aviso_vencimiento: DIAS_AVISO_VENCIMIENTO,
    },
    pendientes_antiguos: antiguos,
    pendientes_sin_tecnico: pendientes.length,
    alertas: {
      generadas_sin_revisar: generadas.length,
      destacada: generadas[0]
        ? { categoria: generadas[0].categoria, vereda: generadas[0].vereda }
        : null,
      recientes: recientes.slice(0, 4).map((a) => ({
        id: a.id,
        estado: a.estado,
        categoria: a.categoria,
        vereda: a.vereda,
        num_casos: a.casos.length,
        productores_notificados: a.productores_notificados,
        generada_en: a.generada_en,
      })),
    },
    carga_tecnicos: carga,
  }
}

const VENTANA: Record<PeriodoCategorias, (ahora: Date) => number> = {
  '30d': (ahora) => ahora.getTime() - 30 * DIA,
  '90d': (ahora) => ahora.getTime() - 90 * DIA,
  anio: (ahora) => new Date(ahora.getFullYear(), 0, 1).getTime(),
}

/**
 * Casos confirmados por categoría: cerrados con resultado Confirmado (categoría del análisis
 * preliminar) u Otra patología (categoría determinada por el técnico), dentro del periodo.
 */
function porCategoria(periodo: PeriodoCategorias) {
  const desde = VENTANA[periodo](new Date())
  const cuenta = new Map<Categoria, number>(CATEGORIAS.map((c) => [c, 0]))
  for (const c of casos) {
    const f = cerradoEn(c)
    const d = diagnosticoDe(c)
    if (!f || !d || ms(f) < desde) continue
    const cat =
      d.resultado_tecnico === 'CONFIRMADO'
        ? (c.preliminar?.categoria ?? null)
        : d.resultado_tecnico === 'OTRA_PATOLOGIA'
          ? d.categoria_determinada
          : null
    if (cat) cuenta.set(cat, (cuenta.get(cat) ?? 0) + 1)
  }
  const items = CATEGORIAS.map((categoria) => ({ categoria, total: cuenta.get(categoria)! })).sort(
    (a, b) => b.total - a.total,
  )
  return { periodo, items, total: items.reduce((s, i) => s + i.total, 0) }
}

/** Resumen del inicio del técnico (pantalla 17): solo sus casos asignados. */
function resumenTecnico(u: { id: string; nombre: string }) {
  const ahora = Date.now()
  const hoy = new Date(ahora)
  const mios = casos.filter((c) => c.tecnico?.id === u.id)
  const enRevision = mios.filter((c) => c.estado === 'EN_REVISION')
  const registrados = mios.filter((c) => c.estado === 'REGISTRADO')
  const cerrados = mios.filter((c) => {
    const f = cerradoEn(c)
    if (!f) return false
    const d = new Date(f)
    return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth()
  })
  const porResultado = (r: string) =>
    cerrados.filter((c) => diagnosticoDe(c)?.resultado_tecnico === r).length
  const espera = (c: (typeof mios)[number]) =>
    c.enviado_a_panel_en ? ahora - ms(c.enviado_a_panel_en) : 0

  const porAtender = [
    ...enRevision.sort((a, b) => espera(b) - espera(a)),
    ...registrados.sort((a, b) => espera(b) - espera(a)),
  ].map((c) => ({
    id: c.id,
    productor_nombre: c.productor.nombre,
    estado: c.estado,
    enviado_a_panel_en: c.enviado_a_panel_en,
    mas_48h: espera(c) > 2 * DIA,
  }))

  const recientes = mios
    .map((c) => ({ c, d: diagnosticoDe(c) }))
    .filter(({ d }) => d && d.tecnico_responsable.id === u.id)
    .sort((a, b) => b.d!.registrado_en.localeCompare(a.d!.registrado_en))
    .slice(0, 3)
    .map(({ c, d }) => ({
      caso_id: c.id,
      resultado_tecnico: d!.resultado_tecnico,
      categoria:
        d!.resultado_tecnico === 'OTRA_PATOLOGIA'
          ? d!.categoria_determinada
          : d!.resultado_tecnico === 'CONFIRMADO'
            ? (c.preliminar?.categoria ?? null)
            : null,
      registrado_en: d!.registrado_en,
    }))

  const lider = usuarios.find((x) => x.rol === 'LIDER_TECNICO' && x.activo)
  return {
    generado_en: new Date(ahora).toISOString(),
    nombre: u.nombre,
    lider_nombre: lider?.nombre ?? null,
    kpis: {
      en_revision: enRevision.length,
      en_revision_mas_48h: enRevision.filter((c) => espera(c) > 2 * DIA).length,
      registrados_sin_cerrar: registrados.map((c) => c.id),
      cerrados_mes: {
        total: cerrados.length,
        confirmados: porResultado('CONFIRMADO'),
        otra_patologia: porResultado('OTRA_PATOLOGIA'),
        no_identificado: porResultado('NO_IDENTIFICADO'),
        requiere_visita: porResultado('REQUIERE_VISITA'),
      },
      proximos_a_vencer: mios.filter((c) => {
        if (c.estado !== 'CERRADO' || !c.vence_en) return false
        const dias = (ms(c.vence_en) - ahora) / DIA
        return dias >= 0 && dias <= DIAS_AVISO_VENCIMIENTO
      }).length,
      dias_aviso_vencimiento: DIAS_AVISO_VENCIMIENTO,
    },
    por_atender: porAtender,
    diagnosticos_recientes: recientes,
  }
}

export const inicioHandlers = [
  http.get(`${API}/panel/resumen-tecnico`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    if (u.rol !== 'TECNICO') {
      return errorApi(403, 'SOLO_TECNICO', 'Este resumen es del técnico.')
    }
    return HttpResponse.json(resumenTecnico(u))
  }),
  http.get(
    `${API}/panel/resumen`,
    ({ request }) => soloLider(request) ?? HttpResponse.json(resumen()),
  ),
  http.get(`${API}/panel/casos-por-categoria`, ({ request }) => {
    const bloqueo = soloLider(request)
    if (bloqueo) return bloqueo
    const p = new URL(request.url).searchParams.get('periodo')
    const periodo: PeriodoCategorias = p === '30d' || p === 'anio' ? p : '90d'
    return HttpResponse.json(porCategoria(periodo))
  }),
]
