// Utilidades del feature "reportes": periodos, reportes del índice y etiquetas de filtros.
// Las usa también el mock de la API (mocks/handlers/reportes.ts) para resolver el periodo.
import { CATEGORIA_LABEL, ESPECIE_LABEL, VEREDA_LABEL, etiqueta } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { formatearFechaEntrada } from '@/utils/fechas'
import type { FiltrosReporte, PanelFiltros, TipoReporte } from './types'

export const REPORTES: Record<
  TipoReporte,
  { codigo: string; titulo: string; ruta: string; panel: PanelFiltros }
> = {
  casos: { codigo: 'R1', titulo: 'Casos y estados', ruta: 'casos', panel: 'general' },
  identificacion: {
    codigo: 'R2',
    titulo: 'Identificación preliminar y diagnóstico',
    ruta: 'identificacion',
    panel: 'general',
  },
  alertas: { codigo: 'R3', titulo: 'Alertas epidemiológicas', ruta: 'alertas', panel: 'alertas' },
  productores: {
    codigo: 'R4',
    titulo: 'Productores, fincas y chatbot',
    ruta: 'productores',
    panel: 'productores',
  },
  tecnicos: {
    codigo: 'R5',
    titulo: 'Técnicos y carga de trabajo',
    ruta: 'tecnicos',
    panel: 'tecnicos',
  },
}

export const TIPOS_REPORTE = Object.keys(REPORTES) as TipoReporte[]

export const esTipoReporte = (t: string | undefined): t is TipoReporte =>
  !!t && (TIPOS_REPORTE as string[]).includes(t)

export const PANELES: Record<PanelFiltros, { codigo: string; titulo: string; aplica: string }> = {
  general: {
    codigo: 'F1',
    titulo: 'Filtros generales',
    aplica: 'Se aplican a los reportes de casos y de identificación preliminar.',
  },
  alertas: {
    codigo: 'F2',
    titulo: 'Filtros de alertas',
    aplica: 'Se aplican al reporte de alertas epidemiológicas.',
  },
  productores: {
    codigo: 'F3',
    titulo: 'Filtros de productores',
    aplica: 'Se aplican al reporte de productores, fincas y chatbot.',
  },
  tecnicos: {
    codigo: 'F4',
    titulo: 'Filtros de técnicos',
    aplica: 'Se aplican al reporte de técnicos y carga de trabajo.',
  },
}

export const PERIODOS = [
  { valor: '7d', etiqueta: 'Últimos 7 días' },
  { valor: '30d', etiqueta: 'Últimos 30 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'anio', etiqueta: 'Este año' },
  { valor: 'personalizado', etiqueta: 'Personalizado' },
] as const

/** Periodo predeterminado: este año (los datos de demostración son de 2026). */
export const PERIODO_PREDETERMINADO = 'anio'

/** «aaaa-mm-dd» de hoy en Bogotá. */
function hoyBogota(ahora: Date) {
  return new Date(ahora.getTime() - 5 * 3_600_000).toISOString().slice(0, 10)
}

function restarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - dias)
  return d.toISOString().slice(0, 10)
}

/** Rango «aaaa-mm-dd» del periodo: rápido (7d, 30d, mes, año) o personalizado (desde/hasta). */
export function rangoPeriodo(f: FiltrosReporte, ahora: Date = new Date()) {
  const hoy = hoyBogota(ahora)
  const periodo = f.periodo || (f.desde || f.hasta ? 'personalizado' : PERIODO_PREDETERMINADO)
  switch (periodo) {
    case '7d':
      return { desde: restarDias(hoy, 6), hasta: hoy, periodo }
    case '30d':
      return { desde: restarDias(hoy, 29), hasta: hoy, periodo }
    case 'mes':
      return { desde: `${hoy.slice(0, 8)}01`, hasta: hoy, periodo }
    case 'anio':
      return { desde: `${hoy.slice(0, 4)}-01-01`, hasta: hoy, periodo }
    default:
      return { desde: f.desde || `${hoy.slice(0, 4)}-01-01`, hasta: f.hasta || hoy, periodo }
  }
}

/** «Periodo: 01/01/2026 – 14/10/2026» */
export function textoPeriodo(f: FiltrosReporte, ahora?: Date) {
  const r = rangoPeriodo(f, ahora)
  return `${formatearFechaEntrada(r.desde)} – ${formatearFechaEntrada(r.hasta)}`
}

export const lista = (v: string | undefined) => (v ? v.split(',').filter(Boolean) : [])

const ESTADO_CASO: Record<string, string> = {
  CREADO: 'Caso creado',
  EN_ANALISIS: 'En análisis',
  PENDIENTE_REVISION: 'Pendiente de revisión',
  EN_REVISION: 'En revisión',
  REGISTRADO: 'Registrado',
  CERRADO: 'Cerrado',
  DESCARTADO: 'Descartado',
}
const ESTADO_ALERTA: Record<string, string> = {
  GENERADA: 'Generada',
  EN_REVISION: 'En revisión',
  CONFIRMADA: 'Confirmada',
  COMUNICADA: 'Comunicada',
  DESCARTADA: 'Descartada',
}
const RESULTADO: Record<string, string> = {
  CONFIRMADO: 'Confirmado',
  OTRA_PATOLOGIA: 'Otra patología',
  NO_IDENTIFICADO: 'No identificado',
  REQUIERE_VISITA: 'Requiere visita',
  SIN_DIAGNOSTICO: 'Sin diagnóstico aún',
}
const CATEGORIA: Record<string, string> = {
  ...CATEGORIA_LABEL,
  NO_IDENTIFICADA: 'No identificada',
}

/** Nombre del filtro y cómo se lee su valor (chips «Filtros aplicados» y consultas guardadas). */
const NOMBRES: Record<string, { nombre: string; valor?: (v: string) => string }> = {
  vereda: { nombre: 'Vereda', valor: (v) => etiqueta(VEREDA_LABEL, v, v) },
  finca: { nombre: 'Finca' },
  productor: {
    nombre: 'Productores',
    valor: (v) => (lista(v).length === 1 ? v : `${lista(v).length} elegidos`),
  },
  especie: {
    nombre: 'Especie',
    valor: (v) =>
      lista(v)
        .map((e) => etiqueta(ESPECIE_LABEL, e, e))
        .join(', '),
  },
  tipo_cultivo: {
    nombre: 'Tipo de cultivo',
    valor: (v) =>
      lista(v)
        .map((t) => (t === 'INVERNADERO' ? 'Invernadero' : 'Campo abierto'))
        .join(', '),
  },
  estado: {
    nombre: 'Estado',
    valor: (v) =>
      lista(v)
        .map((e) => ESTADO_CASO[e] ?? e)
        .join(', '),
  },
  categoria: {
    nombre: 'Categoría',
    valor: (v) =>
      lista(v)
        .map((c) => CATEGORIA[c] ?? c)
        .join(', '),
  },
  coincidencia_min: { nombre: 'Coincidencia mínima', valor: (v) => `${v} %` },
  coincidencia_max: { nombre: 'Coincidencia máxima', valor: (v) => `${v} %` },
  resultado: { nombre: 'Resultado técnico', valor: (v) => RESULTADO[v] ?? v },
  tecnico: { nombre: 'Técnico' },
  espera: { nombre: 'Días en espera', valor: (v) => `más de ${v}` },
  estado_alerta: {
    nombre: 'Estado de la alerta',
    valor: (v) =>
      lista(v)
        .map((e) => ESTADO_ALERTA[e] ?? e)
        .join(', '),
  },
  decidida: { nombre: 'Decidida por' },
  casos_min: { nombre: 'Casos involucrados mínimos' },
  comunicada: {
    nombre: 'Comunicada',
    valor: (v) => (v === 'si' ? 'Solo comunicadas' : 'Confirmadas sin comunicar'),
  },
  estado_productor: {
    nombre: 'Estado del productor',
    valor: (v) =>
      lista(v)
        .map((e) => (e === 'activo' ? 'Activo' : 'Deshabilitado'))
        .join(', '),
  },
  registrado_desde: { nombre: 'Registrado desde', valor: formatearFechaEntrada },
  registrado_hasta: { nombre: 'Registrado hasta', valor: formatearFechaEntrada },
  casos_desde: { nombre: 'Casos desde' },
  casos_hasta: { nombre: 'Casos hasta' },
  con_activos: { nombre: 'Solo con casos activos', valor: () => 'Sí' },
  chatbot: {
    nombre: 'Chatbot',
    valor: (v) =>
      v === '30'
        ? 'Consultó en los últimos 30 días'
        : v === '90'
          ? 'Sin consultas en 90 días'
          : 'Abandonó una conversación',
  },
  tecnicos: { nombre: 'Técnicos', valor: (v) => `${lista(v).length} elegidos` },
  rol: { nombre: 'Rol', valor: (v) => (v === 'TECNICO' ? 'Técnico' : 'Líder técnico') },
  estado_cuenta: {
    nombre: 'Estado de la cuenta',
    valor: (v) => (v === 'activa' ? 'Activa' : 'Deshabilitada'),
  },
  dias_desde: { nombre: 'Días de revisión desde' },
  dias_hasta: { nombre: 'Días de revisión hasta' },
  con_pendientes: { nombre: 'Con casos pendientes', valor: () => 'Sí' },
  con_extensiones: { nombre: 'Con extensiones', valor: () => 'Sí' },
}

/** Claves que no son filtros quitables (el periodo se muestra aparte). */
const DE_PERIODO = ['periodo', 'desde', 'hasta']

/** Filtros activos con su texto («Vereda: Juracambita»), sin el periodo. */
export function filtrosActivos(f: FiltrosReporte, nombresExtra: Record<string, string> = {}) {
  return Object.entries(f)
    .filter(([k, v]) => v && !DE_PERIODO.includes(k) && NOMBRES[k])
    .map(([clave, v]) => {
      const n = NOMBRES[clave]!
      const valor = nombresExtra[`${clave}:${v}`] ?? (n.valor ? n.valor(v) : v)
      return { clave, texto: `${n.nombre}: ${valor}` }
    })
}

/** Resumen de los filtros de una consulta guardada («Periodo: este año · Estado: …»). */
export function resumenFiltros(f: FiltrosReporte) {
  const periodo = rangoPeriodo(f).periodo
  const textoPer =
    periodo === 'personalizado'
      ? `Periodo: ${textoPeriodo(f)}`
      : `Periodo: ${PERIODOS.find((p) => p.valor === periodo)!.etiqueta.toLowerCase()}`
  return [textoPer, ...filtrosActivos(f).map((x) => x.texto)]
}

/** Claves de la URL de cada panel (para limpiar solo las suyas). */
export const CLAVES_PANEL: Record<PanelFiltros, string[]> = {
  general: [
    'vereda',
    'finca',
    'productor',
    'especie',
    'tipo_cultivo',
    'estado',
    'categoria',
    'coincidencia_min',
    'coincidencia_max',
    'resultado',
    'tecnico',
    'espera',
  ],
  alertas: ['estado_alerta', 'vereda', 'decidida', 'casos_min', 'comunicada'],
  productores: [
    'estado_productor',
    'registrado_desde',
    'registrado_hasta',
    'vereda',
    'tipo_cultivo',
    'especie',
    'casos_desde',
    'casos_hasta',
    'con_activos',
    'chatbot',
  ],
  tecnicos: [
    'tecnicos',
    'rol',
    'estado_cuenta',
    'dias_desde',
    'dias_hasta',
    'con_pendientes',
    'con_extensiones',
  ],
}

/** URL de un reporte con unos filtros (consultas guardadas, tarjetas del índice). */
export function urlReporte(tipo: TipoReporte, filtros: FiltrosReporte) {
  const q = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v)).toString()
  return `${PATHS.reportes}/${REPORTES[tipo].ruta}${q ? `?${q}` : ''}`
}

/** Todas las claves de la URL de los reportes. */
export const CLAVES_REPORTES = [
  'periodo',
  'desde',
  'hasta',
  ...new Set(Object.values(CLAVES_PANEL).flat()),
]
