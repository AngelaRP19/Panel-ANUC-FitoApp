import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import InicioPage from './InicioPage'

function renderInicio() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter([{ path: '/inicio', element: <InicioPage /> }], {
    initialEntries: ['/inicio'],
  })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

describe('InicioPage', () => {
  it('muestra indicadores, pendientes, alertas y carga por técnico', async () => {
    renderInicio()
    const kpi = await screen.findByRole('link', { name: /7 casos pendientes de revisión/ })
    expect(within(kpi).getByText('3 con más de 48 h en espera')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Caso #0236, Gloria Patiño/ })).toHaveAttribute(
      'href',
      '/casos/c-0236',
    )
    expect(screen.getByText('2 días · sin técnico')).toBeInTheDocument()
    expect(screen.getByText('Trips · Centro · falta comunicar')).toBeInTheDocument()
    expect(screen.getByText('2 casos pendientes sin técnico.')).toBeInTheDocument()
  })

  it('permite ver los casos por categoría como tabla', async () => {
    const user = renderInicio()
    await user.click(await screen.findByRole('button', { name: 'Ver como tabla' }))
    const tabla = screen.getByRole('table')
    expect(within(tabla).getByRole('row', { name: 'Trips 9' })).toBeInTheDocument()
  })

  it('muestra error y permite reintentar si falla el resumen', async () => {
    server.use(http.get('/api/v1/panel/resumen', () => HttpResponse.json({}, { status: 500 })))
    renderInicio()
    expect(await screen.findByText('No se pudo cargar el resumen del panel.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
