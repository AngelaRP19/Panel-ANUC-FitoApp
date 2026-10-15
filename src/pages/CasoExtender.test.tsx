import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { casos } from '@/mocks/fixtures/casos'
import { renderApp } from '@/test/renderApp'
import { fechaCalendario, formatearDia, sumarMeses } from '@/utils/fechas'

const LIDER = 'lider@anuc.test'
const JUSTIFICACION = 'El productor pidió segunda visita en diciembre'

const venceActual = (id: string) => fechaCalendario(casos.find((c) => c.id === id)!.vence_en!)

describe('Extender conservación (pantalla 22)', () => {
  it('el líder extiende 6 meses con justificación y queda en el historial', async () => {
    const { user } = await renderApp(LIDER, '/casos/0226')
    await user.click(await screen.findByRole('button', { name: 'Extender conservación' }))
    const dlg = await screen.findByRole('dialog', { name: 'Extender conservación del caso #0226' })
    expect(
      within(dlg).getByText(
        'Las evidencias y el historial se conservan hasta la fecha de vencimiento de conservación.',
      ),
    ).toBeInTheDocument()
    const actual = venceActual('0226')
    expect(within(dlg).getByText(formatearDia(actual))).toBeInTheDocument()
    expect(within(dlg).getByText(formatearDia(sumarMeses(actual, 6)))).toBeInTheDocument()
    expect(within(dlg).getByLabelText(/^Extender por/)).toHaveValue('6')

    // Sin justificación y con una muy corta.
    await user.click(within(dlg).getByRole('button', { name: 'Extender conservación' }))
    expect(
      await within(dlg).findByText('Escribe la justificación para extender la conservación.'),
    ).toBeInTheDocument()
    await user.type(within(dlg).getByLabelText(/^Justificación/), 'Segunda visita')
    await user.click(within(dlg).getByRole('button', { name: 'Extender conservación' }))
    expect(await within(dlg).findByText('Escribe al menos 20 caracteres.')).toBeInTheDocument()

    // 12 meses: el nuevo vencimiento cambia en vivo.
    await user.selectOptions(within(dlg).getByLabelText(/^Extender por/), '12')
    expect(within(dlg).getByText(formatearDia(sumarMeses(actual, 12)))).toBeInTheDocument()

    const just = within(dlg).getByLabelText(/^Justificación/)
    await user.clear(just)
    await user.type(just, JUSTIFICACION)
    await user.click(within(dlg).getByRole('button', { name: 'Extender conservación' }))
    expect(await screen.findByText('Conservación extendida')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Extender conservación/ })).toBeNull()
    expect(await screen.findByText(/· extendida/)).toBeInTheDocument()
    expect(venceActual('0226')).toBe(sumarMeses(actual, 12))

    await user.click(screen.getByRole('button', { name: /Historial/ }))
    const hist = await screen.findByRole('dialog', { name: /Historial/ })
    const paso = within(hist).getByText(new RegExp(JUSTIFICACION)).closest('li')!
    expect(paso).toHaveTextContent('Conservación extendida')
    expect(paso).toHaveTextContent('Wilmar Torres')
  })

  it('«Hasta una fecha» exige una fecha válida posterior al vencimiento actual', async () => {
    const { user } = await renderApp(LIDER, '/casos/0226')
    await user.click(await screen.findByRole('button', { name: 'Extender conservación' }))
    const dlg = await screen.findByRole('dialog', { name: /Extender conservación/ })
    await user.selectOptions(within(dlg).getByLabelText(/^Extender por/), 'fecha')
    const hasta = within(dlg).getByLabelText(/^Nueva fecha de vencimiento/)
    await user.clear(hasta)
    await user.type(hasta, '01/01/2020')
    await user.type(within(dlg).getByLabelText(/^Justificación/), JUSTIFICACION)
    await user.click(within(dlg).getByRole('button', { name: 'Extender conservación' }))
    expect(
      await within(dlg).findByText('La nueva fecha debe ser posterior al vencimiento actual.'),
    ).toBeInTheDocument()

    await user.clear(hasta)
    await user.type(hasta, '31/12/2030')
    await user.click(within(dlg).getByRole('button', { name: 'Extender conservación' }))
    expect(await screen.findByText('Conservación extendida')).toBeInTheDocument()
    expect(venceActual('0226')).toBe('2030-12-31')
  })

  it('la nueva fecha también se elige en el calendario (no deja días hasta el vencimiento actual)', async () => {
    const MESES = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ]
    const nombre = (f: string) => {
      const [a, m, d] = f.split('-').map(Number) as [number, number, number]
      return `${d} de ${MESES[m - 1]} de ${a}`
    }
    const actual = venceActual('0226')!
    const siguiente = new Date(`${actual}T00:00:00Z`)
    siguiente.setUTCDate(siguiente.getUTCDate() + 1)
    const manana = siguiente.toISOString().slice(0, 10)

    const { user } = await renderApp(LIDER, '/casos/0226')
    await user.click(await screen.findByRole('button', { name: 'Extender conservación' }))
    const dlg = await screen.findByRole('dialog', { name: /Extender conservación/ })
    // Con un plazo fijo la fecha se calcula: no hay calendario.
    expect(within(dlg).queryByRole('button', { name: /^Elegir fecha/ })).toBeNull()
    await user.selectOptions(within(dlg).getByLabelText(/^Extender por/), 'fecha')
    await user.click(within(dlg).getByRole('button', { name: /^Elegir fecha/ }))
    const calendario = await screen.findByRole('dialog', { name: 'Calendario' })
    for (let i = 0; i < 6; i++) {
      await user.click(within(calendario).getByRole('button', { name: 'Mes anterior' }))
    }
    expect(within(calendario).getByRole('button', { name: nombre(actual) })).toBeDisabled()
    await user.click(within(calendario).getByRole('button', { name: nombre(manana) }))
    expect(within(dlg).getByLabelText(/^Nueva fecha de vencimiento/)).toHaveValue(
      manana.split('-').reverse().join('/'),
    )
    await user.type(within(dlg).getByLabelText(/^Justificación/), JUSTIFICACION)
    await user.click(within(dlg).getByRole('button', { name: 'Extender conservación' }))
    expect(await screen.findByText('Conservación extendida')).toBeInTheDocument()
    expect(venceActual('0226')).toBe(manana)
  })

  it('el técnico extiende sus casos cerrados; los abiertos no tienen la opción', async () => {
    await renderApp('tecnico@anuc.test', '/casos/0229')
    expect(await screen.findByRole('button', { name: 'Extender conservación' })).toBeInTheDocument()
  })

  it('un caso sin cerrar no muestra «Extender»', async () => {
    await renderApp(LIDER, '/casos/0241')
    await screen.findByRole('heading', { name: /Caso #0241/ })
    expect(screen.queryByRole('button', { name: 'Extender conservación' })).toBeNull()
  })
})
