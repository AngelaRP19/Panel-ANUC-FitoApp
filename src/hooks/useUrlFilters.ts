import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Filtros, búsqueda y página en la URL, para que «atrás» y los enlaces compartidos funcionen.
 * `defaults` define las claves y su valor por defecto (que no se escribe en la URL).
 *
 *   const { filtros, setFiltros, limpiar } = useUrlFilters({ q: '', estado: 'todos', page: '1' })
 */
export function useUrlFilters<T extends Record<string, string>>(defaultsProp: T) {
  const [params, setParams] = useSearchParams()
  // `defaults` suele ser un objeto literal nuevo en cada render: se estabiliza por contenido.
  const claveDefaults = JSON.stringify(defaultsProp)
  const defaults = useMemo(() => JSON.parse(claveDefaults) as T, [claveDefaults])

  const filtros = useMemo(() => {
    const actual = { ...defaults }
    for (const clave of Object.keys(defaults) as (keyof T)[]) {
      const valor = params.get(clave as string)
      if (valor !== null) actual[clave] = valor as T[keyof T]
    }
    return actual
  }, [params, defaults])

  /** Cambia uno o varios filtros. Cualquier cambio que no sea de página vuelve a la página 1. */
  const setFiltros = useCallback(
    (cambios: Partial<T>) => {
      setParams(
        (prev) => {
          const siguiente = new URLSearchParams(prev)
          for (const [clave, valor] of Object.entries(cambios)) {
            if (valor === undefined || valor === '' || valor === defaults[clave]) {
              siguiente.delete(clave)
            } else {
              siguiente.set(clave, valor)
            }
          }
          if (!('page' in cambios) && 'page' in defaults) siguiente.delete('page')
          return siguiente
        },
        { replace: true },
      )
    },
    [setParams, defaults],
  )

  /** Quita todos los filtros conocidos (botón «Limpiar filtros»). */
  const limpiar = useCallback(() => {
    setParams(
      (prev) => {
        const siguiente = new URLSearchParams(prev)
        Object.keys(defaults).forEach((clave) => siguiente.delete(clave))
        return siguiente
      },
      { replace: true },
    )
  }, [setParams, defaults])

  /** Número de filtros con un valor distinto del predeterminado (sin contar la página). */
  const activos = (Object.keys(defaults) as (keyof T)[]).filter(
    (k) => k !== 'page' && filtros[k] !== defaults[k],
  ).length

  return { filtros, setFiltros, limpiar, activos }
}
