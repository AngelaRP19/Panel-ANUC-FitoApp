// Handlers de MSW: permiten avanzar el front mientras no exista cada endpoint.
// Un archivo por dominio; los datos viven en mocks/fixtures.
import { authHandlers } from './auth'
import { inicioHandlers } from './inicio'
import { navegacionHandlers } from './navegacion'

export const handlers = [...authHandlers, ...navegacionHandlers, ...inicioHandlers]
