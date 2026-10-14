import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { reiniciarAuthSimulada } from '@/mocks/authSimulado'
import { fijarEscenario } from '@/mocks/escenario'
import { reiniciarAlertas } from '@/mocks/fixtures/alertas'
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

// Margen para máquinas lentas o cargadas: las pruebas de pantalla corren en paralelo.
configure({ asyncUtilTimeout: 10_000 })

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  reiniciarAuthSimulada()
  fijarEscenario('normal')
  reiniciarCasos()
  reiniciarProductores()
  reiniciarFincas()
  reiniciarUsuarios()
  reiniciarAlertas()
  sessionStorage.clear()
})
afterAll(() => server.close())
