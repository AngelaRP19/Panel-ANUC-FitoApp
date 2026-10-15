import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'

const tabla = () => screen.getByRole('table', { name: 'Casos del mapa de vigilancia' })
const filas = () => within(tabla()).getAllByRole('row').slice(1)
const codigos = () => filas().map((f) => within(f).getAllByRole('cell')[0]!.textContent)

describe('Mapa de vigilancia (pantalla 19)', () => {
  it('muestra solo casos con resultado técnico Confirmado u Otra patología', async () => {
    await renderApp(LIDER, '/mapa')
    expect(await screen.findByRole('heading', { name: 'Mapa de vigilancia' })).toBeInTheDocument()
    expect(
      await screen.findByText(
        /casos confirmados · .* · Zetaquirá, Boyacá · solo casos con resultado técnico Confirmado u Otra patología/,
      ),
    ).toBeInTheDocument()
    // Sin clave de Google Maps: aviso, mapa embebido y la tabla con los casos.
    expect(screen.getByText('Los casos se muestran en la tabla.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Mapa de Zetaquirá' })).toBeInTheDocument()

    await waitFor(() => expect(filas().length).toBeGreaterThan(0))
    expect(codigos()).toContain('#0229') // Trips confirmado
    expect(codigos()).not.toContain('#0241') // en revisión, sin diagnóstico
    expect(codigos()).not.toContain('#0226') // no identificado
    const fila0229 = filas().find((f) => f.textContent?.includes('#0229'))!
    expect(fila0229).toHaveTextContent('Trips')
    expect(fila0229).toHaveTextContent(
      /\d · (Sin casos o 1 caso|Casos aislados|Cerca del umbral|Umbral alcanzado)/,
    )
    const botrytis = filas().find((f) => f.textContent?.includes('Botrytis'))
    if (botrytis) expect(botrytis).toHaveTextContent('No participa')
  })

  it('los chips ocultan categorías y la especie y las fechas filtran', async () => {
    const { user, router } = await renderApp(LIDER, '/mapa')
    await waitFor(() => expect(filas().length).toBeGreaterThan(0))
    const chipTrips = screen.getByRole('button', { name: /^Trips \d+$/ })
    expect(chipTrips).toHaveAttribute('aria-pressed', 'true')
    await user.click(chipTrips)
    expect(chipTrips).toHaveAttribute('aria-pressed', 'false')
    expect(router.state.location.search).toContain('ocultas=TRIPS')
    await waitFor(() => expect(codigos()).not.toContain('#0229'))
    await user.click(chipTrips)

    await user.selectOptions(screen.getByLabelText('Especie'), 'MARACUYA')
    await waitFor(() => expect(codigos()).not.toContain('#0229'))
    for (const f of filas()) expect(f).toHaveTextContent('Maracuyá')
    await user.selectOptions(screen.getByLabelText('Especie'), '')

    const desde = screen.getByLabelText(/^Desde/)
    await user.type(desde, '31/02/2026')
    await user.tab()
    expect(await screen.findByText('Fecha no válida')).toBeInTheDocument()
    await user.clear(desde)
    await user.type(desde, '15/09/2026{Enter}')
    await waitFor(() => expect(router.state.location.search).toContain('desde=2026-09-15'))
    await waitFor(() => expect(codigos()).not.toContain('#0216')) // enviado el 1 sep
  })

  it('capa de concentración y tarjeta de la alerta generada', async () => {
    const { user, router } = await renderApp(LIDER, '/mapa')
    const capa = await screen.findByRole('region', { name: 'Capa de concentración' })
    expect(within(capa).getByText('Categoría fija: Trips')).toBeInTheDocument()
    expect(within(capa).getByText('4 · Umbral alcanzado')).toBeInTheDocument()
    const sw = within(capa).getByRole('switch', { name: 'Mostrar capa de concentración' })
    expect(sw).toBeChecked()
    await user.click(sw)
    expect(router.state.location.search).toContain('calor=0')

    const alerta = await screen.findByRole('region', { name: 'Alerta ALR-012' })
    expect(within(alerta).getByText('Posible concentración de Trips')).toBeInTheDocument()
    expect(
      within(alerta).getByText(/4 casos confirmados en 3,5 km · últimos 30 días · Juracambita/),
    ).toBeInTheDocument()
    expect(within(alerta).getByRole('link', { name: 'Revisar alerta' })).toHaveAttribute(
      'href',
      '/alertas/ALR-012',
    )
  })

  it('el técnico ve «Esta sección es solo para el líder técnico»', async () => {
    await renderApp('tecnico@anuc.test', '/mapa')
    expect(
      await screen.findByRole('heading', { name: 'Esta sección es solo para el líder técnico' }),
    ).toBeInTheDocument()
  })
})
