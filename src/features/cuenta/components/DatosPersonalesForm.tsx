import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import type { UsuarioSesion } from '@/context/AuthContext'
import { MENSAJES } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import { aE164, formatearTelefono } from '@/utils/telefono'
import { useActualizarMisDatos } from '../hooks'
import { datosSchema, type DatosValues } from '../schemas'
import { textoDatosGuardados } from '../utils'

const valoresDe = (u: UsuarioSesion): DatosValues => ({
  nombre: u.nombre,
  correo: u.correo,
  celular: formatearTelefono(u.celular),
})

/**
 * «Datos personales» (artboards 11 y 12f): nombre, correo (usuario de inicio de sesión) y
 * celular. El rol es de solo lectura: nadie cambia su propio rol.
 */
export function DatosPersonalesForm({ usuario }: { usuario: UsuarioSesion }) {
  const actualizar = useActualizarMisDatos()
  const esLider = usuario.rol === 'LIDER_TECNICO'
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<DatosValues>({ resolver: zodResolver(datosSchema), values: valoresDe(usuario) })

  const onSubmit = handleSubmit((v) => {
    const datos = { nombre: v.nombre.trim(), correo: v.correo.trim(), celular: aE164(v.celular)! }
    actualizar.mutate(datos, {
      onSuccess: (u) => toast.exito('Datos actualizados', textoDatosGuardados(usuario, u)),
      onError: (error) => {
        if (!esErrorApi(error)) return
        for (const [campo, mensaje] of Object.entries(error.campos)) {
          if (campo === 'nombre' || campo === 'correo' || campo === 'celular') {
            setError(campo, { message: mensaje }, { shouldFocus: true })
          }
        }
      },
    })
  })
  const errorGeneral =
    actualizar.isError &&
    !(esErrorApi(actualizar.error) && Object.keys(actualizar.error.campos).length)

  return (
    <section
      aria-labelledby="t-datos"
      className="rounded-lg border border-borde bg-blanco shadow-1 lg:col-span-6"
    >
      <div className="border-b border-borde px-6 py-4">
        <h2 id="t-datos" className="titulo-h2">
          Datos personales
        </h2>
      </div>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4 p-6">
        <RequiredLegend />
        {errorGeneral && (
          <Aviso tono="peligro" titulo="No se guardaron tus datos.">
            {esErrorApi(actualizar.error) ? actualizar.error.message : MENSAJES.errorConexionTexto}
          </Aviso>
        )}
        <FormField label="Nombre completo" htmlFor="mc-n" required error={errors.nombre?.message}>
          <Input
            id="mc-n"
            autoComplete="name"
            invalid={!!errors.nombre}
            aria-describedby={fieldDescriptionId('mc-n')}
            {...register('nombre')}
          />
        </FormField>
        <FormField
          label="Correo electrónico"
          htmlFor="mc-c"
          required
          error={errors.correo?.message}
          hint="Formato nombre@dominio · es tu usuario para iniciar sesión."
        >
          <Input
            id="mc-c"
            type="email"
            autoComplete="email"
            invalid={!!errors.correo}
            aria-describedby={fieldDescriptionId('mc-c')}
            {...register('correo')}
          />
        </FormField>
        <FormField
          label="Celular"
          htmlFor="mc-t"
          required
          error={errors.celular?.message}
          hint="10 dígitos, empieza por 3 · ej. 313 402 7781"
        >
          <Input
            id="mc-t"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            mono
            invalid={!!errors.celular}
            aria-describedby={fieldDescriptionId('mc-t')}
            {...register('celular')}
          />
        </FormField>
        <div className="flex flex-col gap-1.5">
          <span className="etiqueta">Rol</span>
          <p className="flex items-center gap-2 text-cuerpo-sm text-tinta-secundaria">
            <Lock size={16} aria-hidden="true" className="flex-none" />
            {esLider
              ? 'Líder técnico. No puedes cambiar tu propio rol.'
              : 'Técnico. Solo el líder técnico puede cambiar tu rol o desactivar tu cuenta.'}
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-borde pt-4">
          <Button
            variant="secondary"
            onClick={() => reset(valoresDe(usuario))}
            disabled={!isDirty || actualizar.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={actualizar.isPending} disabled={!isDirty}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </section>
  )
}
