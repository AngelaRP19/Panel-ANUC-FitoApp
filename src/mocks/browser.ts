import { setupWorker } from 'msw/browser'
import { escenarioDesdeUrl } from './escenario'
import { handlers } from './handlers'

escenarioDesdeUrl()

export const worker = setupWorker(...handlers)
