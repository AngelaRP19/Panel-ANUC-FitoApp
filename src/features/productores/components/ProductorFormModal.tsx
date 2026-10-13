import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { toast } from '@/components/ui/Toast'
import { MENSAJES } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import { aE164, formatearTelefono } from '@/utils/telefono'
import { useEditarProductor, useRegistrarProductor } from '../hooks'
import { productorSchema, type ProductorValues } from '../schemas'
import type { Productor } from '../types'
import { DesactivarProductorDialog } from './FichaProductor'

interface ProductorFormModalProps {
  /** Sin productor: registrar uno nuevo. */
  productor?: Productor | null
  onClose: () => void
  onGuardado?: (p: Productor) => void
}

/**
 * Registrar / editar productor (artboard 08b): nombre completo y WhatsApp (el chatbot lo
 * reconoce por ese número) y estado. Desactivar desde aquí también pide confirmación.
 */
export function ProductorFormModal({ productor, onClose, onGuardado }: ProductorFormModalProps) {
  const editar = !!productor
  const registrar = useRegistrarProductor()
  const actualizar = useEditarProductor(productor?.id ?? '')
  const mutacion = editar ? actualizar : registrar
  const [pendiente, setPendiente] = useState<ProductorValues | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<ProductorValues>({
    resolver: zodResolver(productorSchema),
    defaultValues: {
      nombre: productor?.nombre ?? '',
      celular: productor ? formatearTelefono(productor.celular) : '',
      activo: productor?.activo ?? true,
    },
  })

  const guardar = (v: ProductorValues) => {
    setPendiente(null)
    mutacion.mutate(
      { nombre: v.nombre.trim(), celular: aE164(v.celular)!, activo: v.activo },
      {
        onSuccess: (p) => {
          if (editar) {
            toast.exito(
              'Datos del productor actualizados',
              'El cambio queda en el registro de actividad.',
            )
          } else {
            toast.exito(
              'Productor registrado',
              `El chatbot ya reconoce el número ${formatearTelefono(p.celular)}.`,
            )
          }
          onGuardado?.(p)
          onClose()
        },
        onError: (error) => {
          if (!esErrorApi(error)) return
          for (const [campo, mensaje] of Object.entries(error.campos)) {
            if (campo === 'nombre' || campo === 'celular') {
              setError(campo, { message: mensaje }, { shouldFocus: true })
            }
          }
        },
      },
    )
  }

  // Pasar de activo a deshabilitado cambia el acceso del productor: se confirma antes.
  const onSubmit = handleSubmit((v) =>
    editar && productor!.activo && !v.activo ? setPendiente(v) : guardar(v),
  )
  const errorGeneral =
    mutacion.isError && !(esErrorApi(mutacion.error) && Object.keys(mutacion.error.campos).length)

  return (
    <>
      <Modal
        open={!pendiente}
        onClose={onClose}
        title={editar ? 'Editar productor' : 'Registrar productor'}
        description={
          editar
            ? 'Para registrar un productor nuevo se usan los mismos dos campos.'
            : 'Registra su nombre y su número de WhatsApp. El chatbot lo reconocerá por ese número.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={mutacion.isPending}>
              Cancelar
            </Button>
            <Button type="submit" form="form-productor" loading={mutacion.isPending}>
              {editar ? 'Guardar cambios' : 'Registrar productor'}
            </Button>
          </>
        }
      >
        <form id="form-productor" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <RequiredLegend />
          {errorGeneral && (
            <Aviso tono="peligro" titulo="No se guardó el productor.">
              {MENSAJES.errorConexionTexto}
            </Aviso>
          )}
          <FormField label="Nombre completo" htmlFor="mp-n" required error={errors.nombre?.message}>
            <Input
              id="mp-n"
              autoComplete="off"
              invalid={!!errors.nombre}
              aria-describedby={errors.nombre ? fieldDescriptionId('mp-n') : undefined}
              {...register('nombre')}
            />
          </FormField>
          <FormField
            label="Teléfono de WhatsApp"
            htmlFor="mp-t"
            required
            error={errors.celular?.message}
            hint="10 dígitos, empieza por 3. El chatbot reconocerá al productor por este número."
          >
            <Input
              id="mp-t"
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              mono
              invalid={!!errors.celular}
              aria-describedby={fieldDescriptionId('mp-t')}
              {...register('celular')}
            />
          </FormField>
          <div className="flex items-center gap-3 rounded-md border border-borde px-3.5 py-3">
            <div className="flex-1">
              <p className="etiqueta" id="mp-estado">
                Estado
              </p>
              <p className="text-cuerpo-sm text-tinta-terciaria">
                Un productor deshabilitado no puede consultar por WhatsApp.
              </p>
            </div>
            <Controller
              control={control}
              name="activo"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  label="Activo"
                  aria-label="Productor activo"
                />
              )}
            />
          </div>
        </form>
      </Modal>
      {productor && (
        <DesactivarProductorDialog
          productor={productor}
          open={!!pendiente}
          cargando={mutacion.isPending}
          onConfirm={() => pendiente && guardar(pendiente)}
          onCancel={() => setPendiente(null)}
        />
      )}
    </>
  )
}
