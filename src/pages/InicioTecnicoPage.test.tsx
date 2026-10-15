import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { casos } from '@/mocks/fixtures/casos'
import { renderApp } from '@/test/renderApp'

const TECNICO = 'tecnico@anuc.test'

// «Ahora» del diseño: lunes 28 sep 2026 · 15:30 (Bogotá).
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-28T15:30:00-05:00'))
})
afterEach(() => vi.useRealTimers())

const mios = () => casos.filter((c) => c.tecnico?.id === 'u-ana')

describe('Inicio del técnico (pantalla 17)', () => {
  it('saluda, avisa que solo ve sus casos y muestra sus indicadores', async () => {
    await renderApp(TECNICO, '/')
    expect(await screen.findByRole('heading', { name: 'Hola, Ana Lucía' })).toBeInTheDocument()
    const enRevision = mios().filter((c) => c.estado === 'EN_REVISION').length
    expect(
      screen.getByText(`Lunes, 28 de septiembre de 2026 · tienes ${enRevision} casos en revisión`),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Revisar mis casos' })).toHaveAttribute(
      'href',
      '/casos?estado=EN_REVISION',
    )
    expect(screen.getByText(/Solo ves los casos que el líder técnico te asignó/)).toHaveTextContent(
      'pídele a Wilmar Torres que te lo asigne',
    )

    const kpiRevision = screen.getByRole('link', { name: /casos tuyos en revisión/ })
    expect(within(kpiRevision).getByText(String(enRevision))).toBeInTheDocument()
    const registrado = screen.getByRole('link', { name: /registrado, falta cerrarlo/ })
    expect(
      within(registrado).getByText('#0230 con diagnóstico guardado, falta cerrar'),
    ).toBeInTheDocument()
    expect(screen.getByText('Cerrados por ti en septiembre')).toBeInTheDocument()
    expect(screen.getByText('Próximos a vencer')).toBeInTheDocument()
  })

  it('lista sus casos por atender y sus diagnósticos recientes', async () => {
    await renderApp(TECNICO, '/inicio')
    const atender = await screen.findByRole('region', { name: 'Tus casos por atender' })
    const enlaces = within(atender).getAllByRole('link', { name: /^Caso #/ })
    const porAtender = mios().filter((c) => c.estado === 'EN_REVISION' || c.estado === 'REGISTRADO')
    expect(enlaces).toHaveLength(porAtender.length)
    // Primero los en revisión que más esperan; el registrado al final.
    expect(enlaces[0]).toHaveAccessibleName(/^Caso #0227, Pedro Nel Suárez, En revisión/)
    expect(enlaces.at(-1)).toHaveAccessibleName(/^Caso #0230, .*, Registrado/)
    // Ningún caso de otro técnico.
    expect(within(atender).queryByText(/#0238/)).toBeNull()

    const recientes = screen.getByRole('region', { name: 'Tus diagnósticos recientes' })
    const lista = within(recientes).getAllByRole('listitem')
    expect(lista.length).toBeGreaterThan(0)
    expect(lista.length).toBeLessThanOrEqual(3)
    expect(within(lista[0]!).getByRole('link', { name: /^#0\d{3}$/ })).toBeInTheDocument()
  })

  it('el líder que entra a /inicio ve su propio resumen', async () => {
    await renderApp('lider@anuc.test', '/')
    expect(
      await screen.findByRole('heading', { name: 'Resumen fitosanitario' }),
    ).toBeInTheDocument()
  })
})
