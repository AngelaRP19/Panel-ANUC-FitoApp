import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'
const TECNICO = 'tecnico@anuc.test'

const lista = () => screen.getByRole('list', { name: 'Alertas' })
const items = () => within(lista()).getAllByRole('listitem')
const detalle = () => screen.getByRole('region', { name: /en (Juracambita|San Luis|Centro)/ })

describe('Alertas epidemiológicas', () => {
  it('el líder ve la lista por estado y el detalle de la primera alerta', async () => {
    await renderApp(LIDER, '/alertas')
    expect(
      await screen.findByText(
        'Posibles concentraciones de casos confirmados de Trips. El sistema las detecta; el líder técnico decide si se confirman.',
      ),
    ).toBeInTheDocument()
    await waitFor(() => expect(items()).toHaveLength(6))
    expect(screen.getByRole('button', { name: 'Todas 6' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Comunicada 2' })).toBeInTheDocument()
    expect(items()[0]).toHaveTextContent('Posible concentración de Trips')
    expect(items()[0]).toHaveTextContent('Juracambita · 4 casos en 3,5 km · últimos 30 días')
    expect(items()[1]).toHaveTextContent(
      'San Luis · 3 casos en 3,1 km · revisa Jhon Fredy Sanabria',
    )
    expect(items()[2]).toHaveTextContent('Centro · confirmada por Wilmar Torres · falta comunicar')
    expect(items()[3]).toHaveTextContent('Juracambita · mensaje enviado a 14 productores')
    expect(items()[4]).toHaveTextContent('San Luis · dos casos eran de la misma finca')
    expect(screen.getByText('1–6 de 6 alertas · 6 por página')).toBeInTheDocument()

    const d = await screen.findByRole('region', {
      name: 'Posible concentración de Trips en Juracambita',
    })
    expect(within(d).getByText('ALR-012')).toBeInTheDocument()
    expect(
      within(d).getByText(/Detectada el 28 sep 2026 · 06:00 · sin revisar/),
    ).toBeInTheDocument()
    expect(
      within(d).getByText(
        'Es una posibilidad detectada por el sistema, no un hecho. Revisa los casos antes de confirmar.',
      ),
    ).toBeInTheDocument()
    expect(within(d).getByText('Trips · mínimo 3 casos · 3,5 km · 30 días')).toBeInTheDocument()
    expect(within(d).getByText('4 casos confirmados de Trips')).toBeInTheDocument()
    expect(
      within(d).getByText('#0229, #0228, #0219, #0216 · Los Naranjos, Buenavista y La Cabaña'),
    ).toBeInTheDocument()
    expect(
      within(d).getByRole('img', {
        name: 'Radio de 3,5 km alrededor de 4 casos confirmados de Trips en Juracambita',
      }),
    ).toBeInTheDocument()
    expect(
      within(d).getByText('Zona de la alerta · 4 casos de Trips en un radio de 3,5 km'),
    ).toBeInTheDocument()
    // Un clic en el mapa abre Google Maps en la zona de la alerta (pestaña nueva).
    const mapa = within(d).getByRole('link', { name: /^Abrir en Google Maps: Radio de 3,5 km/ })
    expect(mapa).toHaveAttribute('target', '_blank')
    expect(mapa.getAttribute('href')).toMatch(
      /^https:\/\/www\.google\.com\/maps\/@\?api=1&map_action=map&center=5\.\d+,-73\.\d+&zoom=\d+&basemap=terrain$/,
    )
    expect(within(d).getByRole('button', { name: 'Confirmar alerta' })).toBeInTheDocument()
  })

  it('filtra por estado y abre otra alerta desde la lista', async () => {
    const { user, router } = await renderApp(LIDER, '/alertas')
    await waitFor(() => expect(items()).toHaveLength(6))
    await user.click(screen.getByRole('button', { name: 'Descartada 1' }))
    await waitFor(() => expect(items()).toHaveLength(1))
    expect(router.state.location.search).toBe('?estado=DESCARTADA')

    await user.click(within(items()[0]!).getByRole('link'))
    expect(router.state.location.pathname).toBe('/alertas/ALR-008')
    const d = await screen.findByRole('region', {
      name: 'Posible concentración de Trips en San Luis',
    })
    expect(
      within(d).getByText(/Descartada por Wilmar Torres el 20 ago 2026 · 15:05/),
    ).toBeInTheDocument()
    expect(within(d).getByText('Motivo: Dos casos eran de la misma finca')).toBeInTheDocument()
    // Una alerta descartada ya no tiene acciones.
    expect(within(d).queryByRole('button', { name: 'Descartar' })).not.toBeInTheDocument()
  })

  it('«Ver casos» muestra los casos involucrados y los que aún no cuentan', async () => {
    const { user } = await renderApp(LIDER, '/alertas/ALR-012')
    await user.click(await screen.findByRole('button', { name: 'Ver casos' }))
    const v = await screen.findByRole('dialog', { name: 'Casos involucrados' })
    expect(within(v).getByText('ALR-012 · Trips · Juracambita')).toBeInTheDocument()
    const filas = within(v).getAllByRole('row').slice(1)
    expect(filas).toHaveLength(4)
    expect(filas[0]).toHaveTextContent('Luis Alberto Cárdenas')
    expect(filas[0]).toHaveTextContent('Los Naranjos')
    expect(filas[0]).toHaveTextContent('Confirmado')
    expect(filas[0]).toHaveTextContent('22 sep 2026')
    expect(within(v).getByRole('link', { name: '#0228' })).toHaveAttribute('href', '/casos/0228')
    expect(
      within(v).getByText(
        'En la misma zona hay 3 casos de Trips sin diagnóstico técnico (#0240, #0236, #0227). No cuentan para la alerta hasta que se confirmen.',
      ),
    ).toBeInTheDocument()
  })

  it('descartar exige motivo y deja la alerta como Descartada', async () => {
    const { user } = await renderApp(LIDER, '/alertas/ALR-012')
    await user.click(await screen.findByRole('button', { name: 'Descartar' }))
    const dlg = await screen.findByRole('alertdialog', { name: '¿Descartar la alerta ALR-012?' })
    expect(
      within(dlg).getByText(
        'La posible concentración de Trips en Juracambita quedará como Descartada y no se enviará ningún mensaje. Esta acción queda en el historial.',
      ),
    ).toBeInTheDocument()
    await user.click(within(dlg).getByRole('button', { name: 'Descartar alerta' }))
    expect(await within(dlg).findByText('Escribe el motivo del descarte.')).toBeInTheDocument()

    await user.type(within(dlg).getByLabelText(/^Motivo del descarte/), 'Casos de la misma finca')
    await user.click(within(dlg).getByRole('button', { name: 'Descartar alerta' }))
    expect(await screen.findByText('Alerta descartada')).toBeInTheDocument()
    await waitFor(() =>
      expect(within(detalle()).getByText('Motivo: Casos de la misma finca')).toBeInTheDocument(),
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Descartada 2' })).toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: 'Generada 0' })).toBeInTheDocument()
  })

  it('confirmar lleva a redactar el mensaje para los productores', async () => {
    const { user, router } = await renderApp(LIDER, '/alertas/ALR-012')
    await user.click(await screen.findByRole('button', { name: 'Confirmar alerta' }))
    expect(await screen.findByText('Alerta confirmada')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/alertas/ALR-012/mensaje'))
  })

  it('una alerta confirmada ofrece «Redactar mensaje» al líder', async () => {
    await renderApp(LIDER, '/alertas/ALR-010')
    const d = await screen.findByRole('region', {
      name: 'Alerta fitosanitaria confirmada: Trips en Centro',
    })
    expect(within(d).getByRole('link', { name: 'Redactar mensaje' })).toHaveAttribute(
      'href',
      '/alertas/ALR-010/mensaje',
    )
    expect(within(d).queryByRole('button', { name: 'Confirmar alerta' })).not.toBeInTheDocument()
  })

  it('una alerta comunicada ofrece «Corregir alerta» al líder (D-17)', async () => {
    await renderApp(LIDER, '/alertas/ALR-009')
    const d = await screen.findByRole('region', {
      name: 'Alerta fitosanitaria comunicada: Trips en Juracambita',
    })
    expect(within(d).getByRole('link', { name: 'Corregir alerta' })).toHaveAttribute(
      'href',
      '/alertas/ALR-009/correccion',
    )
  })

  it('corrige una alerta comunicada una sola vez y muestra la corrección enviada', async () => {
    const { user, router } = await renderApp(LIDER, '/alertas/ALR-009/correccion')
    expect(await screen.findByRole('heading', { name: 'Corregir alerta' })).toBeInTheDocument()
    expect(screen.getByText('Plantilla fija de corrección')).toBeInTheDocument()
    expect(
      screen.getByText('Los mismos 14 productores que recibieron la alerta'),
    ).toBeInTheDocument()
    const enviar = screen.getByRole('button', { name: 'Enviar corrección' })
    expect(enviar).toBeDisabled()

    const campo = screen.getByLabelText(/^Explicación/)
    expect(campo).toHaveAttribute('maxlength', '300')
    // El guardrail rechaza productos, dosis o tratamientos.
    await user.type(campo, 'Aplique el producto indicado en la dosis de siempre.')
    await user.click(enviar)
    const dialogo = await screen.findByRole('alertdialog')
    await user.click(within(dialogo).getByRole('button', { name: 'Enviar corrección' }))
    expect(
      await screen.findByText('El mensaje no puede recomendar productos, dosis ni tratamientos.'),
    ).toBeInTheDocument()

    await user.clear(campo)
    await user.type(campo, 'Los casos de la zona no eran de Trips. Si tiene dudas, escríbanos.')
    expect(screen.getByRole('region', { name: 'Vista previa en WhatsApp' })).toHaveTextContent(
      'Los casos de la zona no eran de Trips.',
    )
    await user.click(screen.getByRole('button', { name: 'Enviar corrección' }))
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Enviar corrección',
      }),
    )
    expect(await screen.findByText('Corrección enviada')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/alertas/ALR-009'))

    const d = await screen.findByRole('region', {
      name: 'Alerta fitosanitaria corregida: Trips en Juracambita',
    })
    const bloque = within(d).getByRole('region', { name: 'Corrección enviada' })
    expect(bloque).toHaveTextContent('Corrección enviada por Wilmar Torres')
    expect(bloque).toHaveTextContent('Los casos de la zona no eran de Trips.')
    expect(within(d).queryByRole('link', { name: 'Corregir alerta' })).not.toBeInTheDocument()

    // Una segunda corrección no es posible: la pantalla vuelve al detalle.
    await router.navigate('/alertas/ALR-009/correccion')
    await waitFor(() => expect(router.state.location.pathname).toBe('/alertas/ALR-009'))
  })

  it('el técnico no ve «Corregir alerta»', async () => {
    await renderApp(TECNICO, '/alertas/ALR-009')
    const d = await screen.findByRole('region', {
      name: 'Alerta fitosanitaria comunicada: Trips en Juracambita',
    })
    expect(within(d).queryByRole('link', { name: 'Corregir alerta' })).not.toBeInTheDocument()
  })

  it('el técnico solo consulta y puede pedir que le avisen', async () => {
    const { user } = await renderApp(TECNICO, '/alertas')
    expect(
      await screen.findByText(
        'Consulta de las alertas de la asociación. Las que sigues te llegan como notificación.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('Solo consulta.')
    expect(
      screen.queryByRole('link', { name: 'Configurar notificaciones de alertas' }),
    ).not.toBeInTheDocument()

    const d = await screen.findByRole('region', {
      name: 'Posible concentración de Trips en Juracambita',
    })
    expect(
      within(d).getByText('Solo el líder técnico puede confirmar o descartar esta alerta.'),
    ).toBeInTheDocument()
    expect(within(d).queryByRole('button', { name: 'Descartar' })).not.toBeInTheDocument()
    expect(within(d).queryByRole('button', { name: 'Confirmar alerta' })).not.toBeInTheDocument()

    await user.click(within(d).getByRole('button', { name: 'Avisarme cuando cambie' }))
    expect(await screen.findByText('Te avisaremos cuando cambie')).toBeInTheDocument()
    expect(await within(d).findByRole('button', { name: 'Dejar de avisarme' })).toBeInTheDocument()

    // Los casos de otro técnico no se enlazan.
    await user.click(within(d).getByRole('button', { name: 'Ver casos' }))
    const v = await screen.findByRole('dialog', { name: 'Casos involucrados' })
    expect(within(v).getByRole('link', { name: '#0229' })).toBeInTheDocument()
    expect(within(v).queryByRole('link', { name: '#0228' })).not.toBeInTheDocument()
    expect(within(v).getByText('#0228')).toBeInTheDocument()
  })

  it('una alerta que no existe lo dice sin ofrecer reintentar', async () => {
    await renderApp(LIDER, '/alertas/ALR-999')
    expect(await screen.findByText('La alerta no existe')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })
})
