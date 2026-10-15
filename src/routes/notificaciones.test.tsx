import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { horaNotificacion } from '@/features/notificaciones'
import { renderApp } from '@/test/renderApp'

const campana = (n: number) => screen.findByRole('button', { name: `Notificaciones: ${n} nuevas` })

describe('Notificaciones de la campana (pantalla 18)', () => {
  it('el líder ve sus 4 avisos, las 2 nuevas resaltadas, y los marca como leídos', async () => {
    const { user } = await renderApp('lider@anuc.test', '/casos')
    await user.click(await campana(2))
    const panel = await screen.findByRole('dialog', { name: 'Notificaciones' })
    const avisos = await within(panel).findAllByRole('link', { name: /^(?!Configurar)/ })
    expect(avisos).toHaveLength(4)
    expect(avisos[0]).toHaveTextContent('Caso nuevo sin técnico')
    expect(avisos[0]).toHaveTextContent('#0240 · Pedro Nel Suárez · Trips 77 %')
    expect(avisos[0]).toHaveAccessibleName(/\(nueva\)/)
    expect(avisos[1]).toHaveTextContent('Alerta generada')
    expect(avisos[2]).toHaveTextContent('Caso en revisión')
    expect(avisos[2]).not.toHaveAccessibleName(/\(nueva\)/)
    expect(avisos[3]).toHaveTextContent('Casos próximos a vencer')
    expect(within(panel).getByRole('link', { name: 'Configurar notificaciones' })).toHaveAttribute(
      'href',
      '/mi-cuenta',
    )
    expect(within(panel).getByText('Últimos 7 días')).toBeInTheDocument()

    await user.click(within(panel).getByRole('button', { name: 'Marcar como leídas' }))
    expect(await campana(0)).toBeInTheDocument()
    await waitFor(() =>
      expect(within(panel).queryAllByRole('link', { name: /\(nueva\)/ })).toHaveLength(0),
    )
  })

  it('cada aviso lleva a su pantalla y cierra el panel', async () => {
    const { user, router } = await renderApp('lider@anuc.test', '/casos')
    await user.click(await campana(2))
    const panel = await screen.findByRole('dialog', { name: 'Notificaciones' })
    await user.click(await within(panel).findByRole('link', { name: /Alerta generada/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/alertas/ALR-012'))
    expect(screen.queryByRole('dialog', { name: 'Notificaciones' })).toBeNull()
  })

  it('el técnico ve sus propios avisos', async () => {
    const { user } = await renderApp('tecnico@anuc.test', '/casos')
    await user.click(await campana(2))
    const panel = await screen.findByRole('dialog', { name: 'Notificaciones' })
    expect(await within(panel).findByText('Te asignaron un caso')).toBeInTheDocument()
    expect(within(panel).getByText('Diagnóstico registrado')).toBeInTheDocument()
    expect(within(panel).getByText('Alerta confirmada (consulta)')).toBeInTheDocument()
    expect(within(panel).queryByText('Caso nuevo sin técnico')).toBeNull()
  })

  it('la hora se muestra como en el diseño', () => {
    const ahora = new Date('2026-09-28T15:30:00-05:00')
    expect(horaNotificacion('2026-09-28T07:52:00-05:00', ahora)).toBe('07:52')
    expect(horaNotificacion('2026-09-27T20:00:00-05:00', ahora)).toBe('ayer')
    expect(horaNotificacion('2026-09-26T10:00:00-05:00', ahora)).toBe('26 sep')
  })
})
