// Reportes (pantallas 23 y 24 · Fase C). Se calculan con los datos simulados del panel
// (casos, alertas, productores, fincas y cuentas) y los filtros de cada panel (F1-F4).
// Datos sin fuente en los mocks (uso del chatbot) se derivan de los casos de forma fija y
// están marcados como «demostración». Los reportes no incluyen fotos ni conservación.
import { http, HttpResponse } from 'msw'
import type {
  ConsultaGuardada,
  FiltrosReporte,
  ItemBarra,
  KpiReporte,
  ReporteDatos,
  ResumenReportes,
  SeccionReporte,
  TipoReporte,
} from '@/features/reportes/types'
import { esTipoReporte, lista, rangoPeriodo, REPORTES } from '@/features/reportes/utils'
import type { Categoria, Especie, EstadoCaso, Vereda } from '@/types/enums'
import { alertas, parametros, type AlertaFixture } from '../fixtures/alertas'
import { casos, type CasoFixture } from '../fixtures/casos'
import { consultas, type ConsultaFixture } from '../fixtures/consultas'
import { cerradoEn, diagnosticoDe } from '../fixtures/detalle'
import { fincas } from '../fixtures/fincas'
import { productores } from '../fixtures/productores'
import { usuarios } from '../fixtures/usuarios'
import { API, errorApi, noAutenticado, usuarioActual } from './comun'

const DIA = 86_400_000
const ms = (iso: string) => new Date(iso).getTime()
const dia = (iso: string) => new Date(ms(iso) - 5 * 3_600_000).toISOString().slice(0, 10)
const fechaCorta = (iso: string) => dia(iso).split('-').reverse().join('/')
const decimal = (n: number) => (Number.isFinite(n) ? n.toFixed(1).replace('.', ',') : '—')
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
const promedio = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN)

const VEREDAS: Vereda[] = ['JURACAMBITA', 'CENTRO', 'SAN_LUIS']
const VEREDA: Record<Vereda, string> = {
  JURACAMBITA: 'Juracambita',
  CENTRO: 'Centro',
  SAN_LUIS: 'San Luis',
}
const ESPECIES: Especie[] = ['GULUPA', 'GRANADILLA', 'MARACUYA']
const ESPECIE: Record<Especie, string> = {
  GULUPA: 'Gulupa',
  GRANADILLA: 'Granadilla',
  MARACUYA: 'Maracuyá',
}
const CATEGORIAS: Categoria[] = ['TRIPS', 'BOTRYTIS', 'RONA', 'FUSARIUM', 'DEFICIENCIA_MAGNESIO']
const CATEGORIA: Record<Categoria, string> = {
  TRIPS: 'Trips',
  BOTRYTIS: 'Botrytis',
  RONA: 'Roña',
  FUSARIUM: 'Fusarium',
  DEFICIENCIA_MAGNESIO: 'Def. magnesio',
}
const ESTADOS: [EstadoCaso, string][] = [
  ['CREADO', 'Caso creado'],
  ['EN_ANALISIS', 'En análisis'],
  ['PENDIENTE_REVISION', 'Pendiente de revisión'],
  ['EN_REVISION', 'En revisión'],
  ['REGISTRADO', 'Registrado'],
  ['CERRADO', 'Cerrado'],
  ['DESCARTADO', 'Descartado'],
]
const ESTADO = Object.fromEntries(ESTADOS) as Record<EstadoCaso, string>
const RESULTADO: Record<string, string> = {
  CONFIRMADO: 'Confirmado',
  OTRA_PATOLOGIA: 'Otra patología',
  NO_IDENTIFICADO: 'No identificado',
  REQUIERE_VISITA: 'Requiere visita',
  SIN_DIAGNOSTICO: 'Sin diagnóstico aún',
}
const ALERTA: Record<string, string> = {
  GENERADA: 'Generada',
  EN_REVISION: 'En revisión',
  CONFIRMADA: 'Confirmada',
  COMUNICADA: 'Comunicada',
  DESCARTADA: 'Descartada',
}
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES_LARGOS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/** Fecha de referencia de un caso: envío al panel (o la creación, si aún no se envía). */
const fechaCaso = (c: CasoFixture) =>
  c.enviado_a_panel_en ?? new Date(Date.now() - 2 * 3_600_000).toISOString()
const resultadoDe = (c: CasoFixture) => diagnosticoDe(c)?.resultado_tecnico ?? 'SIN_DIAGNOSTICO'
const categoriaPreliminar = (c: CasoFixture) =>
  c.preliminar?.resultado === 'NO_IDENTIFICADO'
    ? 'NO_IDENTIFICADA'
    : (c.preliminar?.categoria ?? null)

// ── Filtros F1 (casos) ────────────────────────────────────────────────────────────────
function casosFiltrados(f: FiltrosReporte) {
  const { desde, hasta } = rangoPeriodo(f)
  const ahora = Date.now()
  const especies = lista(f.especie)
  const tipos = lista(f.tipo_cultivo)
  const estados = lista(f.estado)
  const categorias = lista(f.categoria)
  const productoresElegidos = lista(f.productor)
  return casos.filter((c) => {
    const d = dia(fechaCaso(c))
    if (d < desde || d > hasta) return false
    if (f.vereda && c.finca.vereda !== f.vereda) return false
    if (f.finca && c.finca.id !== f.finca) return false
    if (productoresElegidos.length && !productoresElegidos.includes(c.productor.id)) return false
    if (especies.length && !especies.includes(c.especie)) return false
    if (tipos.length) {
      const cultivo = fincas
        .find((x) => x.id === c.finca.id)
        ?.cultivos.find((x) => x.id === c.cultivo.id)
      if (!cultivo || !tipos.includes(cultivo.tipo)) return false
    }
    if (estados.length && !estados.includes(c.estado)) return false
    if (categorias.length && !categorias.includes(categoriaPreliminar(c) ?? '')) return false
    const p = c.preliminar?.porcentaje ?? null
    if (f.coincidencia_min && (p === null || p < Number(f.coincidencia_min))) return false
    if (f.coincidencia_max && (p === null || p > Number(f.coincidencia_max))) return false
    if (f.resultado && resultadoDe(c) !== f.resultado) return false
    if (f.tecnico === 'sin' && c.tecnico) return false
    if (f.tecnico && f.tecnico !== 'sin' && c.tecnico?.id !== f.tecnico) return false
    if (f.espera) {
      if (!['PENDIENTE_REVISION', 'EN_REVISION'].includes(c.estado) || !c.enviado_a_panel_en)
        return false
      if ((ahora - ms(c.enviado_a_panel_en)) / DIA <= Number(f.espera)) return false
    }
    return true
  })
}

/** Días desde el envío hasta el diagnóstico técnico (casos con diagnóstico). */
function diasRevision(lista: CasoFixture[]) {
  return lista.flatMap((c) => {
    const d = diagnosticoDe(c)
    return d && c.enviado_a_panel_en ? [(ms(d.registrado_en) - ms(c.enviado_a_panel_en)) / DIA] : []
  })
}

/** Semana (lunes) de una fecha: «Sem. del 1 sep». */
function semana(iso: string) {
  const d = new Date(`${dia(iso)}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}
function porSemana(lista: CasoFixture[]): ItemBarra[] {
  const cuenta = new Map<string, number>()
  for (const c of lista.filter((x) => x.enviado_a_panel_en)) {
    const s = semana(c.enviado_a_panel_en!)
    cuenta.set(s, (cuenta.get(s) ?? 0) + 1)
  }
  return [...cuenta.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([s, n]) => {
      const [, m, d] = s.split('-')
      return { etiqueta: `Sem. del ${Number(d)} ${MESES[Number(m) - 1]}`, valor: n }
    })
}

const filaCaso = (c: CasoFixture) => ({
  _caso: c.id,
  caso: `#${c.codigo}`,
  recibido: fechaCorta(fechaCaso(c)),
  productor: c.productor.nombre,
  vereda: VEREDA[c.finca.vereda],
  preliminar: !c.preliminar
    ? '—'
    : c.preliminar.resultado === 'NO_IDENTIFICADO'
      ? 'No identificada'
      : `${CATEGORIA[c.preliminar.categoria!]} · ${c.preliminar.porcentaje} %`,
  estado: ESTADO[c.estado],
  tecnico: c.tecnico?.nombre ?? 'Sin técnico',
})

function textoRango(f: FiltrosReporte, lista: CasoFixture[]) {
  const { desde, hasta } = rangoPeriodo(f)
  const codigos = lista.map((c) => c.codigo).sort()
  const casosTxt = codigos.length
    ? ` · ${plural(lista.length, 'caso', 'casos')} (#${codigos[0]} a #${codigos.at(-1)})`
    : ' · sin casos'
  return `${fechaCorta(`${desde}T17:00:00Z`)} a ${fechaCorta(`${hasta}T17:00:00Z`)}${casosTxt}`
}

// ── R1 · Casos y estados ──────────────────────────────────────────────────────────────
function reporteCasos(f: FiltrosReporte): ReporteDatos {
  const l = casosFiltrados(f)
  const enviados = l.filter((c) => c.enviado_a_panel_en)
  const n = (e: EstadoCaso) => l.filter((c) => c.estado === e).length
  const cerrados = l.filter((c) => cerradoEn(c))
  const diasCierre = cerrados.map((c) => (ms(cerradoEn(c)!) - ms(c.enviado_a_panel_en!)) / DIA)
  const activos = l.filter((c) =>
    ['PENDIENTE_REVISION', 'EN_REVISION', 'REGISTRADO'].includes(c.estado),
  )
  const antiguedad = (c: CasoFixture) => (Date.now() - ms(c.enviado_a_panel_en!)) / DIA
  const tramos: [string, (d: number) => boolean][] = [
    ['0 a 1 día', (d) => d < 2],
    ['2 a 3 días', (d) => d >= 2 && d < 4],
    ['4 a 7 días', (d) => d >= 4 && d <= 7],
    ['Más de 7 días', (d) => d > 7],
  ]
  const viejos = activos.filter((c) => antiguedad(c) > 7)
  const asignacion = enviados.filter((c) => c.tecnico).map(() => 16 / 60 / 24)
  const diagnostico = diasRevision(l)
  const aCierre = cerrados.map(
    (c) => (ms(cerradoEn(c)!) - ms(diagnosticoDe(c)!.registrado_en)) / DIA,
  )
  return {
    tipo: 'casos',
    titulo: 'Reporte de casos',
    subtitulo: `${textoRango(f, l)} · datos del panel y del chatbot`,
    total: l.length,
    sustantivo: 'casos',
    kpis: [
      {
        rotulo: 'Recibidos',
        valor: String(l.length),
        pie: `${enviados.length} enviados al panel`,
        tono: 'info',
      },
      {
        rotulo: 'Pendientes de revisión',
        valor: String(n('PENDIENTE_REVISION')),
        pie: 'sin técnico asignado',
        tono: 'adv',
      },
      {
        rotulo: 'En revisión',
        valor: String(n('EN_REVISION')),
        pie: `${plural(n('REGISTRADO'), 'registrado', 'registrados')} sin cerrar`,
        tono: 'revision',
      },
      {
        rotulo: 'Cerrados',
        valor: String(n('CERRADO')),
        pie: `${plural(n('DESCARTADO'), 'descartado', 'descartados')} por el chatbot`,
        tono: 'ok',
      },
      {
        rotulo: 'Días hasta el cierre',
        valor: decimal(promedio(diasCierre)),
        pie: 'promedio de los casos cerrados',
        tono: 'neutro',
      },
    ],
    secciones: [
      {
        tipo: 'barras',
        id: 'estados',
        titulo: 'Casos por estado',
        subtitulo: `${plural(l.length, 'caso', 'casos')} · cada estado con su nombre y cifra`,
        ancho: 'mitad',
        items: ESTADOS.map(([e, nombre]) => ({ etiqueta: nombre, valor: n(e) })),
      },
      {
        tipo: 'barras',
        id: 'semanas',
        titulo: 'Casos enviados al panel por semana',
        subtitulo: `${plural(enviados.length, 'caso', 'casos')} con fecha`,
        ancho: 'mitad',
        items: porSemana(enviados),
      },
      {
        tipo: 'barras',
        id: 'tiempos',
        titulo: 'Tiempos del proceso',
        subtitulo: 'promedios en días',
        ancho: 'mitad',
        items: [
          {
            etiqueta: 'Recepción → asignación',
            valor: promedio(asignacion) || 0,
            texto: `${decimal(promedio(asignacion))} días`,
          },
          {
            etiqueta: 'Asignación → diagnóstico técnico',
            valor: promedio(diagnostico) || 0,
            texto: `${decimal(promedio(diagnostico))} días`,
          },
          {
            etiqueta: 'Diagnóstico → cierre',
            valor: promedio(aCierre) || 0,
            texto: `${decimal(promedio(aCierre))} días`,
          },
        ],
        nota: `Tiempo medio desde que llega al panel hasta el cierre: ${decimal(promedio(diasCierre))} días.`,
      },
      {
        tipo: 'barras',
        id: 'antiguedad',
        titulo: 'Casos activos por antigüedad',
        subtitulo: 'días desde que llegó al panel',
        ancho: 'mitad',
        items: tramos.map(([etiqueta, en]) => {
          const v = activos.filter((c) => en(antiguedad(c))).length
          return { etiqueta, valor: v, texto: plural(v, 'caso', 'casos') }
        }),
        nota: `${plural(activos.length, 'caso activo', 'casos activos')}.${viejos.length ? ` Los de más de 7 días: ${viejos.map((c) => `#${c.codigo}`).join(' y ')}.` : ''}`,
      },
      {
        tipo: 'tabla',
        id: 'vereda-especie',
        titulo: 'Casos por vereda y especie',
        ancho: 'completo',
        columnas: [
          { clave: 'vereda', titulo: 'Vereda' },
          ...ESPECIES.map((e) => ({ clave: e, titulo: ESPECIE[e], alinear: 'derecha' as const })),
          { clave: 'total', titulo: 'Total', alinear: 'derecha' },
        ],
        filas: [
          ...VEREDAS.map((v) => ({
            vereda: VEREDA[v],
            ...Object.fromEntries(
              ESPECIES.map((e) => [
                e,
                l.filter((c) => c.finca.vereda === v && c.especie === e).length,
              ]),
            ),
            total: l.filter((c) => c.finca.vereda === v).length,
          })),
          {
            vereda: 'Total',
            ...Object.fromEntries(
              ESPECIES.map((e) => [e, l.filter((c) => c.especie === e).length]),
            ),
            total: l.length,
          },
        ],
      },
      {
        tipo: 'tabla',
        id: 'principal',
        titulo: 'Casos del periodo',
        subtitulo: 'orden: más recientes',
        ancho: 'completo',
        columnas: [
          { clave: 'caso', titulo: 'Caso' },
          { clave: 'recibido', titulo: 'Recibido' },
          { clave: 'productor', titulo: 'Productor' },
          { clave: 'vereda', titulo: 'Vereda' },
          { clave: 'preliminar', titulo: 'Preliminar' },
          { clave: 'estado', titulo: 'Estado' },
          { clave: 'tecnico', titulo: 'Técnico' },
        ],
        filas: [...l].sort((a, b) => b.codigo.localeCompare(a.codigo)).map(filaCaso),
        porPagina: 10,
        sustantivo: 'casos',
        vacio: 'Ningún caso coincide con los filtros.',
      },
    ],
  }
}

// ── R2 · Identificación preliminar y diagnóstico ─────────────────────────────────────
function reporteIdentificacion(f: FiltrosReporte): ReporteDatos {
  const l = casosFiltrados(f)
  const conPre = l.filter((c) => c.preliminar)
  const conCat = conPre.filter(
    (c) => c.preliminar!.categoria && c.preliminar!.resultado !== 'NO_IDENTIFICADO',
  )
  const noIdent = conPre.length - conCat.length
  const porcentajes = conCat.map((c) => c.preliminar!.porcentaje ?? 0)
  const diagCat = conCat.filter((c) => ['CONFIRMADO', 'OTRA_PATOLOGIA'].includes(resultadoDe(c)))
  const confirmados = diagCat.filter((c) => resultadoDe(c) === 'CONFIRMADO')
  const otra = l.filter((c) => resultadoDe(c) === 'OTRA_PATOLOGIA')
  const sinDiag = l.filter((c) => resultadoDe(c) === 'SIN_DIAGNOSTICO' && c.enviado_a_panel_en)
  const filasPre: [string, (c: CasoFixture) => boolean][] = [
    ...CATEGORIAS.map(
      (cat) =>
        [CATEGORIA[cat], (c: CasoFixture) => categoriaPreliminar(c) === cat] as [
          string,
          (c: CasoFixture) => boolean,
        ],
    ),
    ['No identificada', (c) => categoriaPreliminar(c) === 'NO_IDENTIFICADA'],
  ]
  const columnasRes = [
    'CONFIRMADO',
    'OTRA_PATOLOGIA',
    'NO_IDENTIFICADO',
    'REQUIERE_VISITA',
    'SIN_DIAGNOSTICO',
  ]
  const rangos: [string, (p: number) => boolean][] = [
    ['Menos de 60 %', (p) => p < 60],
    ['60 a 69 %', (p) => p >= 60 && p < 70],
    ['70 a 79 %', (p) => p >= 70 && p < 80],
    ['80 % o más', (p) => p >= 80],
  ]
  const bajos = conCat
    .filter((c) => (c.preliminar!.porcentaje ?? 0) < 70)
    .sort((a, b) => (a.preliminar!.porcentaje ?? 0) - (b.preliminar!.porcentaje ?? 0))
  return {
    tipo: 'identificacion',
    titulo: 'Identificación preliminar y diagnóstico técnico',
    subtitulo: `${textoRango(f, l)} · la identificación preliminar no reemplaza el diagnóstico técnico`,
    total: l.length,
    sustantivo: 'casos',
    kpis: [
      {
        rotulo: 'Con identificación preliminar',
        valor: String(conPre.length),
        pie: `${conCat.length} con categoría · ${plural(noIdent, 'no identificada', 'no identificadas')}`,
        tono: 'info',
      },
      {
        rotulo: 'Coincidencia media de síntomas',
        valor: porcentajes.length ? `${Math.round(promedio(porcentajes))} %` : '—',
        pie: 'de la categoría sugerida',
        tono: 'revision',
      },
      {
        rotulo: 'El técnico confirmó la categoría',
        valor: diagCat.length ? `${pct(confirmados.length, diagCat.length)} %` : '—',
        pie: `${confirmados.length} de ${diagCat.length} diagnósticos con categoría`,
        tono: 'ok',
      },
      {
        rotulo: 'Sin diagnóstico técnico aún',
        valor: String(sinDiag.length),
        pie: 'pendientes, en revisión o sin cerrar',
        tono: 'adv',
      },
      {
        rotulo: 'Otra patología',
        valor: String(otra.length),
        pie: otra.length ? otra.map((c) => `#${c.codigo}`).join(', ') : 'ningún caso',
        tono: 'neutro',
      },
    ],
    secciones: [
      {
        tipo: 'tabla',
        id: 'matriz',
        titulo: 'Preliminar frente a resultado técnico',
        subtitulo: 'filas: preliminar · columnas: técnico',
        ancho: 'completo',
        columnas: [
          { clave: 'preliminar', titulo: 'Preliminar' },
          ...columnasRes.map((r) => ({
            clave: r,
            titulo: RESULTADO[r]!,
            alinear: 'derecha' as const,
          })),
        ],
        filas: filasPre.map(([nombre, es]) => ({
          preliminar: nombre,
          ...Object.fromEntries(
            columnasRes.map((r) => {
              const v = l.filter((c) => es(c) && resultadoDe(c) === r).length
              return [r, v || '—']
            }),
          ),
        })),
      },
      {
        tipo: 'barras',
        id: 'rangos',
        titulo: 'Coincidencia de síntomas',
        subtitulo: 'casos por rango',
        ancho: 'mitad',
        items: rangos.map(([etiqueta, en]) => {
          const v = porcentajes.filter(en).length
          return { etiqueta, valor: v, texto: plural(v, 'caso', 'casos') }
        }),
        nota: `Porcentaje de coincidencia de síntomas de la categoría sugerida · ${plural(conCat.length, 'caso', 'casos')} con categoría.`,
      },
      {
        tipo: 'barras',
        id: 'categorias',
        titulo: 'Casos por categoría preliminar',
        subtitulo: 'total · confirmados',
        ancho: 'mitad',
        items: CATEGORIAS.map((cat) => {
          const de = l.filter((c) => categoriaPreliminar(c) === cat)
          const conf = de.filter((c) => resultadoDe(c) === 'CONFIRMADO').length
          return {
            etiqueta: CATEGORIA[cat],
            valor: de.length,
            texto: `${de.length} · ${conf} conf.`,
            categoria: cat,
          }
        }),
      },
      {
        tipo: 'barras',
        id: 'media-categoria',
        titulo: 'Coincidencia media por categoría',
        subtitulo: 'porcentaje',
        ancho: 'mitad',
        items: CATEGORIAS.map((cat) => {
          const ps = conCat
            .filter((c) => c.preliminar!.categoria === cat)
            .map((c) => c.preliminar!.porcentaje ?? 0)
          const m = Math.round(promedio(ps))
          return {
            etiqueta: CATEGORIA[cat],
            valor: ps.length ? m : 0,
            texto: ps.length ? `${m} %` : '—',
            categoria: cat,
          }
        }),
        nota: noIdent
          ? `Las ${plural(noIdent, 'no identificada', 'no identificadas')} no tienen porcentaje.`
          : undefined,
      },
      {
        tipo: 'tabla',
        id: 'principal',
        titulo: 'Casos con coincidencia de síntomas menor a 70 %',
        subtitulo: 'revisar el cuestionario',
        ancho: 'completo',
        columnas: [
          { clave: 'caso', titulo: 'Caso' },
          { clave: 'recibido', titulo: 'Recibido' },
          { clave: 'productor', titulo: 'Productor' },
          { clave: 'preliminar', titulo: 'Preliminar' },
          { clave: 'coincidencia', titulo: 'Coincid.', alinear: 'derecha' },
          { clave: 'estado', titulo: 'Estado' },
          { clave: 'resultado', titulo: 'Resultado técnico' },
        ],
        filas: bajos.map((c) => ({
          ...filaCaso(c),
          preliminar: CATEGORIA[c.preliminar!.categoria!],
          coincidencia: `${c.preliminar!.porcentaje} %`,
          resultado: RESULTADO[resultadoDe(c)]!,
        })),
        porPagina: 10,
        sustantivo: 'casos',
        vacio: 'Ningún caso con coincidencia menor a 70 % en el periodo.',
      },
    ],
  }
}

// ── R3 · Alertas epidemiológicas ──────────────────────────────────────────────────────
const decision = (a: AlertaFixture) =>
  a.descarte
    ? { por: a.descarte.por, en: a.descarte.en }
    : a.confirmada_por && a.confirmada_en
      ? { por: a.confirmada_por, en: a.confirmada_en }
      : null

function alertasFiltradas(f: FiltrosReporte) {
  const { desde, hasta } = rangoPeriodo(f)
  const estados = lista(f.estado_alerta)
  return alertas.filter((a) => {
    const d = dia(a.generada_en)
    if (d < desde || d > hasta) return false
    if (estados.length && !estados.includes(a.estado)) return false
    if (f.vereda && a.vereda !== f.vereda) return false
    const dec = decision(a)
    if (f.decidida === 'sin' && dec) return false
    if (f.decidida && f.decidida !== 'sin' && dec?.por.id !== f.decidida) return false
    if (f.casos_min && a.casos.length < Number(f.casos_min)) return false
    if (f.comunicada === 'si' && a.estado !== 'COMUNICADA') return false
    if (f.comunicada === 'sin_comunicar' && a.estado !== 'CONFIRMADA') return false
    return true
  })
}

function reporteAlertas(f: FiltrosReporte): ReporteDatos {
  const l = [...alertasFiltradas(f)].sort((a, b) => b.generada_en.localeCompare(a.generada_en))
  const { hasta } = rangoPeriodo(f)
  const mesHasta = hasta.slice(0, 7)
  const n = (e: string) => l.filter((a) => a.estado === e).length
  const decididas = l.filter((a) => decision(a))
  const dias = decididas.map((a) => (ms(decision(a)!.en) - ms(a.generada_en)) / DIA)
  const avisados = l.reduce((s, a) => s + (a.productores_notificados ?? 0), 0)
  const porMes = new Map<string, number>()
  for (const a of l)
    porMes.set(a.generada_en.slice(0, 7), (porMes.get(a.generada_en.slice(0, 7)) ?? 0) + 1)
  const trips = parametros.find((p) => p.categoria === 'TRIPS')!
  const descartadas = l.filter((a) => a.estado === 'DESCARTADA')
  const sinRevisar = l.filter((a) => a.estado === 'GENERADA')
  return {
    tipo: 'alertas',
    titulo: 'Reporte de alertas epidemiológicas',
    subtitulo: `${textoRango(f, []).split(' · ')[0]} · posibles concentraciones de casos confirmados de Trips`,
    total: l.length,
    sustantivo: 'alertas',
    kpis: [
      {
        rotulo: 'Alertas generadas',
        valor: String(l.length),
        pie: `${l.filter((a) => a.generada_en.slice(0, 7) === mesHasta).length} en ${MESES_LARGOS[Number(mesHasta.slice(5)) - 1]}`,
        tono: 'adv',
      },
      {
        rotulo: 'Sin decisión',
        valor: String(n('GENERADA') + n('EN_REVISION')),
        pie: `${n('GENERADA')} generada · ${n('EN_REVISION')} en revisión`,
        tono: 'revision',
      },
      {
        rotulo: 'Confirmadas',
        valor: String(n('CONFIRMADA') + n('COMUNICADA')),
        pie: `${n('COMUNICADA')} ya comunicadas`,
        tono: 'peligro',
      },
      {
        rotulo: 'Días hasta decidir',
        valor: decimal(promedio(dias)),
        pie: 'promedio de las alertas decididas',
        tono: 'neutro',
      },
      {
        rotulo: 'Productores avisados',
        valor: String(avisados),
        pie: 'mensajes de WhatsApp enviados',
        tono: 'ok',
      },
    ],
    secciones: [
      {
        tipo: 'barras',
        id: 'estados',
        titulo: 'Alertas por estado',
        subtitulo: plural(l.length, 'alerta', 'alertas'),
        ancho: 'mitad',
        items: Object.entries(ALERTA).map(([e, nombre]) => ({ etiqueta: nombre, valor: n(e) })),
      },
      {
        tipo: 'barras',
        id: 'embudo',
        titulo: 'De la detección al aviso',
        subtitulo: 'alertas',
        ancho: 'mitad',
        items: [
          { etiqueta: 'Generadas por el sistema', valor: l.length },
          {
            etiqueta: 'Revisadas por el líder',
            valor: l.filter((a) => a.estado !== 'GENERADA').length,
          },
          { etiqueta: 'Confirmadas', valor: n('CONFIRMADA') + n('COMUNICADA') },
          { etiqueta: 'Comunicadas a productores', valor: n('COMUNICADA') },
        ],
        nota:
          [
            descartadas.length
              ? `${plural(descartadas.length, 'descartada', 'descartadas')} (${descartadas.map((a) => `${a.id}: ${a.descarte?.motivo.toLowerCase()}`).join('; ')})`
              : '',
            sinRevisar.length
              ? `${plural(sinRevisar.length, 'sin revisar', 'sin revisar')} (${sinRevisar.map((a) => a.id).join(', ')})`
              : '',
          ]
            .filter(Boolean)
            .join(' · ') || undefined,
      },
      {
        tipo: 'tabla',
        id: 'veredas',
        titulo: 'Alertas por vereda',
        ancho: 'mitad',
        columnas: [
          { clave: 'vereda', titulo: 'Vereda' },
          { clave: 'alertas', titulo: 'Alertas', alinear: 'derecha' },
          { clave: 'confirmadas', titulo: 'Confirm.', alinear: 'derecha' },
          { clave: 'descartadas', titulo: 'Descart.', alinear: 'derecha' },
          { clave: 'casos', titulo: 'Casos', alinear: 'derecha' },
        ],
        filas: VEREDAS.map((v) => {
          const de = l.filter((a) => a.vereda === v)
          return {
            vereda: VEREDA[v],
            alertas: de.length,
            confirmadas: de.filter((a) => ['CONFIRMADA', 'COMUNICADA'].includes(a.estado)).length,
            descartadas: de.filter((a) => a.estado === 'DESCARTADA').length,
            casos: de.reduce((s, a) => s + a.casos.length, 0),
          }
        }),
      },
      {
        tipo: 'barras',
        id: 'meses',
        titulo: 'Alertas por mes',
        subtitulo: 'generadas',
        ancho: 'mitad',
        items: [...porMes.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([m, v]) => ({
            etiqueta: `${MESES_LARGOS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`,
            valor: v,
          })),
      },
      {
        tipo: 'tabla',
        id: 'principal',
        titulo: 'Detalle de alertas',
        ancho: 'completo',
        columnas: [
          { clave: 'alerta', titulo: 'Alerta' },
          { clave: 'detectada', titulo: 'Detectada' },
          { clave: 'vereda', titulo: 'Vereda' },
          { clave: 'casos', titulo: 'Casos', alinear: 'derecha' },
          { clave: 'estado', titulo: 'Estado' },
          { clave: 'decidio', titulo: 'Decidió' },
          { clave: 'respuesta', titulo: 'Respuesta' },
          { clave: 'avisados', titulo: 'Avisados', alinear: 'derecha' },
        ],
        filas: l.map((a) => {
          const dec = decision(a)
          const dd = dec ? Math.max(1, Math.round((ms(dec.en) - ms(a.generada_en)) / DIA)) : null
          return {
            _alerta: a.id,
            alerta: a.id,
            detectada: fechaCorta(a.generada_en),
            vereda: VEREDA[a.vereda],
            casos: a.casos.length,
            estado: ALERTA[a.estado]!,
            decidio: dec?.por.nombre ?? a.revisa?.nombre ?? '—',
            respuesta: dd === null ? '—' : plural(dd, 'día', 'días'),
            avisados:
              a.estado === 'CONFIRMADA' ? '0 · falta comunicar' : (a.productores_notificados ?? 0),
          }
        }),
        porPagina: 10,
        sustantivo: 'alertas',
        vacio: 'Ninguna alerta coincide con los filtros.',
      },
      {
        tipo: 'datos',
        id: 'parametros',
        titulo: 'Parámetros vigentes',
        ancho: 'completo',
        items: [
          { termino: 'Categoría que participa', valor: 'Trips' },
          { termino: 'Mínimo de casos', valor: `${trips.num_casos} casos confirmados` },
          { termino: 'Distancia máxima', valor: `${decimal(trips.distancia_km)} km` },
          { termino: 'Intervalo', valor: `${trips.intervalo_dias} días hacia atrás` },
          {
            termino: 'Última modificación',
            valor: trips.actualizado_en
              ? `${fechaCorta(trips.actualizado_en)} · ${trips.actualizado_por?.nombre}`
              : '—',
          },
        ],
        nota: 'Botrytis, Roña, Fusarium y Deficiencia de magnesio no participan en las alertas.',
      },
    ],
  }
}

// ── R4 · Productores, fincas y chatbot ────────────────────────────────────────────────
function reporteProductores(f: FiltrosReporte): ReporteDatos {
  const { desde, hasta } = rangoPeriodo(f)
  const estados = lista(f.estado_productor)
  const especies = lista(f.especie)
  const tipos = lista(f.tipo_cultivo)
  const casosPeriodo = casos.filter((c) => {
    const d = dia(fechaCaso(c))
    return d >= desde && d <= hasta
  })
  const casosDe = (id: string) => casosPeriodo.filter((c) => c.productor.id === id)
  const fincasDe = (id: string) => fincas.filter((x) => x.productor_id === id)
  const l = productores.filter((p) => {
    if (estados.length && !estados.includes(p.activo ? 'activo' : 'deshabilitado')) return false
    if (f.registrado_desde && dia(p.registrado_en) < f.registrado_desde) return false
    if (f.registrado_hasta && dia(p.registrado_en) > f.registrado_hasta) return false
    if (f.vereda && !p.fincas.some((x) => x.vereda === f.vereda)) return false
    const cultivos = fincasDe(p.id).flatMap((x) => x.cultivos)
    if (tipos.length && !cultivos.some((c) => tipos.includes(c.tipo))) return false
    if (especies.length && !cultivos.some((c) => c.especies.some((e) => especies.includes(e))))
      return false
    const n = casosDe(p.id).length
    if (f.casos_desde && n < Number(f.casos_desde)) return false
    if (f.casos_hasta && n > Number(f.casos_hasta)) return false
    if (
      f.con_activos &&
      !casos.some(
        (c) =>
          c.productor.id === p.id &&
          ['PENDIENTE_REVISION', 'EN_REVISION', 'REGISTRADO'].includes(c.estado),
      )
    )
      return false
    const diasConsulta = p.ultima_consulta_en
      ? (Date.now() - ms(p.ultima_consulta_en)) / DIA
      : Infinity
    if (f.chatbot === '30' && diasConsulta > 30) return false
    if (f.chatbot === '90' && diasConsulta <= 90) return false
    if (f.chatbot === 'abandono' && Number(p.celular.slice(-1)) % 2 !== 0) return false
    return true
  })
  const susFincas = fincas.filter((x) => l.some((p) => p.id === x.productor_id))
  const cultivos = susFincas.flatMap((x) => x.cultivos)
  const susCasos = casosPeriodo.filter((c) => l.some((p) => p.id === c.productor.id))
  const conCasos = l.filter((p) => casosDe(p.id).length > 0)
  const sinCasos = l.filter((p) => casosDe(p.id).length === 0)
  // Uso del chatbot (demostración): las conversaciones se derivan de los casos creados.
  const creados = susCasos.length
  const enviados = susCasos.filter((c) => c.enviado_a_panel_en).length
  const abandonadas = Math.round(creados * 0.28)
  const conversaciones = creados + abandonadas
  const ranking = [...l]
    .map((p) => ({
      p,
      n: casosDe(p.id).length,
      ultimo: casosDe(p.id).map(fechaCaso).sort().at(-1),
    }))
    .sort((a, b) => b.n - a.n || a.p.nombre.localeCompare(b.p.nombre))
  return {
    tipo: 'productores',
    titulo: 'Reporte de productores, fincas y chatbot',
    subtitulo: `${textoRango(f, []).split(' · ')[0]} · ${plural(l.length, 'productor', 'productores')} · ${plural(susFincas.length, 'finca', 'fincas')} · ${plural(cultivos.length, 'cultivo', 'cultivos')}`,
    total: l.length,
    sustantivo: 'productores',
    kpis: [
      {
        rotulo: 'Productores',
        valor: String(l.length),
        pie: `${l.filter((p) => p.activo).length} activos · ${l.filter((p) => !p.activo).length} deshabilitados`,
        tono: 'info',
      },
      {
        rotulo: 'Con casos en el periodo',
        valor: String(conCasos.length),
        pie: `de ${plural(l.length, 'productor', 'productores')}`,
        tono: 'adv',
      },
      {
        rotulo: 'Fincas',
        valor: String(susFincas.length),
        pie: `en ${plural(new Set(susFincas.map((x) => x.vereda)).size, 'vereda', 'veredas')}`,
        tono: 'ok',
      },
      {
        rotulo: 'Cultivos',
        valor: String(cultivos.length),
        pie: 'gulupa, granadilla y maracuyá',
        tono: 'revision',
      },
      {
        rotulo: 'Conversaciones',
        valor: String(conversaciones),
        pie: 'con el chatbot de WhatsApp',
        tono: 'neutro',
      },
    ],
    secciones: [
      {
        tipo: 'barras',
        id: 'chatbot',
        titulo: 'Uso del chatbot de WhatsApp',
        subtitulo: 'conversaciones del periodo (demostración)',
        ancho: 'mitad',
        items: [
          { etiqueta: 'Conversaciones iniciadas', valor: conversaciones },
          {
            etiqueta: 'Con el cuestionario completo',
            valor: conversaciones - Math.round(abandonadas * 0.8),
          },
          { etiqueta: 'Casos creados', valor: creados },
          { etiqueta: 'Enviados al panel', valor: enviados },
        ],
        nota: `${plural(abandonadas, 'conversación abandonada', 'conversaciones abandonadas')} · ${plural(susCasos.filter((c) => c.estado === 'DESCARTADO').length, 'descartado', 'descartados')} por el chatbot.`,
      },
      {
        tipo: 'barras',
        id: 'veredas',
        titulo: 'Fincas y casos por vereda',
        ancho: 'mitad',
        items: VEREDAS.map((v) => {
          const nf = susFincas.filter((x) => x.vereda === v).length
          const nc = susCasos.filter((c) => c.finca.vereda === v).length
          return {
            etiqueta: VEREDA[v],
            valor: nc,
            texto: `${plural(nf, 'finca', 'fincas')} · ${plural(nc, 'caso', 'casos')}`,
          }
        }),
      },
      {
        tipo: 'barras',
        id: 'especies',
        titulo: 'Cultivos por especie',
        ancho: 'mitad',
        items: ESPECIES.map((e) => {
          const v = cultivos.filter((c) => c.especies.includes(e)).length
          return { etiqueta: ESPECIE[e], valor: v, texto: plural(v, 'cultivo', 'cultivos') }
        }),
        nota: `${plural(cultivos.length, 'cultivo', 'cultivos')} · ${cultivos.filter((c) => c.tipo === 'CAMPO_ABIERTO').length} campo abierto · ${cultivos.filter((c) => c.tipo === 'INVERNADERO').length} invernadero. Un cultivo puede tener más de una especie.`,
      },
      {
        tipo: 'barras',
        id: 'estados',
        titulo: 'Estado de los productores',
        ancho: 'mitad',
        items: [
          { etiqueta: 'Activos', valor: l.filter((p) => p.activo).length },
          { etiqueta: 'Deshabilitados', valor: l.filter((p) => !p.activo).length },
          { etiqueta: 'Sin casos en el periodo', valor: sinCasos.length },
        ],
        nota: sinCasos.length
          ? `Sin casos en el periodo: ${sinCasos.map((p) => p.nombre).join(', ')}.`
          : undefined,
      },
      {
        tipo: 'tabla',
        id: 'principal',
        titulo: 'Productores con más casos',
        subtitulo: 'orden: más casos',
        ancho: 'completo',
        columnas: [
          { clave: 'productor', titulo: 'Productor' },
          { clave: 'vereda', titulo: 'Vereda' },
          { clave: 'finca', titulo: 'Finca' },
          { clave: 'casos', titulo: 'Casos', alinear: 'derecha' },
          { clave: 'ultimo', titulo: 'Último caso' },
          { clave: 'estado', titulo: 'Estado' },
        ],
        filas: ranking.map(({ p, n, ultimo }) => ({
          productor: p.nombre,
          vereda: p.fincas[0] ? VEREDA[p.fincas[0].vereda] : '—',
          finca: p.fincas.map((x) => x.nombre).join(', ') || '—',
          casos: n,
          ultimo: ultimo ? fechaCorta(ultimo) : '—',
          estado: p.activo ? 'Activo' : 'Deshabilitado',
        })),
        porPagina: 8,
        sustantivo: 'productores',
        vacio: 'Ningún productor coincide con los filtros.',
      },
    ],
  }
}

// ── R5 · Técnicos y carga de trabajo ──────────────────────────────────────────────────
function reporteTecnicos(f: FiltrosReporte): ReporteDatos {
  const { desde, hasta } = rangoPeriodo(f)
  const elegidos = lista(f.tecnicos)
  const casosPeriodo = casos.filter((c) => {
    const d = dia(fechaCaso(c))
    return d >= desde && d <= hasta
  })
  const de = (id: string) => casosPeriodo.filter((c) => c.tecnico?.id === id)
  const diasDe = (id: string) => promedio(diasRevision(de(id)))
  const l = usuarios.filter((u) => {
    if (elegidos.length && !elegidos.includes(u.id)) return false
    if (f.rol && u.rol !== f.rol) return false
    if (f.estado_cuenta === 'activa' && !u.activo) return false
    if (f.estado_cuenta === 'deshabilitada' && u.activo) return false
    const d = diasDe(u.id)
    if (f.dias_desde && !(d >= Number(f.dias_desde.replace(',', '.')))) return false
    if (f.dias_hasta && !(d <= Number(f.dias_hasta.replace(',', '.')))) return false
    if (f.con_pendientes && !de(u.id).some((c) => c.estado === 'EN_REVISION')) return false
    if (f.con_extensiones && !de(u.id).some((c) => c.conservacion_extendida)) return false
    return true
  })
  const enviados = casosPeriodo.filter((c) => c.enviado_a_panel_en)
  const asignados = enviados.filter((c) => c.tecnico)
  const sinTecnico = casosPeriodo.filter((c) => c.estado === 'PENDIENTE_REVISION')
  const registrados = casosPeriodo.filter((c) => c.estado === 'REGISTRADO')
  const susCasos = casosPeriodo.filter((c) => l.some((u) => u.id === c.tecnico?.id))
  const extensiones = susCasos.filter((c) => c.conservacion_extendida)
  const conCasos = l.filter((u) => de(u.id).length > 0)
  const rol = (r: string) => (r === 'LIDER_TECNICO' ? 'Líder técnico' : 'Técnico')
  const desglose = (id: string) =>
    (['EN_REVISION', 'REGISTRADO', 'CERRADO'] as EstadoCaso[])
      .map((e) => [ESTADO[e].toLowerCase(), de(id).filter((c) => c.estado === e).length] as const)
      .filter(([, v]) => v > 0)
      .map(([e, v]) => `${e} ${v}`)
      .join(' · ')
  return {
    tipo: 'tecnicos',
    titulo: 'Reporte de técnicos y carga de trabajo',
    subtitulo: `${textoRango(f, casosPeriodo)} · ${plural(asignados.length, 'caso asignado', 'casos asignados')}`,
    total: l.length,
    sustantivo: 'cuentas',
    kpis: [
      {
        rotulo: 'Técnicos con casos',
        valor: String(conCasos.length),
        pie: `${l.filter((u) => u.activo).length} cuentas activas · ${l.filter((u) => !u.activo).length} deshabilitadas`,
        tono: 'info',
      },
      {
        rotulo: 'Casos asignados',
        valor: String(asignados.length),
        pie: `de ${enviados.length} enviados al panel`,
        tono: 'ok',
      },
      {
        rotulo: 'Pendientes sin técnico',
        valor: String(sinTecnico.length),
        pie: sinTecnico.map((c) => `#${c.codigo}`).join(' y ') || 'ninguno',
        tono: 'adv',
      },
      {
        rotulo: 'Días de revisión',
        valor: decimal(promedio(diasRevision(susCasos))),
        pie: 'promedio del equipo',
        tono: 'info',
      },
      {
        rotulo: 'Registrados sin cerrar',
        valor: String(registrados.length),
        pie:
          registrados.map((c) => `#${c.codigo} · ${c.tecnico?.nombre ?? '—'}`).join(', ') ||
          'ninguno',
        tono: 'revision',
      },
    ],
    secciones: [
      {
        tipo: 'barras',
        id: 'carga',
        titulo: 'Carga por técnico',
        subtitulo: 'casos del periodo por estado',
        ancho: 'completo',
        items: l.map((u) => ({
          etiqueta: `${u.nombre} · ${rol(u.rol)}`,
          valor: de(u.id).length,
          texto: de(u.id).length
            ? `${plural(de(u.id).length, 'caso', 'casos')} · ${desglose(u.id)}`
            : '0 casos',
        })),
        nota: sinTecnico.length
          ? `${plural(sinTecnico.length, 'caso pendiente', 'casos pendientes')} sin técnico (${sinTecnico.map((c) => `#${c.codigo}`).join(', ')}).`
          : undefined,
      },
      {
        tipo: 'barras',
        id: 'tiempos',
        titulo: 'Tiempo medio de revisión',
        subtitulo: 'días',
        ancho: 'mitad',
        items: l
          .filter((u) => de(u.id).some((c) => diagnosticoDe(c)))
          .map((u) => ({
            etiqueta: u.nombre,
            valor: diasDe(u.id),
            texto: `${decimal(diasDe(u.id))} días`,
          })),
        nota: `Desde la llegada al panel hasta el diagnóstico técnico. Promedio del equipo: ${decimal(promedio(diasRevision(susCasos)))} días.`,
      },
      {
        tipo: 'barras',
        id: 'actividad',
        titulo: 'Actividad del equipo',
        ancho: 'mitad',
        items: [
          {
            etiqueta: 'Diagnósticos registrados',
            valor: susCasos.filter((c) => diagnosticoDe(c)).length,
          },
          {
            etiqueta: 'Casos cerrados',
            valor: susCasos.filter((c) => c.estado === 'CERRADO').length,
          },
          {
            etiqueta: 'Extensiones de conservación',
            valor: extensiones.length,
            texto: extensiones.length
              ? `${extensiones.length} · ${extensiones.map((c) => `#${c.codigo}`).join(', ')}`
              : '0',
          },
        ],
      },
      {
        tipo: 'tabla',
        id: 'principal',
        titulo: 'Resumen por cuenta',
        ancho: 'completo',
        columnas: [
          { clave: 'tecnico', titulo: 'Técnico' },
          { clave: 'cuenta', titulo: 'Cuenta' },
          { clave: 'asignados', titulo: 'Asignados', alinear: 'derecha' },
          { clave: 'revision', titulo: 'En revisión', alinear: 'derecha' },
          { clave: 'registrados', titulo: 'Registrados', alinear: 'derecha' },
          { clave: 'cerrados', titulo: 'Cerrados', alinear: 'derecha' },
          { clave: 'extensiones', titulo: 'Extensiones', alinear: 'derecha' },
        ],
        filas: l.map((u) => ({
          tecnico: u.nombre,
          cuenta: u.activo ? 'Activa' : 'Deshabilitada',
          asignados: de(u.id).length,
          revision: de(u.id).filter((c) => c.estado === 'EN_REVISION').length,
          registrados: de(u.id).filter((c) => c.estado === 'REGISTRADO').length,
          cerrados: de(u.id).filter((c) => c.estado === 'CERRADO').length,
          extensiones: de(u.id).filter((c) => c.conservacion_extendida).length,
        })),
        porPagina: 10,
        sustantivo: 'cuentas',
        vacio: 'Ninguna cuenta coincide con los filtros.',
      },
    ],
  }
}

const GENERADORES: Record<TipoReporte, (f: FiltrosReporte) => ReporteDatos> = {
  casos: reporteCasos,
  identificacion: reporteIdentificacion,
  alertas: reporteAlertas,
  productores: reporteProductores,
  tecnicos: reporteTecnicos,
}

// ── Resumen (pantalla 23) ─────────────────────────────────────────────────────────────
function resumen(f: FiltrosReporte): ResumenReportes {
  const l = casosFiltrados(f)
  const r1 = reporteCasos(f)
  const r2 = reporteIdentificacion(f)
  const r3 = reporteAlertas({
    periodo: f.periodo ?? '',
    desde: f.desde ?? '',
    hasta: f.hasta ?? '',
    vereda: f.vereda ?? '',
  })
  const r4 = reporteProductores({
    periodo: f.periodo ?? '',
    desde: f.desde ?? '',
    hasta: f.hasta ?? '',
  })
  const r5 = reporteTecnicos({
    periodo: f.periodo ?? '',
    desde: f.desde ?? '',
    hasta: f.hasta ?? '',
  })
  const kpi = (r: ReporteDatos, rotulo: string) => r.kpis.find((k) => k.rotulo === rotulo)!
  const confirmados = l.filter((c) => resultadoDe(c) === 'CONFIRMADO').length
  const alertasPer = alertasFiltradas({
    periodo: f.periodo ?? '',
    desde: f.desde ?? '',
    hasta: f.hasta ?? '',
    vereda: f.vereda ?? '',
  })
  const tecnicos = usuarios.filter((u) => l.some((c) => c.tecnico?.id === u.id))
  const casosTec = (id: string | null) =>
    l.filter((c) => (id ? c.tecnico?.id === id : !c.tecnico && c.enviado_a_panel_en))
  const kpis: KpiReporte[] = [
    {
      rotulo: 'Casos recibidos',
      valor: String(l.length),
      pie: `${new Set(l.map((c) => c.finca.vereda)).size} veredas · ${l.filter((c) => c.enviado_a_panel_en).length} enviados al panel`,
      tono: 'info',
    },
    {
      rotulo: 'Confirmados',
      valor: String(confirmados),
      pie: `${pct(confirmados, l.length)} % de los casos recibidos`,
      tono: 'ok',
    },
    {
      rotulo: 'Tiempo medio de revisión',
      valor: `${decimal(promedio(diasRevision(l)))} días`,
      pie: 'de la recepción al diagnóstico técnico',
      tono: 'revision',
    },
    {
      rotulo: 'Pendientes de revisión',
      valor: String(l.filter((c) => c.estado === 'PENDIENTE_REVISION').length),
      pie: 'sin técnico asignado',
      tono: 'adv',
    },
    {
      rotulo: 'Alertas del periodo',
      valor: String(alertasPer.length),
      pie:
        Object.entries(ALERTA)
          .map(
            ([e, n]) => [alertasPer.filter((a) => a.estado === e).length, n.toLowerCase()] as const,
          )
          .filter(([v]) => v > 0)
          .map(([v, n]) => `${v} ${n}`)
          .join(' · ') || 'ninguna',
      tono: 'peligro',
    },
  ]
  const secciones: SeccionReporte[] = [
    {
      tipo: 'barras',
      id: 'categorias',
      titulo: 'Casos por categoría fitosanitaria',
      subtitulo: 'categoría de la identificación preliminar · «conf.» = confirmados por el técnico',
      ancho: 'mitad',
      items: [
        ...CATEGORIAS.map((cat) => {
          const de = l.filter((c) => categoriaPreliminar(c) === cat)
          const conf = de.filter((c) => resultadoDe(c) === 'CONFIRMADO').length
          return {
            etiqueta: CATEGORIA[cat],
            valor: de.length,
            texto: `${de.length} · ${conf} conf.`,
            categoria: cat,
          }
        }),
        {
          etiqueta: 'No identificada',
          valor: l.filter((c) => categoriaPreliminar(c) === 'NO_IDENTIFICADA').length,
          texto: `${l.filter((c) => categoriaPreliminar(c) === 'NO_IDENTIFICADA').length} · 0 conf.`,
          categoria: null,
        },
      ],
      nota: 'Cada categoría tiene su forma: triángulo, círculo, rombo, cruz y cuadrado.',
    },
    {
      ...(r1.secciones.find((s) => s.id === 'semanas') as SeccionReporte),
      titulo: 'Casos recibidos por semana',
    },
    {
      tipo: 'tabla',
      id: 'veredas',
      titulo: 'Casos por vereda',
      ancho: 'mitad',
      columnas: [
        { clave: 'vereda', titulo: 'Vereda' },
        { clave: 'casos', titulo: 'Casos', alinear: 'derecha' },
        { clave: 'confirmados', titulo: 'Confirmados', alinear: 'derecha' },
        { clave: 'porcentaje', titulo: '% confirm.', alinear: 'derecha' },
        { clave: 'principal', titulo: 'Categoría principal' },
      ],
      filas: VEREDAS.map((v) => {
        const de = l.filter((c) => c.finca.vereda === v)
        const conf = de.filter((c) => resultadoDe(c) === 'CONFIRMADO').length
        const top = CATEGORIAS.map(
          (cat) => [cat, de.filter((c) => c.preliminar?.categoria === cat).length] as const,
        ).sort((a, b) => b[1] - a[1])[0]
        return {
          vereda: VEREDA[v],
          casos: de.length,
          confirmados: conf,
          porcentaje: `${pct(conf, de.length)} %`,
          principal: top && top[1] > 0 ? CATEGORIA[top[0]] : '—',
        }
      }),
    },
    {
      tipo: 'tabla',
      id: 'carga',
      titulo: 'Carga por técnico',
      ancho: 'mitad',
      columnas: [
        { clave: 'tecnico', titulo: 'Técnico' },
        { clave: 'asignados', titulo: 'Asignados', alinear: 'derecha' },
        { clave: 'pendientes', titulo: 'Pendientes', alinear: 'derecha' },
        { clave: 'cerrados', titulo: 'Cerrados', alinear: 'derecha' },
        { clave: 'tiempo', titulo: 'Tiempo medio', alinear: 'derecha' },
      ],
      filas: [
        ...tecnicos.map((u) => ({
          tecnico: u.nombre,
          asignados: casosTec(u.id).length,
          pendientes: casosTec(u.id).filter((c) => c.estado === 'EN_REVISION').length,
          cerrados: casosTec(u.id).filter((c) => c.estado === 'CERRADO').length,
          tiempo: `${decimal(promedio(diasRevision(casosTec(u.id))))} días`,
        })),
        {
          tecnico: 'Sin asignar',
          asignados: casosTec(null).length,
          pendientes: casosTec(null).length,
          cerrados: '—',
          tiempo: '—',
        },
      ],
    },
  ]
  const destacados: Record<TipoReporte, string[]> = {
    casos: [
      `${r1.kpis[0]!.valor} recibidos`,
      `${l.filter((c) => ['PENDIENTE_REVISION', 'EN_REVISION', 'REGISTRADO'].includes(c.estado)).length} activos`,
      `${kpis[2]!.valor} de revisión media`,
    ],
    identificacion: [
      `${kpi(r2, 'El técnico confirmó la categoría').valor} coincide con el técnico`,
      `${kpi(r2, 'Coincidencia media de síntomas').valor} coincidencia media`,
      `${r2.kpis[0]!.pie.split(' · ')[1]}`,
    ],
    alertas: [
      `${r3.total} en el periodo`,
      `${kpi(r3, 'Sin decisión').valor} por revisar`,
      `${kpi(r3, 'Productores avisados').valor} productores avisados`,
    ],
    productores: [
      `${productores.filter((p) => p.activo).length} de ${productores.length} productores activos`,
      `${kpi(r4, 'Cultivos').valor} cultivos`,
      `${kpi(r4, 'Conversaciones').valor} conversaciones`,
    ],
    tecnicos: [
      `${kpi(r5, 'Técnicos con casos').valor} técnicos con casos`,
      `${kpi(r5, 'Pendientes sin técnico').valor} pendientes sin técnico`,
      `${kpi(r5, 'Registrados sin cerrar').valor} registrados sin cerrar`,
    ],
  }
  const DESCRIPCION: Record<TipoReporte, string> = {
    casos:
      'Cuántos casos llegan, en qué estado están, por vereda y especie, y cuánto tarda cada paso.',
    identificacion:
      'Compara la categoría sugerida por el sistema con el diagnóstico técnico y la coincidencia de síntomas.',
    alertas:
      'Alertas generadas, decisiones del líder técnico, tiempos de respuesta y productores avisados.',
    productores:
      'Productores activos, fincas y cultivos por especie, productores con más casos y uso del chatbot.',
    tecnicos:
      'Casos asignados, pendientes y cerrados por técnico, tiempos de revisión y extensiones de conservación.',
  }
  return {
    subtitulo: `Resumen de casos, categorías fitosanitarias y carga de trabajo · ${textoRango(f, l)}`,
    total: l.length,
    sustantivo: 'casos',
    kpis,
    reportes: (Object.keys(GENERADORES) as TipoReporte[]).map((tipo) => ({
      tipo,
      titulo: REPORTES[tipo].titulo,
      descripcion: DESCRIPCION[tipo],
      destacados: destacados[tipo],
    })),
    secciones,
  }
}

function filtrosDe(request: Request): FiltrosReporte {
  return Object.fromEntries(new URL(request.url).searchParams.entries())
}

function soloLider(request: Request) {
  const u = usuarioActual(request)
  if (!u) return noAutenticado()
  if (u.rol !== 'LIDER_TECNICO') {
    return errorApi(403, 'SOLO_LIDER', 'Los reportes son del líder técnico.')
  }
  return null
}

/** Valida el rango (Desde y Hasta obligatorios en «Personalizado», máximo 12 meses). */
function validarPeriodo(f: FiltrosReporte) {
  const { desde, hasta } = rangoPeriodo(f)
  if (desde > hasta) return 'La fecha «Desde» no puede ser posterior a «Hasta».'
  if (ms(`${hasta}T12:00:00Z`) - ms(`${desde}T12:00:00Z`) > 366 * DIA) {
    return 'El rango máximo es de 12 meses.'
  }
  return null
}

const conResultado = (c: ConsultaFixture): ConsultaGuardada => {
  const r = GENERADORES[c.tipo](c.filtros)
  return { ...c, resultado: plural(r.total, r.sustantivo.replace(/s$/, ''), r.sustantivo) }
}

export const reportesHandlers = [
  http.get(`${API}/reportes/resumen`, ({ request }) => {
    const bloqueo = soloLider(request)
    if (bloqueo) return bloqueo
    const f = filtrosDe(request)
    const error = validarPeriodo(f)
    if (error) return errorApi(422, 'PERIODO_INVALIDO', error)
    return HttpResponse.json(resumen(f))
  }),

  http.get(`${API}/reportes/consultas`, ({ request }) => {
    const bloqueo = soloLider(request)
    if (bloqueo) return bloqueo
    return HttpResponse.json(consultas.map(conResultado))
  }),

  // Guardar consulta (F5): nombre de 5 a 60 caracteres, reporte, visibilidad y envío.
  http.post(`${API}/reportes/consultas`, async ({ request }) => {
    const u = usuarioActual(request)
    const bloqueo = soloLider(request)
    if (bloqueo) return bloqueo
    const b = (await request.json()) as Partial<ConsultaGuardada>
    const campos: Record<string, string> = {}
    const nombre = b.nombre?.trim() ?? ''
    if (nombre.length < 5 || nombre.length > 60)
      campos.nombre = 'Escribe un nombre de 5 a 60 caracteres.'
    if (!esTipoReporte(b.tipo)) campos.tipo = 'Elige el reporte.'
    if (b.envio && b.envio.frecuencia !== 'no') {
      const correos = b.envio.correos ?? []
      if (!correos.length || correos.some((c) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c))) {
        campos.correos = 'Escribe uno o más correos válidos separados por coma.'
      }
    }
    if (Object.keys(campos).length)
      return errorApi(422, 'VALIDACION', 'Revisa los campos marcados.', campos)
    const nueva: ConsultaFixture = {
      id: `cg-${Date.now()}`,
      nombre,
      tipo: b.tipo as TipoReporte,
      descripcion: b.descripcion?.trim() || REPORTES[b.tipo as TipoReporte].titulo,
      filtros: b.filtros ?? {},
      visibilidad: b.visibilidad === 'yo' ? 'yo' : 'equipo',
      envio: b.envio && b.envio.frecuencia !== 'no' ? b.envio : null,
      creada_por: u!.nombre,
    }
    consultas.unshift(nueva)
    return HttpResponse.json(conResultado(nueva), { status: 201 })
  }),

  http.delete(`${API}/reportes/consultas/:id`, ({ request, params }) => {
    const bloqueo = soloLider(request)
    if (bloqueo) return bloqueo
    const i = consultas.findIndex((c) => c.id === params.id)
    if (i < 0) return errorApi(404, 'NO_ENCONTRADO', 'La consulta no existe.')
    consultas.splice(i, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API}/reportes/:tipo`, ({ request, params }) => {
    const bloqueo = soloLider(request)
    if (bloqueo) return bloqueo
    const tipo = String(params.tipo)
    if (!esTipoReporte(tipo)) return errorApi(404, 'NO_ENCONTRADO', 'El reporte no existe.')
    const f = filtrosDe(request)
    const error = validarPeriodo(f)
    if (error) return errorApi(422, 'PERIODO_INVALIDO', error)
    return HttpResponse.json(GENERADORES[tipo](f))
  }),
]
