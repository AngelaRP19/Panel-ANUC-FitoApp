import { useEffect, useState, type ReactNode } from 'react'
import { useForm, useWatch, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Check,
  CircleHelp,
  MapPin,
  RotateCcw,
  Shuffle,
  UserRound,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { fieldDescriptionId, FormField } from '@/components/ui/FormField'
import { controlClass } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/components/ui/Toast'
import { CATEGORIA_LABEL, MENSAJES, etiqueta } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import type { Categoria, ResultadoTecnico } from '@/types/enums'
import { cn } from '@/utils/cn'
import { useRegistrarDiagnostico } from '../hooks'
import { diagnosticoSchema, type DiagnosticoValues } from '../schemas'
import type { CasoDetalle } from '../types'

const CATEGORIAS = Object.keys(CATEGORIA_LABEL) as Categoria[]

/** Campos del formulario ↔ campos que marca el backend. */
const CAMPOS_API: Record<string, keyof DiagnosticoValues> = {
  resultado_tecnico: 'resultado',
  categoria_determinada: 'categoria',
  motivo_visita: 'motivo',
  descripcion: 'descripcion',
  observaciones: 'observaciones',
}

const claveBorrador = (id: string) => `anuc.borrador-diagnostico.${id}`

function leerBorrador(id: string): DiagnosticoValues | null {
  try {
    const t = sessionStorage.getItem(claveBorrador(id))
    return t ? (JSON.parse(t) as DiagnosticoValues) : null
  } catch {
    return null
  }
}
function guardarBorrador(id: string, v: DiagnosticoValues | null) {
  try {
    if (v) sessionStorage.setItem(claveBorrador(id), JSON.stringify(v))
    else sessionStorage.removeItem(claveBorrador(id))
  } catch {
    /* sin almacenamiento: el borrador vive solo en el formulario */
  }
}

interface OpcionResultadoProps {
  valor: ResultadoTecnico
  titulo: string
  descripcion: string
  icono: LucideIcon
  color: string
  seleccionado: boolean
  registro: UseFormRegisterReturn<'resultado'>
  /** Campo que se despliega al elegir esta opción. */
  children?: ReactNode
}

/** Opción del resultado técnico (pf-opcion): tarjeta con radio, icono, título y descripción. */
function OpcionResultado({
  valor,
  titulo,
  descripcion,
  icono: Icono,
  color,
  seleccionado,
  registro,
  children,
}: OpcionResultadoProps) {
  return (
    <div
      className={cn(
        'rounded-md border bg-blanco',
        seleccionado
          ? 'border-2 border-verde-700 bg-verde-50'
          : 'border-borde-control hover:bg-verde-50',
      )}
    >
      <label
        className={cn(
          'flex cursor-pointer items-start gap-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-verde-600',
          seleccionado ? 'p-[11px]' : 'p-3',
        )}
      >
        <input
          type="radio"
          value={valor}
          className="mt-0.5 size-4.5 flex-none accent-verde-700 focus-visible:outline-none"
          {...registro}
        />
        <span className="flex flex-col">
          <span className={cn('flex items-center gap-1.5 text-cuerpo-sm font-semibold', color)}>
            <Icono size={16} strokeWidth={1.75} aria-hidden="true" />
            {titulo}
          </span>
          <span className="text-nota text-tinta-terciaria">{descripcion}</span>
        </span>
      </label>
      {seleccionado && children && <div className="px-3 pb-3.5 pl-10.5">{children}</div>}
    </div>
  )
}

interface FormDiagnosticoProps {
  caso: CasoDetalle
  usuarioNombre: string
}

/**
 * «Resultado técnico · decisión humana» (artboards 04, 04b, 12c · RQF22, RQF23). Solo se muestra
 * con el caso En revisión: guardar deja el caso en Registrado, y desde ahí el diagnóstico queda en
 * solo lectura y únicamente se puede cerrar el caso (D-22). El borrador se conserva en
 * sessionStorage (recargas y caídas de conexión) hasta que se guarda.
 */
export function FormDiagnostico({ caso, usuarioNombre }: FormDiagnosticoProps) {
  const registrar = useRegistrarDiagnostico(caso.id)
  const [intentoFallido, setIntentoFallido] = useState(false)

  const p = caso.preliminar
  const sugerida = p?.resultado === 'PRELIMINAR' ? p.categoria : null
  // P-04: «Confirmado» solo cuando hubo una identificación preliminar clara.
  const permiteConfirmar = !!sugerida
  const d = caso.diagnostico

  const guardados: DiagnosticoValues = {
    resultado: d?.resultado_tecnico ?? '',
    categoria: d?.categoria_determinada ?? '',
    motivo: d?.motivo_visita ?? '',
    descripcion: d?.descripcion ?? '',
    observaciones: d?.observaciones ?? '',
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<DiagnosticoValues>({
    resolver: zodResolver(diagnosticoSchema),
    defaultValues: guardados,
  })

  // Un borrador sin guardar (recarga o caída de conexión) tiene prioridad sobre lo registrado.
  // Se restaura una sola vez al montar; los valores guardados siguen siendo la referencia de
  // «cambios sin guardar».
  useEffect(() => {
    const borrador = leerBorrador(caso.id)
    if (borrador) {
      // Borradores viejos pueden traer campos que ya no existen (responsable): se ignoran.
      const { resultado, categoria, motivo, descripcion, observaciones } = borrador
      reset(
        { resultado, categoria, motivo, descripcion, observaciones },
        { keepDefaultValues: true },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caso.id])

  const valores = useWatch({ control }) as DiagnosticoValues
  useEffect(() => {
    if (isDirty) guardarBorrador(caso.id, valores)
  }, [valores, isDirty, caso.id])

  const resultado = valores.resultado

  const enviar = handleSubmit(
    (v) => {
      setIntentoFallido(false)
      registrar.mutate(
        {
          resultado_tecnico: v.resultado as ResultadoTecnico,
          categoria_determinada:
            v.resultado === 'OTRA_PATOLOGIA' ? (v.categoria as Categoria) : null,
          motivo_visita: v.resultado === 'REQUIERE_VISITA' ? v.motivo.trim() : null,
          descripcion: v.descripcion.trim(),
          observaciones: v.observaciones.trim(),
        },
        {
          onSuccess: () => {
            // El caso pasa a Registrado y el panel cambia al diagnóstico en solo lectura.
            guardarBorrador(caso.id, null)
            toast.exito('Diagnóstico guardado', `Caso #${caso.id} · ya puedes cerrar el caso.`)
          },
          onError: (error) => {
            if (!esErrorApi(error)) return
            for (const [campo, mensaje] of Object.entries(error.campos)) {
              const nombre = CAMPOS_API[campo]
              if (nombre) setError(nombre, { message: mensaje }, { shouldFocus: true })
            }
          },
        },
      )
    },
    () => setIntentoFallido(true),
  )

  const sinConexion = (e: unknown) => esErrorApi(e) && e.codigo === 'RED'
  const errorGuardar = registrar.error

  const nombreCat = (c: string) => etiqueta(CATEGORIA_LABEL, c)

  return (
    <section
      aria-labelledby="t-diag"
      className="rounded-lg border border-verde-300 bg-blanco shadow-1"
    >
      <div className="px-6 pt-5">
        <p className="sobretitulo">Resultado técnico · decisión humana</p>
        <h2 id="t-diag" className="mt-1 titulo-h2">
          Registrar diagnóstico técnico
        </h2>
      </div>

      <form noValidate onSubmit={enviar} className="flex flex-col gap-5 px-6 pt-5 pb-6">
        {sinConexion(errorGuardar) ? (
          <Aviso tono="peligro" titulo="Se perdió la conexión." icono={WifiOff}>
            Tu diagnóstico escrito no se ha perdido.{' '}
            <Button variant="text" size="sm" type="submit">
              <RotateCcw aria-hidden="true" />
              {MENSAJES.reintentar}
            </Button>
          </Aviso>
        ) : (
          (intentoFallido || registrar.isError) && (
            <Aviso tono="peligro" titulo="No se guardó el diagnóstico.">
              {registrar.isError && esErrorApi(errorGuardar) && errorGuardar.status === 409
                ? errorGuardar.message
                : 'Revisa el campo marcado.'}
            </Aviso>
          )
        )}

        <fieldset
          className="m-0 flex flex-col gap-2 border-0 p-0"
          aria-describedby={errors.resultado ? 'diag-resultado-error' : undefined}
        >
          <legend className="mb-2 p-0 etiqueta">
            Resultado{' '}
            <span className="text-peligro" aria-hidden="true">
              *
            </span>
          </legend>
          {permiteConfirmar && (
            <OpcionResultado
              valor="CONFIRMADO"
              titulo="Confirmado"
              descripcion={`La identificación preliminar (${nombreCat(sugerida!)}) es correcta.`}
              icono={Check}
              color="text-verde-700"
              seleccionado={resultado === 'CONFIRMADO'}
              registro={register('resultado')}
            />
          )}
          <OpcionResultado
            valor="OTRA_PATOLOGIA"
            titulo="Otra patología"
            descripcion="Determinaste otra categoría fitosanitaria."
            icono={Shuffle}
            color="text-revision"
            seleccionado={resultado === 'OTRA_PATOLOGIA'}
            registro={register('resultado')}
          >
            <FormField
              label="Categoría fitosanitaria determinada"
              htmlFor="diag-cat"
              required
              error={errors.categoria?.message}
            >
              <select
                id="diag-cat"
                aria-invalid={!!errors.categoria || undefined}
                aria-describedby={errors.categoria ? fieldDescriptionId('diag-cat') : undefined}
                className={cn(controlClass, 'h-10 cursor-pointer')}
                {...register('categoria')}
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIAS.filter((c) => c !== sugerida).map((c) => (
                  <option key={c} value={c}>
                    {nombreCat(c)}
                  </option>
                ))}
              </select>
            </FormField>
          </OpcionResultado>
          <OpcionResultado
            valor="NO_IDENTIFICADO"
            titulo="No identificado"
            descripcion="Tampoco puedes determinar la categoría con esta información."
            icono={CircleHelp}
            color="text-neutro"
            seleccionado={resultado === 'NO_IDENTIFICADO'}
            registro={register('resultado')}
          />
          <OpcionResultado
            valor="REQUIERE_VISITA"
            titulo="Requiere visita"
            descripcion="Necesitas ir a la finca antes de decidir."
            icono={MapPin}
            color="text-advertencia"
            seleccionado={resultado === 'REQUIERE_VISITA'}
            registro={register('resultado')}
          >
            <FormField
              label="Motivo de la visita"
              htmlFor="diag-motivo"
              required
              error={errors.motivo?.message}
            >
              <Textarea
                id="diag-motivo"
                rows={3}
                placeholder="Ej.: verificar el interior del fruto y la humedad del invernadero"
                invalid={!!errors.motivo}
                aria-describedby={errors.motivo ? fieldDescriptionId('diag-motivo') : undefined}
                {...register('motivo')}
              />
            </FormField>
          </OpcionResultado>
          {errors.resultado && (
            <span
              id="diag-resultado-error"
              role="alert"
              className="text-nota font-medium text-peligro"
            >
              {errors.resultado.message}
            </span>
          )}
        </fieldset>

        <FormField label="Descripción" htmlFor="diag-desc">
          <Textarea
            id="diag-desc"
            rows={3}
            placeholder="Qué observaste en las evidencias y en el cuestionario"
            {...register('descripcion')}
          />
        </FormField>
        <FormField label="Observaciones y recomendación" htmlFor="diag-obs">
          <Textarea
            id="diag-obs"
            rows={3}
            placeholder="Recomendación para el productor u otras notas"
            {...register('observaciones')}
          />
        </FormField>

        {/* D-02: quien diagnostica es siempre el técnico asignado; no hay selector. */}
        <div className="flex flex-col gap-1.5">
          <span id="diag-resp" className="etiqueta">
            Técnico responsable
          </span>
          <div
            aria-labelledby="diag-resp"
            role="group"
            className="flex h-10 items-center gap-2 rounded-sm border border-borde bg-inactivo-suave px-3 text-cuerpo-sm"
          >
            <UserRound size={16} aria-hidden="true" />
            {`${usuarioNombre} (tú)`}
          </div>
          <span className="text-nota text-tinta-terciaria">
            Solo el líder técnico puede reasignar el caso.
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button type="submit" loading={registrar.isPending} aria-describedby="ayuda-guardar">
            Guardar diagnóstico
          </Button>
          <p id="ayuda-guardar" className="text-nota text-tinta-terciaria">
            Al guardar, el caso pasa a Registrado: el diagnóstico ya no se puede editar ni el caso
            reasignarse, y solo queda cerrarlo.
          </p>
        </div>
      </form>
    </section>
  )
}
