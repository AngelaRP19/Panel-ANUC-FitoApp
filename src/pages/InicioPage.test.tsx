import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { alertas } from '@/mocks/fixtures/alertas'
import { casos } from '@/mocks/fixtures/casos'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'

// «Ahora» del diseño: 28 sep 2026 · 15:30 (Bogotá). Solo se fija la fecha, no los temporizadores.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-28T15:30:00-05:00'))
})
afterEach(() => vi.useRealTimers())

const kpi = (nombre: RegExp) => screen.findByRole('link', { name: nombre })

describe('Inicio del líder', () => {
  it('calcula los indicadores con los casos de la bandeja', async () => {
    await renderApp(LIDER, '/inicio')
    expect(
      await screen.findByRole('heading', { name: 'Resumen fitosanitario' }),
    ).toBeInTheDocument()

    const pendientes = await kpi(/casos pendientes de revisión sin técnico asignado/)
    expect(pendientes).toHaveAttribute('href', '/casos?estado=PENDIENTE_REVISION')
    const sinTecnico = casos.filter((c) => c.estado === 'PENDIENTE_REVISION').length
    expect(within(pendientes).getByText(String(sinTecnico))).toBeInTheDocument()
    expect(
      within(pendientes).getByText('Sin técnico asignado · 1 con más de 48 h'),
    ).toBeInTheDocument()

    const enRevision = await kpi(/en revisión, con técnico asignado y sin diagnóstico/)
    const nRevision = casos.filter((c) => c.estado === 'EN_REVISION').length
    expect(within(enRevision).getByText(String(nRevision))).toBeInTheDocument()
    expect(
      within(enRevision).getByText('Con técnico asignado y sin diagnóstico'),
    ).toBeInTheDocument()

    expect(await kpi(/casos cerrados en septiembre/)).toBeInTheDocument()
    expect(screen.getByText('Cerrados en septiembre')).toBeInTheDocument()
  })

  it('lista los más antiguos sin diagnóstico, las alertas y la carga por técnico', async () => {
    await renderApp(LIDER, '/inicio')
    const antiguos = await screen.findByRole('region', { name: 'Más antiguos sin diagnóstico' })
    // Los 5 casos sin diagnóstico (pendientes y en revisión) que más llevan esperando.
    const masAntiguo = casos
      .filter((c) => c.estado === 'PENDIENTE_REVISION' || c.estado === 'EN_REVISION')
      .sort((a, b) => a.enviado_a_panel_en!.localeCompare(b.enviado_a_panel_en!))[0]!
    const enlaces = within(antiguos).getAllByRole('link', { name: /^Caso #/ })
    expect(enlaces).toHaveLength(5)
    expect(enlaces[0]).toHaveAttribute('href', `/casos/${masAntiguo.id}`)
    expect(enlaces[0]).toHaveAccessibleName(
      new RegExp(`^Caso #${masAntiguo.codigo}, ${masAntiguo.productor.nombre}, \\d+ días`),
    )

    const resumen = screen.getByRole('region', { name: 'Resumen de alertas' })
    expect(within(resumen).getByText('Trips · Centro · falta comunicar')).toBeInTheDocument()
    expect(
      within(resumen).getByText(/posible concentración de Trips en Juracambita/),
    ).toBeInTheDocument()
    expect(within(resumen).getByRole('link', { name: /Generada/ })).toHaveAttribute(
      'href',
      '/alertas/ALR-012',
    )

    const carga = screen.getByRole('region', { name: 'Carga por técnico' })
    expect(
      within(carga).getByText('Casos activos: en revisión y registrados sin cerrar'),
    ).toBeInTheDocument()
    expect(within(carga).getByText('Ana Lucía Becerra')).toBeInTheDocument()
    // Ana: casos en revisión y registrados sin cerrar, como en la pantalla Técnicos.
    const mios = casos.filter((c) => c.tecnico?.id === 'u-ana')
    const activos = mios.filter((c) => c.estado === 'EN_REVISION' || c.estado === 'REGISTRADO')
    const revision = mios.filter((c) => c.estado === 'EN_REVISION')
    expect(
      within(carga).getByText(`${activos.length} activos · ${revision.length} en revisión`),
    ).toBeInTheDocument()
    expect(within(carga).getByRole('link', { name: 'Asignar ahora' })).toHaveAttribute(
      'href',
      '/casos?tecnico=sin_asignar',
    )
  })

  it('refleja los cambios del panel (asignaciones y alertas)', async () => {
    // Se asignan los pendientes y se descarta la alerta generada.
    for (const c of casos.filter((x) => x.estado === 'PENDIENTE_REVISION')) {
      c.estado = 'EN_REVISION'
      c.tecnico = { id: 'u-ana', nombre: 'Ana Lucía Becerra' }
    }
    alertas.find((a) => a.id === 'ALR-012')!.estado = 'DESCARTADA'

    await renderApp(LIDER, '/inicio')
    const pendientes = await kpi(/casos pendientes de revisión|caso pendiente de revisión/)
    expect(within(pendientes).getByText('0')).toBeInTheDocument()
    const carga = screen.getByRole('region', { name: 'Carga por técnico' })
    expect(within(carga).queryByRole('link', { name: 'Asignar ahora' })).toBeNull()
    expect(screen.getByText(/No hay alertas pendientes de revisión/)).toBeInTheDocument()
  })

  it('permite ver los casos por categoría como tabla', async () => {
    const { user } = await renderApp(LIDER, '/inicio')
    await user.click(await screen.findByRole('button', { name: 'Ver como tabla' }))
    const tabla = screen.getByRole('table', { name: /Casos confirmados por categoría/ })
    expect(within(tabla).getByRole('row', { name: /^Trips \d+$/ })).toBeInTheDocument()
  })

  it('muestra error y permite reintentar si falla el resumen', async () => {
    server.use(http.get('/api/v1/panel/resumen', () => HttpResponse.json({}, { status: 500 })))
    await renderApp(LIDER, '/inicio')
    expect(await screen.findByText('No se pudo cargar el resumen del panel.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('el técnico ve su propio inicio, no el resumen del líder', async () => {
    await renderApp('tecnico@anuc.test', '/inicio')
    expect(await screen.findByRole('heading', { name: 'Hola, Ana Lucía' })).toBeInTheDocument()
    expect(screen.queryByText('Resumen fitosanitario')).toBeNull()
  })
})
