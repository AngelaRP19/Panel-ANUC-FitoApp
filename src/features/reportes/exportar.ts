// Exportación de reportes (CSV y PDF). Se arman en el navegador con los mismos datos que se
// ven en pantalla: así el archivo coincide siempre con el reporte y el backend solo entrega
// los datos. El PDF es una página de impresión (ver components/DocumentoImpresion.tsx) que el
// navegador guarda como PDF, con el formato del ejemplo «Reporte_casos_septiembre_2026.pdf».
import { formatearFechaEntrada } from '@/utils/fechas'
import type {
  FiltrosReporte,
  KpiReporte,
  PanelFiltros,
  ReporteDatos,
  ResumenReportes,
  SeccionReporte,
  TipoReporte,
} from './types'
import { filtrosActivos, rangoPeriodo, REPORTES } from './utils'

const MESES = [
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

/** Lo que se exporta: encabezado, chips de filtros, KPI y secciones. */
export interface DocumentoExportable {
  tipo: TipoReporte | 'resumen'
  titulo: string
  /** «Periodo del 01/09/2026 al 30/09/2026 · 32 casos» */
  subtitulo: string
  /** «septiembre de 2026» o «01/09/2026 – 30/09/2026» (encabezado de cada página). */
  periodoCorto: string
  /** «Periodo: 01/09/2026 – 30/09/2026», «Vereda: todas»… */
  chips: string[]
  kpis: KpiReporte[]
  secciones: SeccionReporte[]
  /** Sin extensión: «Reporte_casos_septiembre_2026». */
  nombreArchivo: string
}

/** Filtros que siempre se muestran en el encabezado (con «todas/todos» si no se usan). */
const CHIPS_PANEL: Record<PanelFiltros, { clave: string; nombre: string; vacio: string }[]> = {
  general: [
    { clave: 'vereda', nombre: 'Vereda', vacio: 'todas' },
    { clave: 'especie', nombre: 'Especie', vacio: 'todas' },
    { clave: 'tecnico', nombre: 'Técnico', vacio: 'todos' },
    { clave: 'estado', nombre: 'Estados', vacio: 'todos' },
  ],
  alertas: [
    { clave: 'vereda', nombre: 'Vereda', vacio: 'todas' },
    { clave: 'estado_alerta', nombre: 'Estados', vacio: 'todos' },
  ],
  productores: [
    { clave: 'vereda', nombre: 'Vereda', vacio: 'todas' },
    { clave: 'estado_productor', nombre: 'Estado del productor', vacio: 'todos' },
  ],
  tecnicos: [
    { clave: 'tecnicos', nombre: 'Técnicos', vacio: 'todos' },
    { clave: 'rol', nombre: 'Rol', vacio: 'todos' },
  ],
}

/** Periodo del documento: textos para el subtítulo, el encabezado y el nombre del archivo. */
function periodoDe(f: FiltrosReporte) {
  const { desde, hasta } = rangoPeriodo(f)
  const [a1, m1, d1] = desde.split('-').map(Number) as [number, number, number]
  const [a2, m2] = hasta.split('-').map(Number) as [number, number]
  const ultimoDelMes = new Date(Date.UTC(a2, m2, 0)).getUTCDate()
  const mesCompleto =
    a1 === a2 && m1 === m2 && d1 === 1 && Number(hasta.slice(8)) >= Math.min(ultimoDelMes, 28)
  const rango = `${formatearFechaEntrada(desde)} – ${formatearFechaEntrada(hasta)}`
  return {
    rango,
    largo: `Periodo del ${formatearFechaEntrada(desde)} al ${formatearFechaEntrada(hasta)}`,
    corto: mesCompleto ? `${MESES[m1 - 1]} de ${a1}` : rango,
    archivo: mesCompleto ? `${MESES[m1 - 1]}_${a1}` : `${desde}_a_${hasta}`,
  }
}

function chipsDe(f: FiltrosReporte, panel: PanelFiltros, nombres: Record<string, string>) {
  const activos = filtrosActivos(f, nombres)
  const fijos = CHIPS_PANEL[panel].map((c) => {
    const activo = activos.find((a) => a.clave === c.clave)
    return activo ? activo.texto : `${c.nombre}: ${c.vacio}`
  })
  const otros = activos
    .filter((a) => !CHIPS_PANEL[panel].some((c) => c.clave === a.clave))
    .map((a) => a.texto)
  return [`Periodo: ${periodoDe(f).rango}`, ...fijos, ...otros]
}

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Documento de un reporte R1-R5. */
export function documentoDeReporte(
  datos: ReporteDatos,
  filtros: FiltrosReporte,
  nombres: Record<string, string> = {},
): DocumentoExportable {
  const meta = REPORTES[datos.tipo]
  const periodo = periodoDe(filtros)
  return {
    tipo: datos.tipo,
    titulo: `Reporte de ${meta.titulo.charAt(0).toLowerCase()}${meta.titulo.slice(1)}`,
    subtitulo: `${periodo.largo} · ${datos.total} ${datos.sustantivo}`,
    periodoCorto: periodo.corto,
    chips: chipsDe(filtros, meta.panel, nombres),
    kpis: datos.kpis,
    secciones: datos.secciones,
    nombreArchivo: sinTildes(`Reporte_${meta.ruta}_${periodo.archivo}`),
  }
}

/** Documento del resumen de reportes (pantalla 23), con la lista de reportes al final. */
export function documentoDeResumen(
  datos: ResumenReportes,
  filtros: FiltrosReporte,
  nombres: Record<string, string> = {},
): DocumentoExportable {
  const periodo = periodoDe(filtros)
  return {
    tipo: 'resumen',
    titulo: 'Resumen de reportes',
    subtitulo: `${periodo.largo} · ${datos.total} ${datos.sustantivo}`,
    periodoCorto: periodo.corto,
    chips: chipsDe(filtros, 'general', nombres),
    kpis: datos.kpis,
    secciones: [
      ...datos.secciones,
      {
        tipo: 'tabla',
        id: 'reportes',
        titulo: 'Reportes del periodo',
        ancho: 'completo',
        columnas: [
          { clave: 'codigo', titulo: 'Código' },
          { clave: 'reporte', titulo: 'Reporte' },
          { clave: 'cifras', titulo: 'Cifras destacadas' },
        ],
        filas: datos.reportes.map((r) => ({
          codigo: REPORTES[r.tipo].codigo,
          reporte: r.titulo,
          cifras: r.destacados.join(' · '),
        })),
      },
    ],
    nombreArchivo: sinTildes(`Reportes_resumen_${periodo.archivo}`),
  }
}

// ── CSV ────────────────────────────────────────────────────────────────────────────────
// Excel en español (Colombia) separa columnas con punto y coma; con coma todo queda en una
// sola columna. El BOM hace que Excel lea bien las tildes.
const SEP = ';'
const celda = (v: string | number | undefined) => {
  const t = String(v ?? '')
  return /[";\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}
const fila = (celdas: (string | number | undefined)[]) => celdas.map(celda).join(SEP)

/** CSV con el encabezado, los KPI y cada sección como una tabla, separados por una línea. */
export function csvDeDocumento(d: DocumentoExportable, generado: string): string {
  const bloques: string[][] = [
    [
      fila([d.titulo]),
      fila([d.subtitulo]),
      ...d.chips.map((c) => {
        const i = c.indexOf(':')
        return fila([c.slice(0, i), c.slice(i + 1).trim()])
      }),
      fila(['Generado', generado]),
    ],
    [
      fila(['Indicador', 'Valor', 'Detalle']),
      ...d.kpis.map((k) => fila([k.rotulo, k.valor, k.pie])),
    ],
  ]
  for (const s of d.secciones) {
    const titulo = s.subtitulo ? `${s.titulo} (${s.subtitulo})` : s.titulo
    if (s.tipo === 'tabla') {
      bloques.push([
        fila([titulo]),
        fila(s.columnas.map((c) => c.titulo)),
        ...(s.filas.length
          ? s.filas.map((f) => fila(s.columnas.map((c) => f[c.clave])))
          : [fila([s.vacio ?? 'Sin datos en el periodo.'])]),
      ])
    } else if (s.tipo === 'barras') {
      bloques.push([
        fila([titulo]),
        fila([s.titulo, 'Valor']),
        ...s.items.map((i) => fila([i.etiqueta, i.texto ?? i.valor])),
      ])
    } else {
      bloques.push([
        fila([titulo]),
        fila(['Dato', 'Valor']),
        ...s.items.map((i) => fila([i.termino, i.valor])),
      ])
    }
    if (s.nota) bloques.at(-1)!.push(fila([s.nota]))
  }
  return '﻿' + bloques.map((b) => b.join('\r\n')).join('\r\n\r\n') + '\r\n'
}

/** «02/10/2026 a las 08:15» en hora de Bogotá. */
export function textoGenerado(fecha = new Date()): string {
  const bogota = new Date(fecha.getTime() - 5 * 3_600_000).toISOString()
  return `${formatearFechaEntrada(bogota.slice(0, 10))} a las ${bogota.slice(11, 16)}`
}
