import { useState } from 'react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { esErrorApi } from '@/services/apiClient'
import { useAsignarTecnico, useTecnicosAsignables } from '../hooks'
import type { CasoResumen, TecnicoAsignable } from '../types'

/** «Técnica · 5 casos activos, 4 en revisión» (carga del técnico, artboard 03b). */
function textoCarga(t: TecnicoAsignable) {
  const rol = t.rol === 'LIDER_TECNICO' ? 'Líder técnico' : 'Técnico'
  if (t.activos === 0) return `${rol} · 0 casos activos`
  const activos = t.activos === 1 ? '1 caso activo' : `${t.activos} casos activos`
  return `${rol} · ${activos}, ${t.en_revision} en revisión`
}

interface AsignarTecnicoPanelProps {
  caso: CasoResumen
  onCancelar: () => void
  onAsignado: (tecnico: TecnicoAsignable) => void
}

/**
 * Elegir el técnico de un caso (solo líder). Lista solo cuentas activas con su carga.
 * Al asignar un caso Pendiente de revisión, pasa a En revisión.
 */
export function AsignarTecnicoPanel({ caso, onCancelar, onAsignado }: AsignarTecnicoPanelProps) {
  const { data: tecnicos, isPending, isError, refetch } = useTecnicosAsignables()
  const asignar = useAsignarTecnico()
  const [elegido, setElegido] = useState('')
  const [sinEleccion, setSinEleccion] = useState(false)
  const reasignar = !!caso.tecnico
  const opciones = (tecnicos ?? []).filter((t) => t.id !== caso.tecnico?.id)

  const guardar = () => {
    const tecnico = opciones.find((t) => t.id === elegido)
    if (!tecnico) return setSinEleccion(true)
    asignar.mutate(
      { idCaso: caso.id, tecnicoId: tecnico.id },
      { onSuccess: () => onAsignado(tecnico) },
    )
  }

  return (
    <fieldset className="m-0 flex flex-col gap-2 rounded-md border border-borde px-3.5 pt-1 pb-3">
      <legend className="px-1 etiqueta">
        {reasignar ? 'Reasignar a otro técnico' : 'Elige el técnico'}
      </legend>

      {isPending &&
        [1, 2, 3].map((i) => <Skeleton key={i} style={{ height: 52, width: '100%' }} />)}
      {isError && (
        <Aviso tono="peligro" titulo="No se pudo cargar la lista de técnicos.">
          <Button variant="text" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </Aviso>
      )}

      {opciones.map((t) => (
        <label
          key={t.id}
          className="flex cursor-pointer items-center gap-3 rounded-md border border-borde-control bg-blanco px-2.5 py-2 hover:bg-verde-50 has-[:checked]:border-2 has-[:checked]:border-verde-700 has-[:checked]:bg-verde-50 has-[:checked]:px-[9px] has-[:checked]:py-[7px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-verde-600"
        >
          <input
            type="radio"
            name="tecnico-asignado"
            value={t.id}
            checked={elegido === t.id}
            onChange={() => {
              setElegido(t.id)
              setSinEleccion(false)
            }}
            className="size-4.5 flex-none accent-verde-700 focus-visible:outline-none"
          />
          <span className="flex flex-col">
            <span className="text-cuerpo-sm font-semibold">{t.nombre}</span>
            <span className="text-nota text-tinta-terciaria">{textoCarga(t)}</span>
          </span>
        </label>
      ))}

      {sinEleccion && (
        <p role="alert" className="text-nota font-medium text-peligro">
          Elige el técnico que atenderá el caso.
        </p>
      )}
      {asignar.isError && (
        <Aviso tono="peligro" titulo="No se guardó la asignación.">
          {esErrorApi(asignar.error) ? asignar.error.message : null}
        </Aviso>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="text" size="sm" onClick={onCancelar} disabled={asignar.isPending}>
          Cancelar
        </Button>
        <Button size="sm" onClick={guardar} loading={asignar.isPending}>
          Guardar asignación
        </Button>
      </div>
    </fieldset>
  )
}
