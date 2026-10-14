import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { parametros } from '@/mocks/fixtures/alertas'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'
const trips = () => screen.getByRole('region', { name: 'Trips' })

describe('Parámetros epidemiológicos', () => {
  it('solo Trips es editable y las demás categorías no participan', async () => {
    await renderApp(LIDER, '/parametros')
    expect(
      await screen.findByText(
        'Definen cuándo el sistema genera una alerta de posible concentración de casos confirmados. Solo el líder técnico puede cambiarlos.',
      ),
    ).toBeInTheDocument()
    const t = await screen.findByRole('region', { name: 'Trips' })
    expect(within(t).getByText('Participa en alertas')).toBeInTheDocument()
    expect(within(t).getByLabelText(/^Número mínimo de casos/)).toHaveValue('3')
    expect(within(t).getByLabelText(/^Distancia máxima \(km\)/)).toHaveValue('3,5')
    expect(within(t).getByLabelText(/^Intervalo \(días\)/)).toHaveValue('30')
    expect(t).toHaveTextContent(
      'Se generará una alerta cuando haya al menos 3 casos confirmados de Trips a no más de 3,5 km entre sí, en los últimos 30 días.',
    )
    expect(
      within(t).getByText('Última modificación: 2 sep 2026 · 10:20 · Wilmar Torres'),
    ).toBeInTheDocument()
    expect(within(t).getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()

    expect(screen.getByText('Categorías que no participan')).toBeInTheDocument()
    for (const c of ['Botrytis', 'Roña', 'Fusarium']) {
      expect(screen.getByRole('region', { name: `${c}: no aplica` })).toHaveTextContent(
        'No aplica: esta categoría no participa en la detección de concentraciones.',
      )
    }
    expect(
      screen.getByRole('region', { name: 'Deficiencia de magnesio: no aplica' }),
    ).toHaveTextContent('Es un problema nutricional, no se transmite entre fincas.')
    expect(screen.queryAllByRole('textbox')).toHaveLength(3)
  })

  it('la frase cambia al escribir y restablecer vuelve a los valores vigentes', async () => {
    const { user } = await renderApp(LIDER, '/parametros')
    await screen.findByRole('region', { name: 'Trips' })
    const km = within(trips()).getByLabelText(/^Distancia máxima/)
    await user.clear(km)
    await user.type(km, '2,5')
    expect(trips()).toHaveTextContent('a no más de 2,5 km entre sí')
    await user.clear(km)
    expect(trips()).toHaveTextContent(
      'Completa los tres valores para ver cuándo se generará una alerta.',
    )
    await user.click(within(trips()).getByRole('button', { name: 'Restablecer valores' }))
    expect(km).toHaveValue('3,5')
  })

  it('valida los valores antes de guardar', async () => {
    const { user } = await renderApp(LIDER, '/parametros')
    await screen.findByRole('region', { name: 'Trips' })
    const casos = within(trips()).getByLabelText(/^Número mínimo de casos/)
    await user.clear(casos)
    await user.type(casos, '1')
    const dias = within(trips()).getByLabelText(/^Intervalo/)
    await user.clear(dias)
    await user.type(dias, 'abc')
    await user.click(within(trips()).getByRole('button', { name: 'Guardar cambios' }))
    expect(
      await within(trips()).findByText('Escribe un número entero de 2 o más.'),
    ).toBeInTheDocument()
    expect(
      within(trips()).getByText('Escribe un número de días entre 1 y 365.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('guarda con confirmación y actualiza la última modificación', async () => {
    const { user } = await renderApp(LIDER, '/parametros')
    await screen.findByRole('region', { name: 'Trips' })
    const casos = within(trips()).getByLabelText(/^Número mínimo de casos/)
    await user.clear(casos)
    await user.type(casos, '4')
    await user.click(within(trips()).getByRole('button', { name: 'Guardar cambios' }))
    const dlg = await screen.findByRole('alertdialog', {
      name: '¿Guardar los parámetros de Trips?',
    })
    expect(dlg).toHaveTextContent('al menos 4 casos confirmados de Trips')
    await user.click(within(dlg).getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Parámetros guardados')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        within(trips()).getByText(/^Última modificación: .* · Wilmar Torres$/),
      ).not.toHaveTextContent('2 sep 2026'),
    )
    expect(parametros.find((p) => p.categoria === 'TRIPS')!.num_casos).toBe(4)
  })

  it('una categoría habilitada en la API muestra su formulario sin cambiar código', async () => {
    parametros.find((p) => p.categoria === 'BOTRYTIS')!.habilitada = true
    await renderApp(LIDER, '/parametros')
    const b = await screen.findByRole('region', { name: 'Botrytis' })
    expect(within(b).getByLabelText(/^Número mínimo de casos/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Botrytis: no aplica' })).not.toBeInTheDocument()
  })

  it('el técnico ve «Esta sección es solo para el líder técnico»', async () => {
    await renderApp('tecnico@anuc.test', '/parametros')
    expect(
      await screen.findByRole('heading', { name: 'Esta sección es solo para el líder técnico' }),
    ).toBeInTheDocument()
  })
})
