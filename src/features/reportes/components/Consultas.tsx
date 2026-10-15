import { useState } from 'react'
import { Link } from 'react-router'
import { Download, Save, Trash2 } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button, buttonClass } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { MENSAJES } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import { cn } from '@/utils/cn'
import { useConsultas, useEliminarConsulta, useExportarCsv, useGuardarConsulta } from '../hooks'
import type {
  ConsultaGuardada,
  FiltrosReporte,
  Frecuencia,
  TipoReporte,
  Visibilidad,
} from '../types'
import { REPORTES, resumenFiltros, TIPOS_REPORTE, urlReporte } from '../utils'

const RADIO =
  'flex min-h-8 cursor-pointer items-center gap-2.5 text-cuerpo-sm [&>input]:m-0 [&>input]:size-4.5 [&>input]:accent-verde-700'

/**
 * «Guardar consulta» (artboard F5): nombre, reporte, filtros que se guardan, quién la ve y
 * envío programado por correo (día y hora, formato y destinatarios).
 */
export function GuardarConsultaModal({
  tipo,
  filtros,
  onClose,
}: {
  tipo: TipoReporte
  filtros: FiltrosReporte
  onClose: () => void
}) {
  const guardar = useGuardarConsulta()
  const [nombre, setNombre] = useState('')
  const [reporte, setReporte] = useState<TipoReporte>(tipo)
  const [visibilidad, setVisibilidad] = useState<Visibilidad>('yo')
  const [frecuencia, setFrecuencia] = useState<Frecuencia>('no')
  const [diaHora, setDiaHora] = useState('Lunes · 07:00')
  const [formato, setFormato] = useState('PDF')
  const [correos, setCorreos] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const conEnvio = frecuencia !== 'no'
  const relativo = !filtros.desde

  const onGuardar = () => {
    const e: Record<string, string> = {}
    const n = nombre.trim()
    if (n.length < 5 || n.length > 60) e.nombre = 'Escribe un nombre de 5 a 60 caracteres.'
    const lista = correos
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
    if (conEnvio && (!lista.length || lista.some((c) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)))) {
      e.correos = 'Escribe uno o más correos válidos separados por coma.'
    }
    setErrores(e)
    if (Object.keys(e).length) return
    guardar.mutate(
      {
        nombre: n,
        tipo: reporte,
        filtros,
        visibilidad,
        envio: conEnvio ? { frecuencia, dia_hora: diaHora, formato, correos: lista } : null,
      },
      {
        onSuccess: (c) => {
          toast.exito('Consulta guardada', `«${c.nombre}» está en «Consultas guardadas».`)
          onClose()
        },
        onError: (err) => {
          if (esErrorApi(err)) setErrores(err.campos)
        },
      },
    )
  }
  const errorGeneral =
    guardar.isError && !(esErrorApi(guardar.error) && Object.keys(guardar.error.campos).length)

  return (
    <Modal
      open
      onClose={onClose}
      position="top"
      icon={Save}
      iconTone="ok"
      title="Guardar consulta"
      description="Guarda los filtros actuales para volver a usarlos o recibirlos por correo."
      footer={
        <>
          <span className="mr-auto self-center text-nota text-tinta-terciaria">
            Se guardará en «Consultas guardadas» del resumen de reportes
          </span>
          <Button variant="secondary" onClick={onClose} disabled={guardar.isPending}>
            Cancelar
          </Button>
          <Button onClick={onGuardar} loading={guardar.isPending}>
            Guardar consulta
          </Button>
        </>
      }
    >
      <RequiredLegend />
      {errorGeneral && (
        <Aviso tono="peligro" titulo="No se guardó la consulta.">
          {esErrorApi(guardar.error) ? guardar.error.message : MENSAJES.errorConexionTexto}
        </Aviso>
      )}
      <FormField
        label="Nombre de la consulta"
        htmlFor="cg-n"
        required
        error={errores.nombre}
        hint="Entre 5 y 60 caracteres"
      >
        <Input
          id="cg-n"
          value={nombre}
          maxLength={60}
          invalid={!!errores.nombre}
          aria-describedby={fieldDescriptionId('cg-n')}
          onChange={(e) => setNombre(e.target.value)}
        />
      </FormField>
      <FormField label="Reporte" htmlFor="cg-r" required>
        <Select
          id="cg-r"
          value={reporte}
          onChange={(e) => setReporte(e.target.value as TipoReporte)}
          options={TIPOS_REPORTE.map((t) => ({ value: t, label: REPORTES[t].titulo }))}
        />
      </FormField>
      <div>
        <p className="mb-1 etiqueta">Filtros que se guardan</p>
        <ul className="m-0 flex flex-wrap gap-1.5 p-0">
          {resumenFiltros(filtros).map((t) => (
            <li
              key={t}
              className="list-none rounded-pill border border-verde-300 bg-verde-100 px-2.5 py-0.5 text-nota text-verde-900"
            >
              {t}
            </li>
          ))}
        </ul>
        {relativo && (
          <p className="mt-1 text-nota text-tinta-terciaria">
            Con un periodo relativo, la consulta se recalcula cada vez que se abre.
          </p>
        )}
      </div>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-1 p-0 etiqueta">Quién la ve</legend>
        <label className={RADIO}>
          <input
            type="radio"
            name="cg-vis"
            checked={visibilidad === 'yo'}
            onChange={() => setVisibilidad('yo')}
          />
          Solo yo
        </label>
        <label className={RADIO}>
          <input
            type="radio"
            name="cg-vis"
            checked={visibilidad === 'equipo'}
            onChange={() => setVisibilidad('equipo')}
          />
          Todo el equipo técnico (solo lectura)
        </label>
      </fieldset>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-1 p-0 etiqueta">Envío programado</legend>
        {(
          [
            ['no', 'No enviar'],
            ['semana', 'Cada semana'],
            ['mes', 'Cada mes'],
          ] as const
        ).map(([v, t]) => (
          <label key={v} className={RADIO}>
            <input
              type="radio"
              name="cg-env"
              checked={frecuencia === v}
              onChange={() => setFrecuencia(v)}
            />
            {t}
          </label>
        ))}
      </fieldset>
      {conEnvio && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Día y hora" htmlFor="cg-dh">
              <Select
                id="cg-dh"
                value={diaHora}
                onChange={(e) => setDiaHora(e.target.value)}
                options={['Lunes · 07:00', 'Martes · 07:00', 'Viernes · 16:00'].map((v) => ({
                  value: v,
                  label: v,
                }))}
              />
            </FormField>
            <FormField label="Formato" htmlFor="cg-f">
              <Select
                id="cg-f"
                value={formato}
                onChange={(e) => setFormato(e.target.value)}
                options={['PDF', 'CSV', 'PDF y CSV'].map((v) => ({ value: v, label: v }))}
              />
            </FormField>
          </div>
          <FormField
            label="Enviar a"
            htmlFor="cg-c"
            required
            error={errores.correos}
            hint="Formato nombre@dominio · separa varios correos con coma"
          >
            <Input
              id="cg-c"
              value={correos}
              invalid={!!errores.correos}
              aria-describedby={fieldDescriptionId('cg-c')}
              onChange={(e) => setCorreos(e.target.value)}
            />
          </FormField>
        </>
      )}
    </Modal>
  )
}

/** «Consultas guardadas» (artboards 13 y R0): ver resultado, CSV y eliminar. */
export function ConsultasGuardadas({ onGuardarActuales }: { onGuardarActuales: () => void }) {
  const { data, isPending, isError, refetch } = useConsultas()
  const exportar = useExportarCsv()
  const eliminar = useEliminarConsulta()
  const [borrar, setBorrar] = useState<ConsultaGuardada | null>(null)
  const [pagina, setPagina] = useState(1)
  const POR = 6
  const visibles = (data ?? []).slice((pagina - 1) * POR, pagina * POR)

  return (
    <section
      aria-labelledby="t-consultas"
      className="overflow-hidden rounded-lg border border-borde bg-blanco shadow-1"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-borde px-6 py-4">
        <h2 id="t-consultas" className="flex-1 titulo-h2">
          Consultas guardadas
        </h2>
        <Button variant="secondary" size="sm" onClick={onGuardarActuales}>
          <Save aria-hidden="true" />
          Guardar filtros actuales
        </Button>
      </div>
      {isPending ? (
        <div className="p-6">
          <Skeleton style={{ height: 120 }} />
        </div>
      ) : isError ? (
        <div className="p-6">
          <Aviso tono="peligro" titulo="No se pudieron cargar las consultas.">
            <Button variant="text" size="sm" onClick={() => refetch()}>
              {MENSAJES.reintentar}
            </Button>
          </Aviso>
        </div>
      ) : data.length === 0 ? (
        <p className="px-6 py-6 text-cuerpo-sm text-tinta-terciaria">
          Aún no hay consultas guardadas. Aplica filtros y guárdalos para volver a usarlos.
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {visibles.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-3 border-b border-borde px-6 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{c.nombre}</div>
                <div className="text-cuerpo-sm text-tinta-terciaria">
                  {c.descripcion}
                  {c.envio && ` · envío ${c.envio.frecuencia === 'semana' ? 'semanal' : 'mensual'}`}
                </div>
              </div>
              <span className="text-cuerpo-sm font-semibold tabular-nums">{c.resultado}</span>
              <span className="inline-flex h-6 items-center rounded-sm border border-borde bg-neutro-suave px-2 text-xs font-semibold text-neutro">
                {REPORTES[c.tipo].codigo}
              </span>
              <Link
                to={urlReporte(c.tipo, c.filtros)}
                className={cn(buttonClass('secondary', 'sm'))}
                aria-label={`Ver resultado de ${c.nombre}`}
              >
                Ver resultado
              </Link>
              <Button
                variant="text"
                size="sm"
                aria-label={`Descargar CSV de ${c.nombre}`}
                onClick={() =>
                  exportar.mutate(
                    { tipo: c.tipo, filtros: c.filtros },
                    {
                      onError: () =>
                        toast.error('No se descargó el CSV', MENSAJES.errorConexionTexto),
                    },
                  )
                }
              >
                <Download aria-hidden="true" />
                CSV
              </Button>
              <Button
                variant="text"
                size="sm"
                aria-label={`Eliminar ${c.nombre}`}
                onClick={() => setBorrar(c)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {data && data.length > 0 && (
        <Pagination
          page={pagina}
          pageSize={POR}
          total={data.length}
          noun="consultas guardadas"
          onPageChange={setPagina}
        />
      )}
      <ConfirmDialog
        open={!!borrar}
        danger
        title={`¿Eliminar «${borrar?.nombre ?? ''}»?`}
        message="La consulta deja de aparecer para todo el equipo y se cancela su envío programado. Los datos de los reportes no cambian."
        confirmLabel="Eliminar consulta"
        loading={eliminar.isPending}
        onCancel={() => setBorrar(null)}
        onConfirm={() =>
          eliminar.mutate(borrar!.id, {
            onSuccess: () => {
              toast.exito('Consulta eliminada', borrar!.nombre)
              setBorrar(null)
            },
          })
        }
      />
    </section>
  )
}
