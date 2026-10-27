import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'

const filas = () =>
  within(screen.getByRole('table', { name: 'Cuentas del panel' }))
    .getAllByRole('row')
    .slice(1)

describe('Técnicos (cuentas del panel)', () => {
  it('lista líderes y técnicos juntos con rol y estado', async () => {
    await renderApp(LIDER, '/tecnicos')
    expect(
      await screen.findByText(
        'Cuentas que usan el panel. Los técnicos solo ven los casos que tienen asignados.',
      ),
    ).toBeInTheDocument()
    await waitFor(() => expect(filas()).toHaveLength(5))
    expect(filas()[0]).toHaveTextContent('Wilmar Torres')
    expect(filas()[0]).toHaveTextContent('Líder técnico')
    expect(filas()[2]).toHaveTextContent('Diana Marcela Rincón')
    expect(filas()[2]).toHaveTextContent('Deshabilitado')
    expect(screen.getByText('1–5 de 5 cuentas · 10 por página')).toBeInTheDocument()
  })

  it('filtra por rol, estado, carga y búsqueda', async () => {
    const { user } = await renderApp(LIDER, '/tecnicos')
    await waitFor(() => expect(filas()).toHaveLength(5))
    await user.selectOptions(screen.getByLabelText('Rol'), 'TECNICO')
    await waitFor(() => expect(filas()).toHaveLength(4))
    await user.selectOptions(screen.getByLabelText('Estado de la cuenta'), 'deshabilitada')
    await waitFor(() => expect(filas()).toHaveLength(1))
    expect(filas()[0]).toHaveTextContent('Diana Marcela Rincón')
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    await user.selectOptions(screen.getByLabelText('Carga de casos'), 'sin')
    await waitFor(() => expect(filas()).toHaveLength(3))
    await user.selectOptions(screen.getByLabelText('Carga de casos'), '')
    await user.type(screen.getByRole('searchbox', { name: 'Buscar técnico' }), 'sanabria')
    await waitFor(() => expect(filas()[0]).toHaveTextContent('Jhon Fredy Sanabria'))
    expect(filas()).toHaveLength(1)
  })

  it('desactiva un técnico con confirmación y explica qué pasa con sus casos', async () => {
    const { user } = await renderApp(LIDER, '/tecnicos')
    await waitFor(() => expect(filas()).toHaveLength(5))
    await user.click(screen.getByRole('button', { name: 'Ana Lucía Becerra. Ver datos' }))
    const ficha = await screen.findByRole('dialog', { name: /Ana Lucía Becerra/ })
    expect(within(ficha).getByText('Técnico · ve solo sus casos asignados')).toBeInTheDocument()
    expect(within(ficha).getByText('tecnico@anuc.test')).toBeInTheDocument()
    expect(within(ficha).getByText('311 259 3046')).toBeInTheDocument()
    expect(within(ficha).getByText('5 casos')).toBeInTheDocument()
    expect(within(ficha).getByRole('button', { name: 'Editar datos' })).toBeInTheDocument()

    await user.click(within(ficha).getByRole('switch', { name: 'Desactivar a Ana Lucía Becerra' }))
    const confirmar = await screen.findByRole('alertdialog', {
      name: '¿Desactivar a Ana Lucía Becerra?',
    })
    expect(
      within(confirmar).getByText(
        'No podrá entrar al panel. Sus 5 casos activos quedarán sin técnico asignado y aparecerán en la bandeja para reasignar.',
      ),
    ).toBeInTheDocument()
    await user.click(within(confirmar).getByRole('button', { name: 'Desactivar cuenta' }))
    expect(await screen.findByText('Ana Lucía Becerra quedó deshabilitado')).toBeInTheDocument()
    await waitFor(() =>
      expect(within(screen.getByRole('dialog')).getByRole('switch')).not.toBeChecked(),
    )
  })

  it('no deja desactivar la única cuenta activa de un rol y explica por qué', async () => {
    const { user } = await renderApp(LIDER, '/tecnicos?cuenta=u-wilmar')
    const ficha = await screen.findByRole('dialog', { name: /Wilmar Torres/ })
    expect(within(ficha).getByText('Líder técnico · administra todo el panel')).toBeInTheDocument()
    // Los datos del líder se editan desde Mi cuenta (P-11).
    expect(within(ficha).queryByRole('button', { name: 'Editar datos' })).not.toBeInTheDocument()
    expect(
      within(ficha).getByRole('link', { name: 'Editar mis datos en Mi cuenta' }),
    ).toBeInTheDocument()

    await user.click(within(ficha).getByRole('switch'))
    const bloqueo = await screen.findByRole('alertdialog', {
      name: 'No puedes desactivar la única cuenta de líder técnico activa',
    })
    expect(
      within(bloqueo).getByText(
        /necesita al menos una para revisar casos, asignarlos y confirmar alertas/,
      ),
    ).toBeInTheDocument()
    await user.click(within(bloqueo).getByRole('button', { name: 'Entendido' }))
    expect(await screen.findByRole('dialog', { name: /Wilmar Torres/ })).toBeInTheDocument()
  })

  it('registra un técnico con contraseña temporal y valida duplicados', async () => {
    const { user } = await renderApp(LIDER, '/tecnicos')
    await user.click(await screen.findByRole('button', { name: 'Registrar técnico' }))
    const form = await screen.findByRole('dialog', { name: 'Registrar técnico' })
    expect(
      within(form).getByText(
        'Recibirá una contraseña temporal en su correo y la cambiará al entrar por primera vez.',
      ),
    ).toBeInTheDocument()
    expect(within(form).getByRole('radio', { name: 'Técnico' })).toBeChecked()

    await user.type(within(form).getByLabelText(/^Nombre completo/), 'Camila Rodríguez')
    await user.type(within(form).getByLabelText(/^Correo electrónico/), 'tecnico@anuc.test')
    await user.type(within(form).getByLabelText(/^Celular/), '311 259 3046')
    await user.click(within(form).getByRole('button', { name: 'Registrar técnico' }))
    expect(await within(form).findByText('Este correo ya está registrado')).toBeInTheDocument()
    expect(within(form).getByText('Este número de celular ya está registrado')).toBeInTheDocument()

    const correo = within(form).getByLabelText(/^Correo electrónico/)
    await user.clear(correo)
    await user.type(correo, 'camila@anuc.org')
    const cel = within(form).getByLabelText(/^Celular/)
    await user.clear(cel)
    await user.type(cel, '3123456789')
    await user.click(within(form).getByRole('button', { name: 'Registrar técnico' }))
    expect(await screen.findByText('Técnico registrado')).toBeInTheDocument()
    expect(
      screen.getByText('Camila Rodríguez recibirá una contraseña temporal en camila@anuc.org.'),
    ).toBeInTheDocument()
    await waitFor(() => expect(filas()).toHaveLength(6))
  })

  it('edita los datos de un técnico', async () => {
    const { user } = await renderApp(LIDER, '/tecnicos?cuenta=u-jhon')
    const ficha = await screen.findByRole('dialog', { name: /Jhon Fredy Sanabria/ })
    await user.click(within(ficha).getByRole('button', { name: 'Editar datos' }))
    const form = await screen.findByRole('dialog', { name: 'Editar datos' })
    const cel = within(form).getByLabelText(/^Celular/)
    expect(cel).toHaveValue('320 718 6624')
    await user.clear(cel)
    await user.type(cel, '320 718 6625')
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Datos actualizados')).toBeInTheDocument()
  })

  it('el técnico ve «Esta sección es solo para el líder técnico»', async () => {
    await renderApp('tecnico@anuc.test', '/tecnicos')
    expect(
      await screen.findByRole('heading', { name: 'Esta sección es solo para el líder técnico' }),
    ).toBeInTheDocument()
  })
})
