// Handlers de MSW: permiten avanzar el front mientras no exista cada endpoint.
// Un archivo por dominio; los datos viven en mocks/fixtures.
import { alertasHandlers } from './alertas'
import { authHandlers } from './auth'
import { casosHandlers } from './casos'
import { fincasHandlers } from './fincas'
import { inicioHandlers } from './inicio'
import { navegacionHandlers } from './navegacion'
import { productoresHandlers } from './productores'
import { usuariosHandlers } from './usuarios'

export const handlers = [
  ...authHandlers,
  ...navegacionHandlers,
  ...casosHandlers,
  ...productoresHandlers,
  ...fincasHandlers,
  ...usuariosHandlers,
  ...alertasHandlers,
  ...inicioHandlers,
]
