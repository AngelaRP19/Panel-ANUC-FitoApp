import { useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { Map } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { CheckChips } from '@/components/ui/CheckChips'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input, controlClass } from '@/components/ui/Input'
import { MiniMapa } from '@/components/ui/MiniMapa'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { FILTROS_PRODUCTORES_VACIOS, useProductores } from '@/features/productores'
import { ESPECIE_LABEL, MENSAJES, TIPO_CULTIVO_LABEL, VEREDA_LABEL, etiqueta } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { esErrorApi } from '@/services/apiClient'
import { cn } from '@/utils/cn'
import { latitudEnRango, LATITUD_ZETAQUIRA } from '@/utils/numeros'
import { useEditarFinca, useRegistrarFinca } from '../hooks'
import { fincaSchema, type FincaValues } from '../schemas'
import type { EspecieEnUso, Finca } from '../types'

const VEREDAS = Object.entries(VEREDA_LABEL).map(([value, label]) => ({ value, label }))
const ESPECIES = Object.entries(ESPECIE_LABEL).map(([value, label]) => ({ value, label }))
const TIPOS = Object.entries(TIPO_CULTIVO_LABEL)

const CAMPOS_API: Record<string, keyof FincaValues> = {
  nombre: 'nombre',
  vereda: 'vereda',
  latitud: 'latitud',
  longitud: 'longitud',
  productor_id: 'productor',
}

/** «Granadilla se usa en el caso activo #0230.» */
function textoEnUso(e: EspecieEnUso) {
  const especie = etiqueta(ESPECIE_LABEL, e.especie, e.especie)
  const casos = e.casos.map((c) => `#${c}`).join(', ')
  return e.casos.length === 1
    ? `${especie} se usa en el caso activo ${casos}.`
    : `${especie} se usa en los casos activos ${casos}.`
}

interface FincaFormModalProps {
  /** Sin finca: registrar una nueva. */
  finca?: Finca | null
  onClose: () => void
  onGuardada?: (finca: Finca) => void
}

/**
 * Registrar / editar finca (artboard 09b): nombre, vereda, coordenadas con vista previa del
 * punto y, al editar, el tipo y las especies de cada cultivo. Quitar una especie que usa un
 * caso activo muestra el aviso del diseño y pide «Guardar de todas formas».
 */
export function FincaFormModal({ finca, onClose, onGuardada }: FincaFormModalProps) {
  const editar = !!finca
  const registrar = useRegistrarFinca()
  const actualizar = useEditarFinca(finca?.id ?? '')
  const mutacion = editar ? actualizar : registrar
  const [enUso, setEnUso] = useState<EspecieEnUso[]>([])
  // Solo se registran fincas de productores activos (RQF14).
  const productores = useProductores({
    ...FILTROS_PRODUCTORES_VACIOS,
    estado: 'activo',
    filas: '50',
  })

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FincaValues>({
    resolver: zodResolver(fincaSchema),
    defaultValues: {
      nombre: finca?.nombre ?? '',
      vereda: finca?.vereda ?? '',
      latitud: finca ? String(finca.latitud) : '',
      longitud: finca ? String(finca.longitud) : '',
      productor: '',
      esNueva: !editar,
      cultivos: (finca?.cultivos ?? []).map((c) => ({
        id: c.id,
        nombre: c.nombre,
        tipo: c.tipo,
        especies: [...c.especies],
      })),
    },
  })
  const { fields } = useFieldArray({ control, name: 'cultivos' })
  const [latTexto, lngTexto] = useWatch({ control, name: ['latitud', 'longitud'] })
  const lat = Number(latTexto)
  const lng = Number(lngTexto)
  const coordValidas =
    latTexto !== '' && lngTexto !== '' && Number.isFinite(lat) && Number.isFinite(lng)

  const guardar = (v: FincaValues, forzar = false) =>
    mutacion.mutate(
      {
        nombre: v.nombre.trim(),
        vereda: v.vereda,
        latitud: Number(v.latitud),
        longitud: Number(v.longitud),
        ...(editar
          ? {
              cultivos: v.cultivos.map((c) => ({ id: c.id, tipo: c.tipo, especies: c.especies })),
              forzar,
            }
          : { productor_id: v.productor }),
      },
      {
        onSuccess: (f) => {
          toast.exito(
            editar ? 'Finca actualizada' : 'Finca registrada',
            editar
              ? 'Los cambios quedan en el registro de actividad.'
              : `${f.nombre} ya aparece en la lista. Agrega sus cultivos desde la ficha.`,
          )
          onGuardada?.(f)
          onClose()
        },
        onError: (error) => {
          if (!esErrorApi(error)) return
          if (error.codigo === 'ESPECIE_EN_USO') {
            setEnUso((error.detalle as EspecieEnUso[]) ?? [])
            return
          }
          for (const [campo, mensaje] of Object.entries(error.campos)) {
            const nombre = CAMPOS_API[campo]
            if (nombre) setError(nombre, { message: mensaje }, { shouldFocus: true })
          }
        },
      },
    )

  const onSubmit = handleSubmit((v) => guardar(v, enUso.length > 0))
  const errorGeneral =
    mutacion.isError &&
    esErrorApi(mutacion.error) &&
    mutacion.error.codigo !== 'ESPECIE_EN_USO' &&
    Object.keys(mutacion.error.campos).length === 0

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      position="top"
      title={
        <>
          <span className="mb-0.5 block sobretitulo">
            {editar ? 'Editar finca' : 'Registrar finca'}
          </span>
          {editar ? finca!.nombre : 'Nueva finca'}
        </>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutacion.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="form-finca" loading={mutacion.isPending}>
            {enUso.length > 0
              ? 'Guardar de todas formas'
              : editar
                ? 'Guardar cambios'
                : 'Registrar finca'}
          </Button>
        </>
      }
    >
      <form id="form-finca" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <RequiredLegend />
        {errorGeneral && (
          <Aviso tono="peligro" titulo="No se guardó la finca.">
            {MENSAJES.errorConexionTexto}
          </Aviso>
        )}

        {!editar && (
          <FormField
            label="Productor"
            htmlFor="f-p"
            required
            error={errors.productor?.message}
            hint="Solo se registran fincas de productores activos."
          >
            <select
              id="f-p"
              aria-invalid={!!errors.productor || undefined}
              aria-describedby={fieldDescriptionId('f-p')}
              className={cn(controlClass, 'h-10 cursor-pointer')}
              {...register('productor')}
            >
              <option value="">Selecciona el productor</option>
              {(productores.data?.items ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="Nombre de la finca"
            htmlFor="f-n"
            required
            error={errors.nombre?.message}
            hint="Texto · ej. El Porvenir"
          >
            <Input
              id="f-n"
              invalid={!!errors.nombre}
              aria-describedby={fieldDescriptionId('f-n')}
              {...register('nombre')}
            />
          </FormField>
          <FormField label="Vereda" htmlFor="f-v" required error={errors.vereda?.message}>
            <select
              id="f-v"
              aria-invalid={!!errors.vereda || undefined}
              aria-describedby={errors.vereda ? fieldDescriptionId('f-v') : undefined}
              className={cn(controlClass, 'h-10 cursor-pointer')}
              {...register('vereda')}
            >
              <option value="">Selecciona la vereda</option>
              {VEREDAS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Latitud"
            htmlFor="f-la"
            required
            error={errors.latitud?.message}
            hint="Grados decimales con punto, entre 5.20 y 5.30 · ej. 5.2481"
          >
            <Input
              id="f-la"
              inputMode="decimal"
              mono
              invalid={!!errors.latitud}
              aria-describedby={fieldDescriptionId('f-la')}
              {...register('latitud')}
            />
          </FormField>
          <FormField
            label="Longitud"
            htmlFor="f-lo"
            required
            error={errors.longitud?.message}
            hint="Grados decimales con signo menos · ej. -73.1702"
          >
            <Input
              id="f-lo"
              inputMode="decimal"
              mono
              invalid={!!errors.longitud}
              aria-describedby={fieldDescriptionId('f-lo')}
              {...register('longitud')}
            />
          </FormField>
        </div>

        {coordValidas && !latitudEnRango(lat) && (
          <Aviso tono="adv" titulo="Revisa la latitud.">
            Está fuera del rango habitual de Zetaquirá ({LATITUD_ZETAQUIRA.min.toFixed(2)} a{' '}
            {LATITUD_ZETAQUIRA.max.toFixed(2)}). Puedes guardar de todas formas.
          </Aviso>
        )}

        <div>
          <MiniMapa
            latitud={coordValidas ? lat : null}
            longitud={coordValidas ? lng : null}
            etiqueta="Vista previa de la ubicación con las coordenadas escritas"
            className="h-32.5"
          />
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3 text-cuerpo-sm">
            <span className="text-tinta-terciaria">
              Vista previa: el punto se mueve al cambiar latitud o longitud
            </span>
            {editar && (
              <Link
                to={`${PATHS.mapa}?finca=${encodeURIComponent(finca!.id)}`}
                className="inline-flex items-center gap-1 enlace whitespace-nowrap"
              >
                <Map size={16} aria-hidden="true" />
                Ubicar en el mapa de vigilancia
              </Link>
            )}
          </div>
        </div>

        {fields.map((campo, i) => {
          const avisos = enUso.filter((e) => e.cultivo === campo.nombre)
          return (
            <div key={campo.id} className="flex flex-col gap-2">
              <Controller
                control={control}
                name={`cultivos.${i}.especies`}
                render={({ field, fieldState }) => (
                  <CheckChips
                    legend={`Especies de «${campo.nombre}»`}
                    required
                    opciones={ESPECIES}
                    valores={field.value}
                    onChange={(v) => {
                      field.onChange(v)
                      setEnUso([])
                    }}
                    error={fieldState.error?.message}
                    resaltados={avisos.map((a) => a.especie)}
                    idDescripcion={`aviso-${campo.id}`}
                  >
                    <Controller
                      control={control}
                      name={`cultivos.${i}.tipo`}
                      render={({ field: tipo }) => (
                        <div
                          role="radiogroup"
                          aria-label={`Tipo de «${campo.nombre}»`}
                          className="flex flex-wrap gap-4 text-cuerpo-sm"
                        >
                          {TIPOS.map(([valor, nombre]) => (
                            <label
                              key={valor}
                              className="inline-flex cursor-pointer items-center gap-1.5"
                            >
                              <input
                                type="radio"
                                name={`tipo-${campo.id}`}
                                checked={tipo.value === valor}
                                onChange={() => tipo.onChange(valor)}
                                className="accent-verde-700"
                              />
                              {nombre}
                            </label>
                          ))}
                        </div>
                      )}
                    />
                    {avisos.map((a) => (
                      <Aviso
                        key={a.especie}
                        tono="adv"
                        rol="alert"
                        className="mt-1"
                        titulo={textoEnUso(a)}
                      >
                        <span id={`aviso-${campo.id}`}>
                          Si la quitas, el caso la conserva, pero el chatbot ya no la ofrecerá para
                          este cultivo.
                        </span>
                      </Aviso>
                    ))}
                  </CheckChips>
                )}
              />
            </div>
          )
        })}
      </form>
    </Modal>
  )
}
