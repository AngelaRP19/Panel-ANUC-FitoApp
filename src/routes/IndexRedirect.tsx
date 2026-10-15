import { Navigate } from 'react-router'
import { PATHS } from './paths'

/** Destino de «/»: el inicio, que muestra el resumen de cada rol (pantallas 16 y 17). */
export function IndexRedirect() {
  return <Navigate to={PATHS.inicio} replace />
}
