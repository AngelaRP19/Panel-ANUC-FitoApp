import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArchiveRestore } from 'lucide-react'
import { z } from 'zod'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { EntradaFecha } from '@/components/ui/EntradaFecha'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/components/ui/Toast'
import { MENSAJES } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import {
  fechaCalendario,
  formatearDia,
  formatearFechaEntrada,
  parsearFechaEntrada,
  sumarDias,
  sumarMeses,
} from '@/utils/fechas'
import { useExtenderConservacion } from '../hooks'
import type { CasoDetalle } from '../types'

const PLAZOS = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: 'fecha', label: 'Hasta una fecha' },
]

const MIN_JUSTIFICACION = 20

/** Nueva fecha («aaaa-mm-dd») según el plazo elegido, o null si la fecha escrita no es válida. */
function nuevaFecha(actual: string, plazo: string, hasta: string) {
  return plazo === 'fecha' ? parsearFechaEntrada(hasta) : sumarMeses(actual, Number(plazo))
}

function crearEsquema(actual: string) {
  return z
    .object({
      plazo: z.string(),
      hasta: z.string(),
      justificacion: z
        .string()
        .trim()
        .min(1, 'Escribe la justificación para extender la conservación.')
        .min(MIN_JUSTIFICACION, `Escribe al menos ${MIN_JUSTIFICACION} caracteres.`),
    })
    .superRefine((v, ctx) => {
      if (v.plazo !== 'fecha') return
      const f = parsearFechaEntrada(v.hasta)
      if (!f) {
        ctx.addIssue({
          code: 'custom',
          path: ['hasta'],
          message: 'Escribe la fecha con el formato dd/mm/aaaa.',
        })
      } else if (f <= actual) {
        ctx.addIssue({
          code: 'custom',
          path: ['hasta'],
          message: 'La nueva fecha debe ser posterior al vencimiento actual.',
        })
      }
    })
}
type Valores = z.infer<ReturnType<typeof crearEsquema>>

/**
 * «Extender conservación del caso #0226» (artboard 04d · pantalla 22): plazo (3, 6, 12 meses
 * o hasta una fecha), nuevo vencimiento en vivo y justificación obligatoria. Disponible para
 * el líder y para el técnico en sus casos cerrados.
 */
export function ExtenderConservacionDialog({
  caso,
  onClose,
}: {
  caso: CasoDetalle
  onClose: () => void
}) {
  const actual = fechaCalendario(caso.vence_en!)
  const extender = useExtenderConservacion(caso.id)
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<Valores>({
    resolver: zodResolver(crearEsquema(actual)),
    defaultValues: {
      plazo: '6',
      hasta: formatearFechaEntrada(sumarMeses(actual, 6)),
      justificacion: '',
    },
  })
  const [plazo, hasta] = useWatch({ control, name: ['plazo', 'hasta'] })
  const nueva = nuevaFecha(actual, plazo, hasta)

  const onSubmit = handleSubmit((v) => {
    const venceEn = nuevaFecha(actual, v.plazo, v.hasta)!
    extender.mutate(
      { venceEn, justificacion: v.justificacion.trim() },
      {
        onSuccess: () => {
          toast.exito(
            'Conservación extendida',
            `Caso #${caso.id} · las evidencias se conservan hasta el ${formatearDia(venceEn)}.`,
          )
          onClose()
        },
        onError: (e) => {
          if (!esErrorApi(e)) return
          if (e.campos.justificacion) setError('justificacion', { message: e.campos.justificacion })
          if (e.campos.vence_en) {
            setValue('plazo', 'fecha')
            setError('hasta', { message: e.campos.vence_en })
          }
        },
      },
    )
  })
  const errorGeneral =
    extender.isError && !(esErrorApi(extender.error) && Object.keys(extender.error.campos).length)

  return (
    <Modal
      open
      onClose={onClose}
      icon={ArchiveRestore}
      iconTone="ok"
      title={
        <>
          Extender conservación del caso <span className="font-mono">#{caso.id}</span>
        </>
      }
      description="Las evidencias y el historial se conservan hasta la fecha de vencimiento de conservación."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={extender.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="form-extender" loading={extender.isPending}>
            Extender conservación
          </Button>
        </>
      }
    >
      <form id="form-extender" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {errorGeneral && (
          <Aviso tono="peligro" titulo="No se extendió la conservación.">
            {esErrorApi(extender.error) ? extender.error.message : MENSAJES.errorConexionTexto}
          </Aviso>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[10px] border border-borde bg-verde-50 px-4 py-3">
            <div className="sobretitulo">Vencimiento actual</div>
            <div className="mt-1 font-semibold tabular-nums">{formatearDia(actual)}</div>
          </div>
          <div
            aria-live="polite"
            className="rounded-[10px] border border-verde-300 bg-verde-100 px-4 py-3"
          >
            <div className="sobretitulo text-verde-800">Nuevo vencimiento</div>
            <div className="mt-1 font-semibold tabular-nums">
              {nueva && nueva > actual ? formatearDia(nueva) : '—'}
            </div>
          </div>
        </div>
        <RequiredLegend />
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Extender por" htmlFor="ext-plazo" required>
            <Select
              id="ext-plazo"
              options={PLAZOS}
              {...register('plazo', {
                onChange: (e: { target: { value: string } }) => {
                  if (e.target.value !== 'fecha') {
                    setValue(
                      'hasta',
                      formatearFechaEntrada(sumarMeses(actual, Number(e.target.value))),
                    )
                  }
                },
              })}
            />
          </FormField>
          <FormField
            label="Nueva fecha de vencimiento"
            htmlFor="ext-hasta"
            error={errors.hasta?.message}
            hint={
              plazo === 'fecha'
                ? 'Formato dd/mm/aaaa'
                : 'Formato dd/mm/aaaa · se calcula con el plazo'
            }
          >
            <EntradaFecha
              id="ext-hasta"
              readOnly={plazo !== 'fecha'}
              invalid={!!errors.hasta}
              aria-describedby={fieldDescriptionId('ext-hasta')}
              value={hasta}
              minimo={sumarDias(actual, 1)}
              onElegirFecha={(f) =>
                setValue('hasta', formatearFechaEntrada(f), {
                  shouldValidate: isSubmitted,
                  shouldDirty: true,
                })
              }
              {...register('hasta')}
            />
          </FormField>
        </div>
        <FormField
          label="Justificación"
          htmlFor="ext-just"
          required
          error={errors.justificacion?.message}
          hint="Mínimo 20 caracteres · ej. «El productor pidió segunda visita en diciembre»."
        >
          <Textarea
            id="ext-just"
            rows={3}
            placeholder="Explica por qué se deben conservar las evidencias más tiempo"
            invalid={!!errors.justificacion}
            aria-describedby={fieldDescriptionId('ext-just')}
            {...register('justificacion')}
          />
        </FormField>
        <p className="text-nota text-tinta-terciaria">
          La extensión queda registrada en el historial del caso con tu nombre, la fecha y la
          justificación.
        </p>
      </form>
    </Modal>
  )
}
