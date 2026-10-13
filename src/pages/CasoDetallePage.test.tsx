import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'
const TECNICO = 'tecnico@anuc.test'

describe('Detalle del caso · lectura', () => {
  it('muestra encabezado, franja de datos y resultado preliminar (04)', async () => {
    await renderApp(LIDER, '/casos/0241')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Caso #0241 · Finca El Porvenir' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bandeja de casos' })).toHaveAttribute('href', '/casos')
    expect(
      screen.getByText(
        'María Rojas Cárdenas · Vereda Juracambita · Gulupa en invernadero · zona afectada: fruto y hojas',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('28 sep 2026 · 09:14')).toBeInTheDocument()
    expect(screen.getByText('Se fija al cerrar el caso')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reasignar técnico/ })).toBeInTheDocument()

    const pre = screen.getByRole('region', { name: 'Resultado del análisis preliminar' })
    expect(
      within(pre).getByRole('img', { name: 'Botrytis: 86 % de coincidencia de síntomas' }),
    ).toBeInTheDocument()
    expect(within(pre).getByText(/descarta Trips y Fusarium/)).toBeInTheDocument()
    expect(
      within(pre).getByText('Resultado preliminar: la decisión corresponde al técnico.'),
    ).toBeInTheDocument()
  })

  it('abre la explicación, el cuestionario y el historial en ventanas', async () => {
    const { user } = await renderApp(LIDER, '/casos/0241')
    await user.click(await screen.findByRole('button', { name: 'Ver explicación' }))
    const expl = await screen.findByRole('dialog', { name: /Por qué se sugiere esta categoría/ })
    expect(await within(expl).findByText(/Descarta Trips:/)).toBeInTheDocument()
    expect(within(expl).getByText(/Por debajo del mínimo para sugerirse/)).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: /Cuestionario del chatbot/ }))
    const cuest = await screen.findByRole('dialog', { name: 'Cuestionario del chatbot' })
    expect(
      within(cuest).getByText('8 respuestas por WhatsApp · 28 sep, 08:41–09:10'),
    ).toBeInTheDocument()
    expect(await within(cuest).findByText('Sí, amanece muy húmedo adentro')).toBeInTheDocument()
    await user.keyboard('{Escape}')

    expect(screen.getByText('Último: técnico asignado · 09:30')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Historial y trazabilidad/ }))
    const hist = await screen.findByRole('dialog', { name: 'Historial y trazabilidad' })
    expect(
      await within(hist).findByText('Wilmar Torres asignó a Ana Lucía Becerra', { exact: false }),
    ).toBeInTheDocument()
    expect(within(hist).getByText('Cierre del caso')).toBeInTheDocument()
    expect(within(hist).queryByText(/reabiert/i)).not.toBeInTheDocument()
  })

  it('muestra la ficha de productor, finca y cultivo', async () => {
    const { user } = await renderApp(LIDER, '/casos/0241')
    await user.click(await screen.findByRole('button', { name: /Productor y finca/ }))
    const ficha = await screen.findByRole('dialog', { name: 'Productor, finca y cultivo' })
    expect(within(ficha).getByText('310 482 1937')).toBeInTheDocument()
    expect(within(ficha).getByText('5.2481, -73.1702')).toBeInTheDocument()
    expect(
      within(ficha).getByText('Invernadero · especies: gulupa y granadilla'),
    ).toBeInTheDocument()
    expect(within(ficha).getByRole('link', { name: 'Abrir mapa' })).toBeInTheDocument()
  })

  it('el visor recorre las evidencias con el teclado y se cierra con Esc (04e)', async () => {
    const { user } = await renderApp(LIDER, '/casos/0241')
    expect(await screen.findByText('8/12')).toBeInTheDocument()
    expect(screen.getByText('Sin fotos')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Ver 3 evidencias de fruto del caso #0241' }),
    )

    const visor = await screen.findByRole('dialog', {
      name: /Caso #0241 · Evidencias fotográficas/,
    })
    expect(await within(visor).findByText('Fruto 1 de 3 · evidencia 6 de 8')).toBeInTheDocument()
    await user.keyboard('{ArrowRight}')
    expect(within(visor).getByText('Fruto 2 de 3 · evidencia 7 de 8')).toBeInTheDocument()
    expect(
      within(visor).getByRole('img', {
        name: 'Evidencia fruto 2 · caso #0241: Polvo gris en la cáscara',
      }),
    ).toBeInTheDocument()
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(within(visor).getByText('Envés 2 de 2 · evidencia 5 de 8')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('identificación ambigua: dos barras, coincidencias y pista (04b)', async () => {
    await renderApp(LIDER, '/casos/0239')
    expect(await screen.findByText('Ambigua · 2 categorías')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Botrytis: 58 % de coincidencia de síntomas' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Roña: 42 % de coincidencia de síntomas' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/en Roña la lesión es seca, corchosa y sin moho/)).toBeInTheDocument()
  })

  it('caso cerrado no identificado: franja de cierre y «Por qué no se identificó» (04c)', async () => {
    const { user } = await renderApp(LIDER, '/casos/0226')
    expect(await screen.findByText('No identificada')).toBeInTheDocument()
    expect(screen.getByText('22 sep 2026 · 10:05')).toBeInTheDocument()
    expect(screen.getByText('22 mar 2027')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reasignar técnico/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ver explicación' }))
    const expl = await screen.findByRole('dialog', { name: /Por qué no se identificó/ })
    expect(
      await within(expl).findByRole('img', { name: 'Fusarium: 31 % de coincidencia de síntomas' }),
    ).toBeInTheDocument()
  })

  it('un caso que no existe muestra el aviso con «Volver a la bandeja»', async () => {
    await renderApp(LIDER, '/casos/9999')
    expect(await screen.findByText('No encontramos este caso')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a la bandeja' })).toHaveAttribute(
      'href',
      '/casos',
    )
  })
})

describe('Detalle del caso · técnico (12c)', () => {
  it('ve su caso sin reasignar y con «Caso asignado a ti»', async () => {
    await renderApp(TECNICO, '/casos/0241')
    expect(await screen.findByText('Caso asignado a ti')).toBeInTheDocument()
    expect(screen.getByText('Ana Lucía Becerra (tú)')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mis casos asignados' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reasignar técnico/ })).not.toBeInTheDocument()
  })

  it('un caso de otro técnico lleva a «No tienes acceso a este caso»', async () => {
    const { router } = await renderApp(TECNICO, '/casos/0237')
    expect(
      await screen.findByRole('heading', { name: 'No tienes acceso a este caso' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/sin-acceso')
  })
})
