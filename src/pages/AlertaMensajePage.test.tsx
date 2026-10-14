import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API } from '@/mocks/handlers/comun'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'
const RUTA = '/alertas/ALR-010/mensaje'
const RECOMENDACION = 'Revise flores y hojas nuevas en las mañanas y escríbanos por este chat.'

const textarea = () => screen.getByLabelText(/^Recomendación del técnico/)
const enviar = () => screen.getByRole('button', { name: /^Enviar a/ })

describe('Mensaje a productores', () => {
  it('muestra la alerta confirmada, los pasos, la plantilla y los destinatarios', async () => {
    await renderApp(LIDER, RUTA)
    expect(
      await screen.findByRole('heading', { name: 'Mensaje a productores' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'ALR-010 · Trips · Centro · confirmada por Wilmar Torres el 19 sep 2026 · 10:42',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Alertas epidemiológicas' })).toHaveAttribute(
      'href',
      '/alertas/ALR-010',
    )
    const pasos = screen.getByRole('list', { name: 'Pasos' })
    expect(within(pasos).getAllByRole('listitem')).toHaveLength(4)
    expect(within(pasos).getByText(/3\. Redactar mensaje/)).toHaveAttribute('aria-current', 'step')

    expect(
      screen.getByText('El texto fijo no se puede cambiar. Tú completas la recomendación.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Categoría fitosanitaria')).toHaveValue('Trips')
    expect(screen.getByLabelText('Categoría fitosanitaria')).toBeDisabled()
    expect(textarea()).toHaveAttribute('maxlength', '300')
    expect(screen.getByText('0/300')).toBeInTheDocument()
    expect(screen.getByText(/no debe incluir productos, dosis ni tratamientos/)).toBeInTheDocument()

    const centro = await screen.findByRole('checkbox', { name: /^Centro/ })
    expect(centro).toBeChecked()
    expect(
      screen.getByText('Zona de la alerta · 3 productores activos · 1 deshabilitado'),
    ).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /^San Luis/ })).not.toBeChecked()
    expect(screen.getByText('Ver productores de Centro (3)')).toBeInTheDocument()
    expect(
      screen.getByText('Los productores deshabilitados no reciben mensajes.'),
    ).toBeInTheDocument()
    // Sin recomendación no se puede enviar.
    expect(enviar()).toHaveTextContent('Enviar a 3 productores')
    expect(enviar()).toBeDisabled()
  })

  it('actualiza la vista previa y el total, y comunica la alerta tras confirmar', async () => {
    const { user, router } = await renderApp(LIDER, RUTA)
    await user.type(await screen.findByLabelText(/^Recomendación del técnico/), RECOMENDACION)
    expect(screen.getByText(`${RECOMENDACION.length}/300`)).toBeInTheDocument()
    const preview = screen.getByRole('region', { name: 'Vista previa en WhatsApp' })
    expect(preview).toHaveTextContent(
      `Alerta fitosanitaria: se ha identificado una concentración de casos de Trips en una zona determinada. Recomendación del técnico: ${RECOMENDACION}`,
    )

    await user.click(await screen.findByRole('checkbox', { name: /^San Luis/ }))
    expect(enviar()).toHaveTextContent('Enviar a 7 productores')
    expect(screen.getByText('7 productores')).toBeInTheDocument()

    await user.click(enviar())
    const dlg = await screen.findByRole('alertdialog', {
      name: '¿Enviar la alerta a 7 productores?',
    })
    expect(within(dlg).getByText(/productores activos de Centro y San Luis/)).toBeInTheDocument()
    await user.click(within(dlg).getByRole('button', { name: 'Enviar mensaje' }))
    expect(await screen.findByText('Alerta comunicada')).toBeInTheDocument()
    expect(
      screen.getByText('Mensaje enviado a 7 productores de Centro y San Luis.'),
    ).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/alertas/ALR-010'))
    expect(
      await screen.findByRole('region', {
        name: 'Alerta fitosanitaria comunicada: Trips en Centro',
      }),
    ).toBeInTheDocument()
  })

  it('pide la recomendación y no envía sin destinatarios', async () => {
    const { user } = await renderApp(LIDER, RUTA)
    await user.click(await screen.findByLabelText(/^Recomendación del técnico/))
    await user.tab()
    expect(
      await screen.findByText('Escribe la recomendación para los productores.'),
    ).toBeInTheDocument()

    await user.type(textarea(), RECOMENDACION)
    expect(enviar()).toBeEnabled()
    await user.click(screen.getByRole('checkbox', { name: /^Centro/ }))
    expect(enviar()).toHaveTextContent('Enviar a 0 productores')
    expect(enviar()).toBeDisabled()
  })

  it('conserva lo escrito al salir y volver, y guarda el borrador', async () => {
    const { user, router } = await renderApp(LIDER, RUTA)
    await user.type(await screen.findByLabelText(/^Recomendación del técnico/), RECOMENDACION)
    await router.navigate('/alertas')
    await router.navigate(RUTA)
    expect(await screen.findByLabelText(/^Recomendación del técnico/)).toHaveValue(RECOMENDACION)

    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }))
    expect(await screen.findByText('Borrador guardado')).toBeInTheDocument()
  })

  it('si el envío falla, avisa y no pierde el texto', async () => {
    server.use(http.post(`${API}/alertas/:id/comunicar`, () => HttpResponse.error()))
    const { user } = await renderApp(LIDER, RUTA)
    await user.type(await screen.findByLabelText(/^Recomendación del técnico/), RECOMENDACION)
    await user.click(enviar())
    const dlg = await screen.findByRole('alertdialog')
    await user.click(within(dlg).getByRole('button', { name: 'Enviar mensaje' }))
    expect(await screen.findByText('No se envió el mensaje.')).toBeInTheDocument()
    expect(textarea()).toHaveValue(RECOMENDACION)
  })

  it('confirmar desde la lista abre el mensaje con la vereda de la alerta', async () => {
    const { user } = await renderApp(LIDER, '/alertas/ALR-012')
    await user.click(await screen.findByRole('button', { name: 'Confirmar alerta' }))
    expect(
      await screen.findByRole('heading', { name: 'Mensaje a productores' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('checkbox', { name: /^Juracambita/ })).toBeChecked()
    expect(screen.getByText('Zona de la alerta · 6 productores activos')).toBeInTheDocument()
    expect(screen.getByText('Ver productores de Juracambita (6)')).toBeInTheDocument()
    expect(screen.getByText('310 482 1937')).toBeInTheDocument()
  })

  it('una alerta sin confirmar vuelve a su detalle', async () => {
    const { router } = await renderApp(LIDER, '/alertas/ALR-011/mensaje')
    await waitFor(() => expect(router.state.location.pathname).toBe('/alertas/ALR-011'))
  })

  it('el técnico ve «Esta sección es solo para el líder técnico»', async () => {
    await renderApp('tecnico@anuc.test', RUTA)
    expect(
      await screen.findByRole('heading', { name: 'Esta sección es solo para el líder técnico' }),
    ).toBeInTheDocument()
  })
})
