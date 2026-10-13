import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { reiniciarAuthSimulada } from '@/mocks/authSimulado'
import { fijarEscenario } from '@/mocks/escenario'
import { server } from '@/mocks/server'

// Margen para máquinas lentas: las pruebas de pantalla corren en paralelo.
configure({ asyncUtilTimeout: 5000 })

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  reiniciarAuthSimulada()
  fijarEscenario('normal')
})
afterAll(() => server.close())
