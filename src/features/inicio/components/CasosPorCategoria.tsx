import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { CATEGORIA_LABEL } from '@/locales/es'
import { CATEGORIA_BG, CATEGORIAS_ORDEN } from '@/utils/categoria'
import { cn } from '@/utils/cn'
import { useCasosPorCategoria } from '../hooks'
import type { PeriodoCategorias } from '../types'

const PERIODOS: { value: PeriodoCategorias; label: string }[] = [
  { value: '90d', label: 'Últimos 90 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'anio', label: 'Este año' },
]

export function CasosPorCategoria() {
  const [periodo, setPeriodo] = useState<PeriodoCategorias>('90d')
  const [comoTabla, setComoTabla] = useState(false)
  const { data, isPending, isError, refetch } = useCasosPorCategoria(periodo)
  const periodoTxt = PERIODOS.find((p) => p.value === periodo)!.label.toLowerCase()

  const filas = CATEGORIAS_ORDEN.map((categoria) => ({
    categoria,
    total: data?.items.find((i) => i.categoria === categoria)?.total ?? 0,
  }))
  const max = Math.max(1, ...filas.map((f) => f.total))

  return (
    <Card labelledBy="t-graf" className="lg:col-span-7">
      <CardHeader
        id="t-graf"
        title="Casos confirmados por categoría"
        subtitle={`Resultado técnico Confirmado u Otra patología · ${periodoTxt}${data ? ` · ${data.total} casos` : ''}`}
        actions={
          <Select
            aria-label="Periodo"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as PeriodoCategorias)}
            options={PERIODOS}
            className="h-9 w-40 text-cuerpo-sm"
          />
        }
      />

      {isPending ? (
        <div className="grid place-items-center py-12">
          <Spinner />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.total === 0 ? (
        <p className="px-6 py-10 text-center text-cuerpo-sm text-tinta-terciaria">
          No hay casos confirmados en este periodo.
        </p>
      ) : comoTabla ? (
        <table className="w-full text-cuerpo-sm">
          <caption className="sr-only">Casos confirmados por categoría, {periodoTxt}</caption>
          <thead>
            <tr className="bg-verde-50">
              <th scope="col" className="px-6 py-3 text-left sobretitulo">
                Categoría
              </th>
              <th scope="col" className="px-6 py-3 text-right sobretitulo">
                Casos
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.categoria} className="border-t border-borde">
                <td className="px-6 py-2.5">{CATEGORIA_LABEL[f.categoria]}</td>
                <td className="px-6 py-2.5 text-right font-semibold tabular-nums">{f.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div
          role="img"
          aria-label={
            'Casos confirmados: ' +
            filas.map((f) => `${CATEGORIA_LABEL[f.categoria]} ${f.total}`).join(', ')
          }
          className="flex flex-col gap-3.5 px-6 pt-5 pb-3"
        >
          {filas.map((f) => (
            <div
              key={f.categoria}
              title={`${CATEGORIA_LABEL[f.categoria]}: ${f.total} casos`}
              className="grid grid-cols-[130px_1fr_40px] items-center gap-3 sm:grid-cols-[190px_1fr_40px]"
            >
              <span className="inline-flex items-center gap-1.5 text-cuerpo-sm">
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-3 flex-none',
                    f.categoria === 'DEFICIENCIA_MAGNESIO' ? 'rounded-xs' : 'rounded-full',
                    CATEGORIA_BG[f.categoria],
                  )}
                />
                <span className="truncate">{CATEGORIA_LABEL[f.categoria]}</span>
              </span>
              <span className="h-4.5 rounded bg-verde-50">
                <span
                  className={cn('block h-4.5 rounded-r', CATEGORIA_BG[f.categoria])}
                  style={{ width: `${(f.total / max) * 100}%` }}
                />
              </span>
              <span className="text-right font-semibold tabular-nums">{f.total}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 px-6 pt-1 pb-5 text-cuerpo-sm">
        <Link to="/mapa" className="enlace">
          Ver en el mapa de vigilancia
        </Link>
        {data && data.total > 0 && (
          <Button
            variant="text"
            size="sm"
            className="h-5 px-0 hover:bg-transparent hover:underline"
            aria-pressed={comoTabla}
            onClick={() => setComoTabla((v) => !v)}
          >
            {comoTabla ? 'Ver como gráfica' : 'Ver como tabla'}
          </Button>
        )}
      </div>
    </Card>
  )
}
