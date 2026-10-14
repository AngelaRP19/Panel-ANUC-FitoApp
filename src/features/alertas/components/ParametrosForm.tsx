import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, SlidersHorizontal } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { FormaCategoria } from '@/components/ui/CategoriaMarca'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import { CATEGORIA_LABEL, MENSAJES, etiqueta } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import { formatearFechaHora } from '@/utils/fechas'
import { formatearDecimal, parsearDecimal } from '@/utils/numeros'
import { useGuardarParametros } from '../hooks'
import { parametrosSchema, type ParametrosValues } from '../schemas'
import type { ParametroCategoria, ParametrosAlerta } from '../types'

const aTexto = (p: ParametroCategoria): ParametrosValues => ({
  num_casos: String(p.num_casos),
  distancia_km: formatearDecimal(p.distancia_km, 2),
  intervalo_dias: String(p.intervalo_dias),
})

const aValores = (v: ParametrosValues): ParametrosAlerta => ({
  num_casos: Number(v.num_casos),
  distancia_km: parsearDecimal(v.distancia_km)!,
  intervalo_dias: Number(v.intervalo_dias),
})

/** «Se generará una alerta cuando haya al menos 3 casos confirmados de Trips …» */
function Frase({ valores, categoria }: { valores: ParametrosValues; categoria: string }) {
  const r = parametrosSchema.safeParse(valores)
  if (!r.success) {
    return <>Completa los tres valores para ver cuándo se generará una alerta.</>
  }
  const v = aValores(r.data)
  return (
    <>
      Se generará una alerta cuando haya{' '}
      <b className="font-semibold">
        al menos {v.num_casos} casos confirmados de {categoria}
      </b>{' '}
      a no más de <b className="font-semibold">{formatearDecimal(v.distancia_km, 2)} km</b> entre
      sí, en los <b className="font-semibold">últimos {v.intervalo_dias} días</b>.
    </>
  )
}

/**
 * Parámetros de una categoría que participa en las alertas (diseño 07 · RQF25): número mínimo
 * de casos, distancia máxima e intervalo, con la frase resumen en vivo. Guardar pide
 * confirmación; «Restablecer valores» vuelve a los vigentes.
 */
export function ParametrosForm({ parametro }: { parametro: ParametroCategoria }) {
  const nombre = etiqueta(CATEGORIA_LABEL, parametro.categoria)
  const guardar = useGuardarParametros(parametro.categoria)
  const [confirmar, setConfirmar] = useState<ParametrosValues | null>(null)
  const id = parametro.categoria.toLowerCase()
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ParametrosValues>({
    resolver: zodResolver(parametrosSchema),
    defaultValues: aTexto(parametro),
  })
  const valores = useWatch({ control }) as ParametrosValues

  const onGuardar = () => {
    if (!confirmar) return
    guardar.mutate(aValores(confirmar), {
      onSuccess: (p) => {
        reset(aTexto(p))
        setConfirmar(null)
        toast.exito(
          'Parámetros guardados',
          `Las alertas de ${nombre} que se generen desde ahora usarán estos valores.`,
        )
      },
      onError: (e) => {
        setConfirmar(null)
        if (!esErrorApi(e)) return
        for (const [campo, mensaje] of Object.entries(e.campos)) {
          if (campo === 'num_casos' || campo === 'distancia_km' || campo === 'intervalo_dias') {
            setError(campo, { message: mensaje }, { shouldFocus: true })
          }
        }
      },
    })
  }
  const errorGeneral =
    guardar.isError && !(esErrorApi(guardar.error) && Object.keys(guardar.error.campos).length)

  const campo = (
    nombreCampo: keyof ParametrosValues,
    label: string,
    hint: string,
    inputMode: 'numeric' | 'decimal',
  ) => {
    const htmlFor = `${id}-${nombreCampo}`
    return (
      <FormField
        label={label}
        htmlFor={htmlFor}
        required
        error={errors[nombreCampo]?.message}
        hint={hint}
      >
        <Input
          id={htmlFor}
          inputMode={inputMode}
          autoComplete="off"
          className="tabular-nums"
          invalid={!!errors[nombreCampo]}
          aria-describedby={fieldDescriptionId(htmlFor)}
          {...register(nombreCampo)}
        />
      </FormField>
    )
  }

  return (
    <section
      aria-labelledby={`t-${id}`}
      className="rounded-lg border border-borde bg-blanco shadow-1"
    >
      <div className="flex items-center gap-3 border-b border-borde px-6 py-4">
        <FormaCategoria categoria={parametro.categoria} tamano={14} />
        <h2 id={`t-${id}`} className="flex-1 titulo-h2">
          {nombre}
        </h2>
        <span className="inline-flex h-6 items-center rounded-sm border border-verde-300 bg-verde-100 px-2 text-xs font-semibold text-verde-800">
          Participa en alertas
        </span>
      </div>
      <form
        noValidate
        onSubmit={handleSubmit((v) => setConfirmar(v))}
        className="flex flex-col gap-5 p-6"
      >
        {errorGeneral && (
          <Aviso tono="peligro" titulo="No se guardaron los parámetros.">
            {esErrorApi(guardar.error) ? guardar.error.message : MENSAJES.errorConexionTexto}
          </Aviso>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {campo('num_casos', 'Número mínimo de casos', 'Entero, mínimo 2 · ej. 3', 'numeric')}
          {campo('distancia_km', 'Distancia máxima (km)', 'Decimal con coma · ej. 3,5', 'decimal')}
          {campo('intervalo_dias', 'Intervalo (días)', 'Días hacia atrás · ej. 30', 'numeric')}
        </div>
        <Aviso tono="info">
          <span aria-live="polite">
            <Frase valores={valores} categoria={nombre} />
          </span>
        </Aviso>
        <div className="flex flex-wrap items-center gap-2 border-t border-borde pt-4">
          <span className="min-w-0 flex-1 text-cuerpo-sm text-tinta-terciaria tabular-nums">
            {parametro.actualizado_en && parametro.actualizado_por
              ? `Última modificación: ${formatearFechaHora(parametro.actualizado_en)} · ${parametro.actualizado_por.nombre}`
              : 'Sin modificaciones: valores iniciales.'}
          </span>
          <Button variant="text" onClick={() => reset(aTexto(parametro))} disabled={!isDirty}>
            Restablecer valores
          </Button>
          <Button type="submit" disabled={!isDirty}>
            Guardar cambios
          </Button>
        </div>
        <RequiredLegend />
        <p className="-mt-3 text-nota text-tinta-terciaria">
          Los cambios aplican a las alertas que se generen desde ahora. Las alertas existentes
          conservan los parámetros con que se crearon.
        </p>
      </form>

      <ConfirmDialog
        open={!!confirmar}
        icon={SlidersHorizontal}
        title={`¿Guardar los parámetros de ${nombre}?`}
        message={
          confirmar ? (
            <>
              <Frase valores={confirmar} categoria={nombre} /> Las alertas existentes no cambian.
            </>
          ) : null
        }
        confirmLabel="Guardar cambios"
        loading={guardar.isPending}
        onConfirm={onGuardar}
        onCancel={() => setConfirmar(null)}
      />
    </section>
  )
}

/** Categoría que no participa en las alertas (tarjeta gris con candado). */
export function CategoriaNoParticipa({ parametro }: { parametro: ParametroCategoria }) {
  const nombre = etiqueta(CATEGORIA_LABEL, parametro.categoria)
  return (
    <section
      aria-label={`${nombre}: no aplica`}
      className="rounded-lg border border-borde bg-inactivo-suave px-4.5 py-3.5"
    >
      <div className="flex items-center gap-2.5">
        <FormaCategoria categoria={parametro.categoria} />
        <h2 className="flex-1 font-titulos text-cuerpo font-semibold">{nombre}</h2>
        <Lock size={18} className="text-inactivo" aria-hidden="true" />
      </div>
      <p className="mt-1.5 text-cuerpo-sm text-inactivo">
        No aplica: esta categoría no participa en la detección de concentraciones.
        {parametro.nota ? ` ${parametro.nota}` : ''}
      </p>
    </section>
  )
}
