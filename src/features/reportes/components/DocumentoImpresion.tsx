import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FormaCategoria } from '@/components/ui/CategoriaMarca'
import { CATEGORIA_LABEL, ESTADO_ALERTA_LABEL, ESTADO_CASO_LABEL } from '@/locales/es'
import type { Categoria } from '@/types/enums'
import { cn } from '@/utils/cn'
import type { DocumentoExportable } from '../exportar'
import type { SeccionBarras, SeccionDatos, SeccionReporte, SeccionTabla } from '../types'

// Documento para imprimir o guardar como PDF (formato del ejemplo
// «Reporte_casos_septiembre_2026.pdf»): carta, encabezado ANUC, chips de filtros, KPI,
// gráficas, tablas con estados de color y el listado principal como anexo. Solo existe
// mientras se imprime; en pantalla está oculto (styles/index.css · @media print).

// ── Estados y categorías con su color ─────────────────────────────────────────────────
type Tono = 'neutral' | 'info' | 'warning' | 'review' | 'success' | 'inactive' | 'danger'
const TONO_CLASE: Record<Tono, string> = {
  neutral: 'border border-borde-control bg-blanco text-neutro',
  info: 'bg-info-suave text-info',
  warning: 'bg-advertencia-suave text-advertencia',
  review: 'bg-revision-suave text-revision',
  success: 'bg-verde-100 text-verde-700',
  inactive: 'bg-inactivo-suave text-inactivo',
  danger: 'bg-peligro-suave text-peligro',
}
const BARRA_CLASE: Record<Tono, string> = {
  neutral: 'bg-neutro',
  info: 'bg-info',
  warning: 'bg-advertencia',
  review: 'bg-revision',
  success: 'bg-verde-700',
  inactive: 'bg-inactivo',
  danger: 'bg-peligro',
}
const TONO_ESTADO: Record<string, Tono> = {
  [ESTADO_CASO_LABEL.CREADO]: 'neutral',
  [ESTADO_CASO_LABEL.EN_ANALISIS]: 'info',
  [ESTADO_CASO_LABEL.PENDIENTE_REVISION]: 'warning',
  [ESTADO_CASO_LABEL.EN_REVISION]: 'review',
  [ESTADO_CASO_LABEL.REGISTRADO]: 'neutral',
  [ESTADO_CASO_LABEL.CERRADO]: 'success',
  [ESTADO_CASO_LABEL.DESCARTADO]: 'inactive',
  [ESTADO_ALERTA_LABEL.GENERADA]: 'warning',
  [ESTADO_ALERTA_LABEL.CONFIRMADA]: 'danger',
  [ESTADO_ALERTA_LABEL.COMUNICADA]: 'success',
  [ESTADO_ALERTA_LABEL.DESCARTADA]: 'inactive',
  [ESTADO_ALERTA_LABEL.CORREGIDA]: 'info',
  Activo: 'success',
  Activa: 'success',
  Deshabilitado: 'inactive',
  Deshabilitada: 'inactive',
}
const tonoEstado = (texto: string): Tono | null => TONO_ESTADO[texto] ?? null

/** «Trips · 77 %» → TRIPS; «No identificada» → null (círculo vacío). */
const CATEGORIA_DE_TEXTO: [string, Categoria][] = [
  ...(Object.entries(CATEGORIA_LABEL) as [Categoria, string][]).map(
    ([c, t]) => [t, c] as [string, Categoria],
  ),
  ['Def. magnesio', 'DEFICIENCIA_MAGNESIO'],
]
function categoriaDeTexto(texto: string): Categoria | null | undefined {
  if (texto.startsWith('No identificada')) return null
  return CATEGORIA_DE_TEXTO.find(([t]) => texto.startsWith(t))?.[1]
}

function Estado({ texto }: { texto: string }) {
  const tono = tonoEstado(texto)
  if (!tono) return <>{texto}</>
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[3pt] rounded-pill px-[5pt] py-[1.5pt] text-[7.5pt] font-semibold whitespace-nowrap',
        'before:size-[4.5pt] before:flex-none before:rounded-full before:bg-current',
        TONO_CLASE[tono],
      )}
    >
      {texto}
    </span>
  )
}

function Celda({ clave, valor }: { clave: string; valor: string }) {
  if (clave === 'estado' || clave === 'cuenta') return <Estado texto={valor} />
  if (clave === 'preliminar' || clave === 'categoria' || clave === 'principal') {
    const c = categoriaDeTexto(valor)
    if (c !== undefined)
      return (
        <span className="inline-flex items-center gap-[4pt] whitespace-nowrap">
          <FormaCategoria categoria={c} tamano={9} />
          {valor}
        </span>
      )
  }
  return <>{valor}</>
}

// ── Secciones ─────────────────────────────────────────────────────────────────────────
function Cabecera({ s, prefijo = '' }: { s: SeccionReporte; prefijo?: string }) {
  return (
    <div className="mb-[8pt] flex items-baseline gap-[8pt] border-b border-borde pb-[5pt]">
      <h2 className="min-w-[58%] flex-1 font-titulos text-[11.5pt] leading-tight font-bold">
        {prefijo}
        {s.titulo}
      </h2>
      {s.subtitulo && (
        <span className="text-right text-[7.5pt] text-tinta-terciaria">{s.subtitulo}</span>
      )}
    </div>
  )
}

const Nota = ({ texto }: { texto?: string }) =>
  texto ? <p className="mt-[6pt] text-[7.5pt] text-tinta-terciaria">{texto}</p> : null

/** Barras cuyos elementos son estados: barra apilada de colores + tabla con %. */
function Distribucion({ s }: { s: SeccionBarras }) {
  const total = s.items.reduce((t, i) => t + i.valor, 0)
  const pct = (v: number) => (total ? `${Math.round((v / total) * 100)} %` : '0 %')
  return (
    <>
      <div className="mb-[8pt] flex h-[9pt] gap-[2pt]" aria-hidden="true">
        {s.items
          .filter((i) => i.valor > 0)
          .map((i) => (
            <span
              key={i.etiqueta}
              className={cn('rounded-[2pt]', BARRA_CLASE[tonoEstado(i.etiqueta) ?? 'neutral'])}
              style={{ flexGrow: i.valor }}
            />
          ))}
      </div>
      <Tabla
        s={{
          ...s,
          tipo: 'tabla',
          columnas: [
            { clave: 'estado', titulo: 'Estado' },
            { clave: 'valor', titulo: 'Cantidad', alinear: 'derecha' },
            { clave: 'pct', titulo: '%', alinear: 'derecha' },
          ],
          filas: [
            ...s.items.map((i) => ({ estado: i.etiqueta, valor: i.valor, pct: pct(i.valor) })),
            { estado: 'Total', valor: total, pct: total ? '100 %' : '0 %' },
          ],
        }}
      />
    </>
  )
}

/** Serie en el tiempo (semanas o meses): columnas con la cifra encima. */
function Columnas({ s }: { s: SeccionBarras }) {
  const max = Math.max(1, ...s.items.map((i) => i.valor))
  return (
    <div className="flex items-start gap-[6pt] px-[6pt]">
      {s.items.map((i) => (
        <div key={i.etiqueta} className="flex min-w-0 flex-1 flex-col">
          {/* Área fija de 86 pt: todas las columnas comparten la misma base. */}
          <div className="flex h-[86pt] flex-col justify-end border-b border-borde">
            <span className="mb-[2pt] text-center text-[7pt] font-semibold tabular-nums">
              {i.texto ?? i.valor}
            </span>
            <span
              className="mx-auto block w-[70%] max-w-[34pt] rounded-t-[2pt] bg-verde-600"
              style={{ height: `${(i.valor / max) * 72}pt` }}
            />
          </div>
          <span className="mt-[3pt] text-center text-[6.5pt] leading-tight text-tinta-terciaria">
            {i.etiqueta.replace(/^Sem\. del /, '')}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Barras horizontales: etiqueta, barra y cifra (como «Tiempos del proceso»). */
function Barras({ s }: { s: SeccionBarras }) {
  if (s.items.length === 0)
    return <p className="text-[8pt] text-tinta-terciaria">Sin datos en el periodo.</p>
  if (s.items.every((i) => tonoEstado(i.etiqueta))) return <Distribucion s={s} />
  if (/semana|mes/i.test(s.id)) return <Columnas s={s} />
  const max = Math.max(1, ...s.items.map((i) => i.valor))
  const conForma = s.items.some((i) => i.categoria !== undefined)
  return (
    <div className="flex flex-col gap-[5pt]">
      {s.items.map((i) => (
        <div
          key={i.etiqueta}
          className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-[8pt] text-[8.5pt]"
        >
          <span className="inline-flex min-w-0 items-center gap-[4pt]">
            {conForma && <FormaCategoria categoria={i.categoria ?? null} tamano={9} />}
            <span className="truncate">{i.etiqueta}</span>
          </span>
          <span className="h-[6pt] rounded-[3pt] bg-verde-100">
            <span
              className="block h-full rounded-[3pt] bg-verde-600"
              style={{ width: `${(i.valor / max) * 100}%` }}
            />
          </span>
          <span className="min-w-[38pt] text-right font-semibold tabular-nums">
            {i.texto ?? i.valor}
          </span>
        </div>
      ))}
    </div>
  )
}

function Tabla({ s }: { s: SeccionTabla }) {
  if (s.filas.length === 0)
    return (
      <p className="text-[8pt] text-tinta-terciaria">{s.vacio ?? 'Sin datos en el periodo.'}</p>
    )
  const primera = s.columnas[0]!.clave
  return (
    <table className="w-full border-collapse text-[8pt]">
      <thead>
        <tr className="bg-verde-50">
          {s.columnas.map((c) => (
            <th
              key={c.clave}
              scope="col"
              className={cn(
                'border-b border-borde px-[5pt] py-[5pt] text-[6.5pt] font-semibold tracking-[0.06em] text-tinta-secundaria uppercase',
                c.alinear === 'derecha' ? 'text-right' : 'text-left',
              )}
            >
              {c.titulo}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {s.filas.map((f, n) => {
          const total = f[primera] === 'Total'
          return (
            <tr
              key={n}
              className={cn('break-inside-avoid border-b border-borde', total && 'font-bold')}
            >
              {s.columnas.map((c) => (
                <td
                  key={c.clave}
                  className={cn(
                    'px-[5pt] py-[4.5pt] align-middle',
                    c.alinear === 'derecha' && 'text-right tabular-nums',
                    c.clave === primera && f._caso && 'font-mono text-[7.5pt] font-medium',
                  )}
                >
                  {total ? (
                    String(f[c.clave] ?? '')
                  ) : (
                    <Celda clave={c.clave} valor={String(f[c.clave] ?? '—')} />
                  )}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Datos({ s }: { s: SeccionDatos }) {
  return (
    <dl className="m-0 grid grid-cols-3 gap-x-[14pt] gap-y-[8pt]">
      {s.items.map((d) => (
        <div key={d.termino}>
          <dt className="text-[6.5pt] font-semibold tracking-[0.06em] text-tinta-secundaria uppercase">
            {d.termino}
          </dt>
          <dd className="m-0 mt-[2pt] text-[8.5pt] font-medium">{d.valor}</dd>
        </div>
      ))}
    </dl>
  )
}

/** La distribución por estados va a todo el ancho, como en el ejemplo. */
const esDistribucion = (s: SeccionReporte) =>
  s.tipo === 'barras' && s.items.length > 0 && s.items.every((i) => tonoEstado(i.etiqueta))

function Seccion({ s, anexo = false }: { s: SeccionReporte; anexo?: boolean }) {
  return (
    <section
      className={cn(
        'min-w-0',
        s.ancho === 'completo' || anexo || esDistribucion(s) ? 'col-span-2' : 'break-inside-avoid',
      )}
    >
      <Cabecera s={s} prefijo={anexo ? 'Anexo · ' : ''} />
      {s.tipo === 'barras' ? (
        <Barras s={s} />
      ) : s.tipo === 'tabla' ? (
        <Tabla s={s} />
      ) : (
        <Datos s={s} />
      )}
      <Nota texto={s.nota} />
    </section>
  )
}

// ── Documento ─────────────────────────────────────────────────────────────────────────
const cssTexto = (t: string) => `"${t.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

interface DocumentoImpresionProps {
  documento: DocumentoExportable
  /** «02/10/2026 a las 08:15» */
  generado: string
  /** «Wilmar Torres · líder técnico» */
  autor: string
  /** Se llama cuando el navegador termina de imprimir (o se cancela). */
  onTerminar: () => void
}

/**
 * Abre la impresión del navegador con el reporte. En el diálogo, «Guardar como PDF» produce
 * el archivo con el nombre del documento (p. ej. «Reporte_casos_septiembre_2026.pdf»).
 */
export function DocumentoImpresion({
  documento: d,
  generado,
  autor,
  onTerminar,
}: DocumentoImpresionProps) {
  const terminar = useRef(onTerminar)
  useEffect(() => {
    terminar.current = onTerminar
  })

  useEffect(() => {
    let cancelado = false
    const tituloAnterior = document.title
    const fin = () => {
      document.title = tituloAnterior
      terminar.current()
    }
    // El documento está oculto en pantalla, así que el navegador no pide sus fuentes por sí
    // solo: se cargan antes de imprimir para que el PDF no salga con una fuente del sistema.
    const fuentes = document.fonts
      ? Promise.allSettled(
          [
            '700 16px "Plus Jakarta Sans Variable"',
            '400 16px "Inter Variable"',
            '600 16px "Inter Variable"',
            '500 16px "JetBrains Mono Variable"',
          ].map((f) => document.fonts.load(f)),
        ).then(() => document.fonts.ready)
      : Promise.resolve()
    fuentes.then(() => {
      if (cancelado) return
      document.title = d.nombreArchivo // nombre sugerido del PDF
      window.addEventListener('afterprint', fin, { once: true })
      window.print()
    })
    return () => {
      cancelado = true
      window.removeEventListener('afterprint', fin)
      document.title = tituloAnterior
    }
  }, [d.nombreArchivo])

  const principal = d.secciones.filter((s) => s.id === 'principal')
  const resto = d.secciones.filter((s) => s.id !== 'principal')
  const pagina = `@page {
    size: letter;
    margin: 16mm 15mm 15mm;
    @top-left { content: "ANUC Zetaquirá · Panel fitosanitario"; font: 6pt Inter, sans-serif; color: #5f7166; }
    @top-right { content: ${cssTexto(`${d.titulo} · ${d.periodoCorto}`)}; font: 6pt Inter, sans-serif; color: #5f7166; }
    @bottom-left { content: "Uso interno · no compartir datos de productores fuera de la asociación"; font: 6pt Inter, sans-serif; color: #5f7166; }
    @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 6pt Inter, sans-serif; color: #5f7166; }
  }`

  return createPortal(
    <div
      className="impresion-reporte bg-blanco font-texto text-[8.5pt] leading-[1.35] text-tinta"
      role="document"
      aria-label={`Documento para imprimir: ${d.titulo}`}
    >
      <style>{pagina}</style>
      <header className="flex items-start gap-[10pt] border-b-[1.5pt] border-verde-700 pb-[10pt]">
        <span className="grid size-[30pt] flex-none place-items-center rounded-[5pt] bg-verde-950 font-titulos text-[10.5pt] font-bold text-blanco">
          AZ
        </span>
        <div className="flex-1">
          <div className="font-titulos text-[11.5pt] font-bold">ANUC Zetaquirá</div>
          <div className="text-[8pt] text-tinta-secundaria">
            Panel fitosanitario · Zetaquirá, Boyacá
          </div>
        </div>
        <div className="text-right text-[8pt] leading-[1.45] text-tinta-secundaria">
          <div>Generado el {generado}</div>
          <div>por {autor}</div>
          <div>Documento de uso interno</div>
        </div>
      </header>

      <h1 className="mt-[14pt] font-titulos text-[19pt] leading-tight font-bold">{d.titulo}</h1>
      <p className="mt-[2pt] text-[9.5pt] text-tinta-secundaria">{d.subtitulo}</p>

      <ul className="m-0 mt-[10pt] flex list-none flex-wrap gap-[5pt] p-0">
        {d.chips.map((c) => {
          const i = c.indexOf(':')
          return (
            <li
              key={c}
              className="rounded-pill border border-verde-300 bg-verde-50 px-[7pt] py-[2.5pt] text-[7.5pt]"
            >
              <b className="font-semibold">{c.slice(0, i + 1)}</b>
              {c.slice(i + 1)}
            </li>
          )
        })}
      </ul>

      <ul
        className="m-0 mt-[12pt] grid list-none gap-[7pt] p-0"
        style={{
          gridTemplateColumns: `repeat(${Math.min(d.kpis.length, 5) || 1}, minmax(0, 1fr))`,
        }}
      >
        {d.kpis.map((k) => (
          <li
            key={k.rotulo}
            className="break-inside-avoid rounded-[5pt] border border-borde px-[8pt] py-[8pt]"
          >
            <div className="text-[6.5pt] font-semibold tracking-[0.08em] text-tinta-secundaria uppercase">
              {k.rotulo}
            </div>
            <div className="mt-[3pt] font-titulos text-[17pt] leading-none font-bold tabular-nums">
              {k.valor}
            </div>
            <div className="mt-[4pt] text-[7pt] leading-snug text-tinta-terciaria">{k.pie}</div>
          </li>
        ))}
      </ul>

      <Contenedor>
        {resto.map((s) => (
          <Seccion key={s.id} s={s} />
        ))}
        {principal.map((s) => (
          <Seccion key={s.id} s={s} anexo />
        ))}
      </Contenedor>
    </div>,
    document.body,
  )
}

function Contenedor({ children }: { children: ReactNode }) {
  return <div className="mt-[16pt] grid grid-cols-2 gap-x-[20pt] gap-y-[18pt]">{children}</div>
}
