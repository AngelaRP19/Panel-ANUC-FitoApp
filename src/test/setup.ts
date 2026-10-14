import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { reiniciarAuthSimulada } from '@/mocks/authSimulado'
import { fijarEscenario } from '@/mocks/escenario'
import { reiniciarCasos } from '@/mocks/fixtures/casos'
import { reiniciarFincas } from '@/mocks/fixtures/fincas'
import { reiniciarProductores } from '@/mocks/fixtures/productores'
import { reiniciarUsuarios } from '@/mocks/fixtures/usuarios'
import { server } from '@/mocks/server'

// jsdom no implementa ResizeObserver (lo usan componentes de Radix como Switch).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Margen para máquinas lentas: las pruebas de pantalla corren en paralelo.
configure({ asyncUtilTimeout: 5000 })

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  reiniciarAuthSimulada()
  fijarEscenario('normal')
  reiniciarCasos()
  reiniciarProductores()
  reiniciarFincas()
  reiniciarUsuarios()
  sessionStorage.clear()
})
afterAll(() => server.close())
