import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { adaptadorSimulado } from '@/mocks/authSimulado'
import { notificaciones, usuarios } from '@/mocks/fixtures/usuarios'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'
const TECNICO = 'tecnico@anuc.test'

const seccion = (nombre: string) => screen.getByRole('region', { name: nombre })

describe('Mi cuenta', () => {
  it('muestra los datos del líder con el rol de solo lectura', async () => {
    await renderApp(LIDER, '/mi-cuenta')
    expect(await screen.findByRole('heading', { name: 'Mi cuenta' })).toBeInTheDocument()
    const datos = seccion('Datos personales')
    expect(within(datos).getByLabelText(/^Nombre completo/)).toHaveValue('Wilmar Torres')
    expect(within(datos).getByLabelText(/^Correo electrónico/)).toHaveValue('lider@anuc.test')
    expect(within(datos).getByLabelText(/^Celular/)).toHaveValue('313 402 7781')
    expect(
      within(datos).getByText('Formato nombre@dominio · es tu usuario para iniciar sesión.'),
    ).toBeInTheDocument()
    expect(
      within(datos).getByText('Líder técnico. No puedes cambiar tu propio rol.'),
    ).toBeInTheDocument()
    expect(within(datos).queryByRole('radio')).toBeNull()
    expect(within(datos).getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it('guarda el celular, valida duplicados y cancelar deshace los cambios', async () => {
    const { user } = await renderApp(LIDER, '/mi-cuenta')
    const datos = await screen.findByRole('region', { name: 'Datos personales' })
    const cel = within(datos).getByLabelText(/^Celular/)
    await user.clear(cel)
    await user.type(cel, '3112593046')
    await user.click(within(datos).getByRole('button', { name: 'Guardar cambios' }))
    expect(
      await within(datos).findByText('Este número de celular ya está registrado'),
    ).toBeInTheDocument()

    await user.click(within(datos).getByRole('button', { name: 'Cancelar' }))
    expect(cel).toHaveValue('313 402 7781')

    await user.clear(cel)
    await user.type(cel, '3134027782')
    await user.click(within(datos).getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Datos actualizados')).toBeInTheDocument()
    expect(screen.getByText('Tu celular quedó guardado.')).toBeInTheDocument()
    expect(usuarios.find((u) => u.id === 'u-wilmar')!.celular).toBe('+573134027782')
  })

  it('un cambio de nombre se ve en la cabecera', async () => {
    const { user } = await renderApp(LIDER, '/mi-cuenta')
    const datos = await screen.findByRole('region', { name: 'Datos personales' })
    const nombre = within(datos).getByLabelText(/^Nombre completo/)
    await user.clear(nombre)
    await user.type(nombre, 'Wilmar Andrés Torres')
    await user.click(within(datos).getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Tu nombre quedó guardado.')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getAllByText(/Wilmar Andrés Torres/).length).toBeGreaterThan(0),
    )
  })

  it('el cambio de contraseña exige la actual y cumple las reglas', async () => {
    const { user } = await renderApp(TECNICO, '/mi-cuenta')
    const pass = await screen.findByRole('region', { name: 'Cambiar contraseña' })
    await user.type(within(pass).getByLabelText(/^Nueva contraseña/), 'zeta26')
    await user.click(within(pass).getByRole('button', { name: 'Cambiar contraseña' }))
    expect(await within(pass).findByText('Escribe tu contraseña actual')).toBeInTheDocument()
    expect(
      within(pass).getByText('Usa al menos 8 caracteres, con letras y números'),
    ).toBeInTheDocument()

    await user.type(within(pass).getByLabelText(/^Contraseña actual/), 'otra1234')
    const nueva = within(pass).getByLabelText(/^Nueva contraseña/)
    await user.clear(nueva)
    await user.type(nueva, 'zetaquira2026')
    await user.type(within(pass).getByLabelText(/^Confirmar nueva contraseña/), 'zetaquira2026')
    await user.click(within(pass).getByRole('button', { name: 'Cambiar contraseña' }))
    expect(await within(pass).findByText('La contraseña actual no es correcta')).toBeInTheDocument()

    const actual = within(pass).getByLabelText(/^Contraseña actual/)
    await user.clear(actual)
    await user.type(actual, 'demo1234')
    await user.click(within(pass).getByRole('button', { name: 'Cambiar contraseña' }))
    expect(await screen.findByText('Contraseña actualizada')).toBeInTheDocument()
    expect(actual).toHaveValue('')
    // La nueva contraseña sirve para iniciar sesión.
    await adaptadorSimulado.cerrarSesion()
    await expect(adaptadorSimulado.iniciarSesion(TECNICO, 'zetaquira2026')).resolves.toEqual({
      paso: 'LISTO',
    })
  })

  it('el líder ve sus avisos y guarda las preferencias', async () => {
    const { user } = await renderApp(LIDER, '/mi-cuenta')
    const notif = await screen.findByRole('region', { name: 'Notificaciones' })
    await within(notif).findByText('Casos nuevos sin técnico')
    for (const t of [
      'Cambios de estado en los casos',
      'Alertas epidemiológicas generadas',
      'Casos próximos a vencer',
      'Resumen diario',
    ]) {
      expect(within(notif).getByText(t)).toBeInTheDocument()
    }
    expect(within(notif).queryByText('Casos nuevos asignados a mí')).toBeNull()
    expect(within(notif).getByRole('switch', { name: 'Resumen diario' })).not.toBeChecked()

    await user.click(within(notif).getByRole('switch', { name: 'Resumen diario' }))
    const canales = within(notif).getByRole('group', { name: 'Canales para Resumen diario' })
    await user.click(within(canales).getByRole('checkbox', { name: 'Correo' }))
    await user.click(within(notif).getByRole('button', { name: 'Guardar preferencias' }))
    expect(await within(notif).findByText('Elige al menos un canal.')).toBeInTheDocument()

    await user.click(within(canales).getByRole('checkbox', { name: 'Panel' }))
    await user.click(within(notif).getByRole('button', { name: 'Guardar preferencias' }))
    expect(await screen.findByText('Preferencias guardadas')).toBeInTheDocument()
    const resumen = notificaciones.get('u-wilmar')!.find((a) => a.clave === 'RESUMEN_DIARIO')!
    expect(resumen).toMatchObject({ activo: true, canales: { panel: true, correo: false } })
  })

  it('el técnico ve sus propios avisos con el filtro de vereda', async () => {
    const { user } = await renderApp(TECNICO, '/mi-cuenta')
    expect(
      await screen.findByText(
        'Técnico. Solo el líder técnico puede cambiar tu rol o desactivar tu cuenta.',
      ),
    ).toBeInTheDocument()
    const notif = seccion('Notificaciones')
    await within(notif).findByText('Casos nuevos asignados a mí')
    expect(within(notif).getByText('Alertas epidemiológicas (solo consulta)')).toBeInTheDocument()
    expect(within(notif).getByText('Comentarios del líder técnico')).toBeInTheDocument()
    expect(within(notif).queryByText('Casos nuevos sin técnico')).toBeNull()

    await user.selectOptions(within(notif).getByLabelText('Solo de la vereda'), 'JURACAMBITA')
    await user.click(within(notif).getByRole('button', { name: 'Guardar preferencias' }))
    expect(await screen.findByText('Preferencias guardadas')).toBeInTheDocument()
    expect(notificaciones.get('u-ana')!.find((a) => a.clave === 'ALERTAS_CONSULTA')!.vereda).toBe(
      'JURACAMBITA',
    )
  })
})
