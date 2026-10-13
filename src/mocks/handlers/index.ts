// Handlers de MSW: permiten avanzar el front mientras no exista cada endpoint.
// Un archivo por dominio; los datos viven en mocks/fixtures.
import { authHandlers } from './auth'
import { casosHandlers } from './casos'
import { inicioHandlers } from './inicio'
import { navegacionHandlers } from './navegacion'
import { productoresHandlers } from './productores'

export const handlers = [
  ...authHandlers,
  ...navegacionHandlers,
  ...casosHandlers,
  ...productoresHandlers,
  ...inicioHandlers,
]
