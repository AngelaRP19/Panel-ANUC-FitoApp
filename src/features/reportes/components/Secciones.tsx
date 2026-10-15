import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormaCategoria } from '@/components/ui/CategoriaMarca'
import { Pagination } from '@/components/ui/Pagination'
import { PATHS } from '@/routes/paths'
import { cn } from '@/utils/cn'
import type {
  KpiReporte,
  SeccionBarras,
  SeccionDatos,
  SeccionReporte,
  SeccionTabla,
  TonoKpiReporte,
} from '../types'

const TONO: Record<TonoKpiReporte, { clase: string; icono: LucideIcon }> = {
  info: { clase: 'bg-info-suave text-info', icono: ClipboardList },
  ok: { clase: 'bg-verde-100 text-verde-700', icono: CheckCircle2 },
  adv: { clase: 'bg-advertencia-suave text-advertencia', icono: Clock },
  revision: { clase: 'bg-revision-suave text-revision', icono: Search },
  peligro: { clase: 'bg-peligro-suave text-peligro', icono: AlertTriangle },
  neutro: { clase: 'bg-neutro-suave text-neutro', icono: BarChart3 },
}

/** Fila de KPI del reporte (pf-kpi): rótulo, cifra y pie. */
export function KpisReporte({ kpis }: { kpis: KpiReporte[] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 xl:grid-cols-5">
      {kpis.map((k) => {
        const { clase, icono: Icono } = TONO[k.tono]
        return (
          <li
            key={k.rotulo}
            className="rounded-lg border border-borde bg-blanco px-5 py-4.5 shadow-1"
          >
            <span
              aria-hidden="true"
              className={cn('float-right grid size-9 place-items-center rounded-md', clase)}
            >
              <Icono size={20} strokeWidth={1.75} />
            </span>
            <div className="sobretitulo">{k.rotulo}</div>
            <div className="font-titulos text-kpi font-bold tabular-nums">{k.valor}</div>
            <div className="text-nota text-tinta-terciaria">{k.pie}</div>
          </li>
        )
      })}
    </ul>
  )
}

function Cabecera({ s, extra }: { s: SeccionReporte; extra?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-borde px-6 py-4">
      <h2 id={`s-${s.id}`} className="flex-1 titulo-h2">
        {s.titulo}
      </h2>
      {s.subtitulo && <span className="text-cuerpo-sm text-tinta-terciaria">{s.subtitulo}</span>}
      {extra}
    </div>
  )
}

/** Barras horizontales con su cifra en texto; se pueden ver como tabla. */
function Barras({ s }: { s: SeccionBarras }) {
  const [comoTabla, setComoTabla] = useState(false)
  const max = Math.max(1, ...s.items.map((i) => i.valor))
  const conForma = s.items.some((i) => i.categoria !== undefined)
  return (
    <>
      <Cabecera
        s={s}
        extra={
          s.items.length > 0 && (
            <Button
              variant="text"
              size="sm"
              className="h-6 px-1"
              aria-pressed={comoTabla}
              onClick={() => setComoTabla((v) => !v)}
            >
              {comoTabla ? 'Ver como gráfica' : 'Ver como tabla'}
            </Button>
          )
        }
      />
      <div className="flex flex-col gap-3 px-6 pt-4 pb-5">
        {s.items.length === 0 ? (
          <p className="text-cuerpo-sm text-tinta-terciaria">Sin datos en el periodo.</p>
        ) : comoTabla ? (
          <table className="w-full text-cuerpo-sm">
            <caption className="sr-only">{s.titulo}</caption>
            <thead>
              <tr className="bg-verde-50">
                <th scope="col" className="px-3 py-2 text-left sobretitulo">
                  {s.titulo}
                </th>
                <th scope="col" className="px-3 py-2 text-right sobretitulo">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {s.items.map((i) => (
                <tr key={i.etiqueta} className="border-t border-borde">
                  <td className="px-3 py-2">{i.etiqueta}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {i.texto ?? i.valor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div
            role="img"
            aria-label={`${s.titulo}: ${s.items.map((i) => `${i.etiqueta} ${i.texto ?? i.valor}`).join(', ')}`}
            className="flex flex-col gap-3"
          >
            {s.items.map((i) => (
              <div
                key={i.etiqueta}
                className="grid grid-cols-[minmax(120px,40%)_1fr] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(150px,32%)_1fr_auto]"
              >
                <span className="inline-flex min-w-0 items-center gap-1.5 text-cuerpo-sm">
                  {conForma && <FormaCategoria categoria={i.categoria ?? null} />}
                  <span className="truncate">{i.etiqueta}</span>
                </span>
                <span className="h-3.5 rounded bg-verde-50">
                  <span
                    className="block h-3.5 rounded-r bg-verde-600"
                    style={{ width: `${(i.valor / max) * 100}%` }}
                  />
                </span>
                <span className="col-span-2 text-right text-cuerpo-sm font-semibold tabular-nums sm:col-span-1">
                  {i.texto ?? i.valor}
                </span>
              </div>
            ))}
          </div>
        )}
        {s.nota && <p className="text-cuerpo-sm text-tinta-terciaria">{s.nota}</p>}
      </div>
    </>
  )
}

/** Tabla de la sección (paginada en el cliente). La primera columna enlaza al caso o alerta. */
function Tabla({ s }: { s: SeccionTabla }) {
  const porPagina = s.porPagina ?? 50
  const [pagina, setPagina] = useState(1)
  const filas = s.filas.slice((pagina - 1) * porPagina, pagina * porPagina)
  const primera = s.columnas[0]?.clave
  const enlace = (f: Record<string, string | number>) =>
    f._caso
      ? PATHS.caso(String(f._caso))
      : f._alerta
        ? `${PATHS.alertas}/${encodeURIComponent(String(f._alerta))}`
        : null
  return (
    <>
      <Cabecera s={s} />
      {s.filas.length === 0 ? (
        <p className="px-6 py-6 text-cuerpo-sm text-tinta-terciaria">
          {s.vacio ?? 'Sin datos en el periodo.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table aria-labelledby={`s-${s.id}`} className="w-full border-collapse text-cuerpo-sm">
            <thead>
              <tr className="bg-verde-50">
                {s.columnas.map((c) => (
                  <th
                    key={c.clave}
                    scope="col"
                    className={cn(
                      'h-10 border-b border-borde px-3 sobretitulo whitespace-nowrap first:pl-6 last:pr-6',
                      c.alinear === 'derecha' ? 'text-right' : 'text-left',
                    )}
                  >
                    {c.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i} className="h-11 border-b border-borde tabular-nums last:border-b-0">
                  {s.columnas.map((c) => {
                    const valor = f[c.clave] ?? '—'
                    const href = c.clave === primera ? enlace(f) : null
                    return (
                      <td
                        key={c.clave}
                        className={cn(
                          'px-3 py-2 first:pl-6 last:pr-6',
                          c.alinear === 'derecha' && 'text-right',
                          f[primera!] === 'Total' && 'font-semibold',
                        )}
                      >
                        {href ? (
                          <Link to={href} className="codigo font-semibold text-verde-700">
                            {valor}
                          </Link>
                        ) : (
                          valor
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {s.porPagina && s.filas.length > 0 && (
        <Pagination
          page={pagina}
          pageSize={porPagina}
          total={s.filas.length}
          noun={s.sustantivo ?? 'filas'}
          onPageChange={setPagina}
        />
      )}
      {s.nota && <p className="px-6 pb-4 text-cuerpo-sm text-tinta-terciaria">{s.nota}</p>}
    </>
  )
}

function Datos({ s }: { s: SeccionDatos }) {
  return (
    <>
      <Cabecera s={s} />
      <dl className="m-0 grid gap-x-6 gap-y-3 px-6 py-4 text-cuerpo-sm sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
        {s.items.map((d) => (
          <div key={d.termino}>
            <dt className="sobretitulo">{d.termino}</dt>
            <dd className="m-0 mt-1 font-medium">{d.valor}</dd>
          </div>
        ))}
      </dl>
      {s.nota && <p className="px-6 pb-4 text-cuerpo-sm text-tinta-terciaria">{s.nota}</p>}
    </>
  )
}

/** Secciones del reporte en una cuadrícula (media o todo el ancho). */
export function Secciones({ secciones }: { secciones: SeccionReporte[] }) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      {secciones.map((s) => (
        <section
          key={s.id}
          aria-labelledby={`s-${s.id}`}
          className={cn(
            'overflow-hidden rounded-lg border border-borde bg-blanco shadow-1',
            s.ancho === 'completo' && 'lg:col-span-2',
          )}
        >
          {s.tipo === 'barras' ? (
            <Barras s={s} />
          ) : s.tipo === 'tabla' ? (
            <Tabla s={s} />
          ) : (
            <Datos s={s} />
          )}
        </section>
      ))}
    </div>
  )
}
