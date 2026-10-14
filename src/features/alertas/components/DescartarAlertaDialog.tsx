import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Ban } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { fieldDescriptionId, FormField } from '@/components/ui/FormField'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/components/ui/Toast'
import { CATEGORIA_LABEL, MENSAJES, VEREDA_LABEL } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import { useDescartarAlerta } from '../hooks'
import { descarteSchema, type DescarteValues } from '../schemas'
import type { Alerta } from '../types'

/** «¿Descartar la alerta ALR-012?»: motivo obligatorio y botón de peligro. */
export function DescartarAlertaDialog({
  alerta,
  onClose,
}: {
  alerta: Alerta
  onClose: () => void
}) {
  const descartar = useDescartarAlerta()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DescarteValues>({
    resolver: zodResolver(descarteSchema),
    defaultValues: { justificacion: '' },
  })

  const onConfirm = handleSubmit(({ justificacion }) =>
    descartar.mutate(
      { id: alerta.id, justificacion },
      {
        onSuccess: () => {
          toast.exito('Alerta descartada', `${alerta.id} quedó en el historial como Descartada.`)
          onClose()
        },
      },
    ),
  )

  return (
    <ConfirmDialog
      open
      danger
      icon={Ban}
      title={`¿Descartar la alerta ${alerta.id}?`}
      message={`La posible concentración de ${CATEGORIA_LABEL[alerta.categoria]} en ${VEREDA_LABEL[alerta.vereda]} quedará como Descartada y no se enviará ningún mensaje. Esta acción queda en el historial.`}
      confirmLabel="Descartar alerta"
      loading={descartar.isPending}
      onConfirm={() => void onConfirm()}
      onCancel={onClose}
    >
      {descartar.isError && (
        <Aviso tono="peligro" titulo="No se descartó la alerta.">
          {esErrorApi(descartar.error) ? descartar.error.message : MENSAJES.errorConexionTexto}
        </Aviso>
      )}
      <FormField
        label="Motivo del descarte"
        htmlFor="motivo-descarte"
        required
        error={errors.justificacion?.message}
        hint="Ej.: dos casos eran de la misma finca"
      >
        <Textarea
          id="motivo-descarte"
          rows={3}
          invalid={!!errors.justificacion}
          aria-describedby={fieldDescriptionId('motivo-descarte')}
          {...register('justificacion')}
        />
      </FormField>
    </ConfirmDialog>
  )
}
