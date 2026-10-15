import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'

const TECNICO = 'tecnico@anuc.test'

const filas = () =>
  within(screen.getByRole('table', { name: 'Productores y fincas' }))
    .getAllByRole('row')
    .slice(1)

describe('Productores y fincas de mis casos (técnico)', () => {
  it('lista solo los productores y fincas de los casos del técnico', async () => {
    await renderApp(TECNICO, '/consulta')
    expect(
      await screen.findByRole('heading', { name: 'Productores y fincas de mis casos' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('7 productores · 7 fincas · relacionados con tus 14 casos asignados'),
    ).toBeInTheDocument()
    expect(screen.getByText('Solo consulta')).toBeInTheDocument()
    expect(
      screen.getByText(/Solo ves los productores, fincas y cultivos de los casos que te asignaron/),
    ).toBeInTheDocument()
    await waitFor(() => expect(filas()).toHaveLength(7))
    const texto = filas()
      .map((f) => f.textContent)
      .join(' | ')
    expect(texto).toContain('María Rojas Cárdenas')
    expect(texto).toContain('El Porvenir · Juracambita')
    // Productores de casos de otro técnico (Jhon) no aparecen.
    expect(texto).not.toContain('Gloria Patiño')
    expect(texto).not.toContain('José Ávila')
    expect(screen.getByText('1–7 de 7 productores · 10 por página')).toBeInTheDocument()
    // Sin controles de edición.
    expect(screen.queryByRole('button', { name: /Registrar|Editar|Desactivar/ })).toBeNull()
  })

  it('filtra por vereda, especie, estado de mis casos y búsqueda', async () => {
    const { user } = await renderApp(TECNICO, '/consulta')
    await waitFor(() => expect(filas()).toHaveLength(7))
    await user.selectOptions(screen.getByLabelText('Vereda'), 'CENTRO')
    await waitFor(() => expect(filas()).toHaveLength(2))
    await user.selectOptions(screen.getByLabelText('Vereda'), '')
    await user.selectOptions(screen.getByLabelText('Especie'), 'MARACUYA')
    await waitFor(() => expect(filas()).toHaveLength(1))
    expect(filas()[0]).toHaveTextContent('Luz Marina Pérez')
    await user.selectOptions(screen.getByLabelText('Especie'), '')
    await user.selectOptions(screen.getByLabelText('Estado de mis casos'), 'cerrados')
    await waitFor(() => expect(filas()).toHaveLength(3))
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), '0227')
    await waitFor(() => expect(filas()).toHaveLength(1))
    expect(filas()[0]).toHaveTextContent('Pedro Nel Suárez')
  })

  it('abre la ficha de solo consulta con sus casos y la ubicación', async () => {
    const { user } = await renderApp(TECNICO, '/consulta')
    await user.click(
      await screen.findByRole('button', {
        name: 'María Rojas Cárdenas, finca El Porvenir. Ver datos',
      }),
    )
    const f = await screen.findByRole('dialog', { name: 'María Rojas Cárdenas' })
    expect(within(f).getByText('Solo consulta')).toBeInTheDocument()
    expect(within(f).getByText('310 482 1937')).toBeInTheDocument()
    expect(within(f).getByText('Vereda Juracambita')).toBeInTheDocument()
    expect(within(f).getByText('5.2481, -73.1702')).toBeInTheDocument()
    expect(within(f).getByText('Invernadero norte')).toBeInTheDocument()
    expect(within(f).getByText('Gulupa y granadilla')).toBeInTheDocument()
    for (const c of ['0241', '0230', '0218']) {
      expect(within(f).getByRole('link', { name: `#${c}` })).toHaveAttribute('href', `/casos/${c}`)
    }
    expect(
      within(f).getByRole('img', { name: 'Ubicación de la finca El Porvenir en 5.2481, -73.1702' }),
    ).toBeInTheDocument()
    const mapa = within(f).getByRole('link', { name: /Abrir ubicación en el mapa/ })
    expect(mapa).toHaveAttribute('target', '_blank')
    const google = 'https://www.google.com/maps/search/?api=1&query=5.248100,-73.170200'
    expect(mapa).toHaveAttribute('href', google)
    // Un clic sobre el mapa también abre Google Maps en la finca.
    expect(
      within(f).getByRole('link', {
        name: /^Abrir en Google Maps: Ubicación de la finca El Porvenir/,
      }),
    ).toHaveAttribute('href', google)
    expect(within(f).getByText('Si un dato está mal, avisa al líder técnico.')).toBeInTheDocument()
    expect(within(f).queryByRole('button', { name: /Editar/ })).toBeNull()
  })

  it('una ficha ajena a los casos del técnico no se abre', async () => {
    await renderApp(TECNICO, '/consulta?ficha=p-gloria-patino__f-buenavista')
    await waitFor(() => expect(filas()).toHaveLength(7))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('el líder que entra a /consulta va a Productores', async () => {
    const { router } = await renderApp('lider@anuc.test', '/consulta')
    await waitFor(() => expect(router.state.location.pathname).toBe('/productores'))
  })
})
