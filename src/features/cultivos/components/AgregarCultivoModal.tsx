import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { CheckChips } from '@/components/ui/CheckChips'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { ESPECIE_LABEL, MENSAJES, TIPO_CULTIVO_LABEL } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import type { Especie, TipoCultivo } from '@/types/enums'
import { useAgregarCultivo } from '../hooks'
import { cultivoSchema, type CultivoValues } from '../schemas'

const ESPECIES = Object.entries(ESPECIE_LABEL).map(([value, label]) => ({ value, label }))

interface AgregarCultivoModalProps {
  finca: { id: string; nombre: string }
  onClose: () => void
}

/**
 * Agregar cultivo a una finca: nombre, tipo (Invernadero / Campo abierto) y especies (mínimo
 * una). El chatbot ofrece al productor las especies de sus cultivos.
 */
export function AgregarCultivoModal({ finca, onClose }: AgregarCultivoModalProps) {
  const agregar = useAgregarCultivo(finca.id)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CultivoValues>({
    resolver: zodResolver(cultivoSchema),
    defaultValues: { nombre: '', tipo: '', especies: [] },
  })

  const onSubmit = handleSubmit((v) =>
    agregar.mutate(
      { nombre: v.nombre.trim(), tipo: v.tipo as TipoCultivo, especies: v.especies as Especie[] },
      {
        onSuccess: () => {
          toast.exito(
            'Cultivo agregado',
            `El chatbot ya ofrece «${v.nombre.trim()}» para la finca ${finca.nombre}.`,
          )
          onClose()
        },
        onError: (error) => {
          if (!esErrorApi(error)) return
          for (const [campo, mensaje] of Object.entries(error.campos)) {
            if (campo === 'nombre' || campo === 'tipo' || campo === 'especies') {
              setError(campo, { message: mensaje }, { shouldFocus: true })
            }
          }
        },
      },
    ),
  )
  const errorGeneral =
    agregar.isError && !(esErrorApi(agregar.error) && Object.keys(agregar.error.campos).length)

  return (
    <Modal
      open
      onClose={onClose}
      position="top"
      title="Agregar cultivo"
      description={`Finca ${finca.nombre}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={agregar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="form-cultivo" loading={agregar.isPending}>
            Agregar cultivo
          </Button>
        </>
      }
    >
      <form id="form-cultivo" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <RequiredLegend />
        {errorGeneral && (
          <Aviso tono="peligro" titulo="No se agregó el cultivo.">
            {MENSAJES.errorConexionTexto}
          </Aviso>
        )}
        <FormField
          label="Nombre del cultivo"
          htmlFor="c-n"
          required
          error={errors.nombre?.message}
          hint="Cómo lo llama el productor · ej. Invernadero norte, Lote de abajo"
        >
          <Input
            id="c-n"
            invalid={!!errors.nombre}
            aria-describedby={fieldDescriptionId('c-n')}
            {...register('nombre')}
          />
        </FormField>
        <fieldset
          className="m-0 flex flex-col gap-1.5 border-0 p-0"
          aria-describedby={errors.tipo ? 'c-tipo-error' : undefined}
        >
          <legend className="mb-1.5 p-0 etiqueta">
            Tipo de cultivo{' '}
            <span className="text-peligro" aria-hidden="true">
              *
            </span>
          </legend>
          <div className="flex flex-wrap gap-4 text-cuerpo-sm">
            {Object.entries(TIPO_CULTIVO_LABEL).map(([valor, nombre]) => (
              <label key={valor} className="inline-flex cursor-pointer items-center gap-1.5">
                <input
                  type="radio"
                  value={valor}
                  className="accent-verde-700"
                  {...register('tipo')}
                />
                {nombre}
              </label>
            ))}
          </div>
          {errors.tipo && (
            <span
              id="c-tipo-error"
              role="alert"
              className="flex gap-1.5 text-nota font-medium text-peligro"
            >
              <AlertCircle size={16} className="mt-px shrink-0" aria-hidden="true" />
              {errors.tipo.message}
            </span>
          )}
        </fieldset>
        <Controller
          control={control}
          name="especies"
          render={({ field, fieldState }) => (
            <CheckChips
              legend="Especies"
              required
              opciones={ESPECIES}
              valores={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </form>
    </Modal>
  )
}
