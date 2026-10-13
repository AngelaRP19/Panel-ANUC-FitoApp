import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BarraCoincidencia } from './BarraCoincidencia'
import { Button } from './Button'
import { CategoriaMarca } from './CategoriaMarca'
import { ConfirmDialog } from './ConfirmDialog'
import { EstadoCasoBadge } from './EstadoBadge'
import { Pagination } from './Pagination'
import { Table } from './Table'

describe('insignias y categorías', () => {
  it('muestra el estado con texto y tolera valores desconocidos', () => {
    render(
      <>
        <EstadoCasoBadge estado="EN_REVISION" />
        <EstadoCasoBadge estado="REABIERTO" />
      </>,
    )
    expect(screen.getByText('En revisión')).toBeInTheDocument()
    expect(screen.getByText('Sin clasificar')).toBeInTheDocument()
    expect(screen.queryByText(/reabierto/i)).not.toBeInTheDocument()
  })

  it('nombra la categoría y su forma, nunca solo el color', () => {
    render(<CategoriaMarca categoria="TRIPS" porcentaje={77} nombrarForma />)
    expect(screen.getByText(/Trips/)).toHaveTextContent('Trips (triángulo) 77 %')
  })

  it('describe la barra de coincidencia de síntomas', () => {
    render(<BarraCoincidencia categoria="BOTRYTIS" porcentaje={58} />)
    expect(
      screen.getByRole('img', { name: 'Botrytis: 58 % de coincidencia de síntomas' }),
    ).toBeInTheDocument()
  })
})

describe('Button', () => {
  it('se deshabilita mientras carga para evitar envíos dobles', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Guardar
      </Button>,
    )
    const boton = screen.getByRole('button', { name: 'Guardar' })
    expect(boton).toBeDisabled()
    await userEvent.click(boton)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('Table', () => {
  const filas = [
    { id: '1', nombre: 'María Rojas' },
    { id: '2', nombre: 'Pedro Suárez' },
  ]
  const columnas = [{ key: 'n', header: 'Productor', render: (f: (typeof filas)[0]) => f.nombre }]

  it('tiene encabezados con scope y un botón real por fila', async () => {
    const onOpen = vi.fn()
    render(
      <Table
        label="Productores"
        columns={columnas}
        rows={filas}
        rowKey={(f) => f.id}
        onRowOpen={onOpen}
        rowLabel={(f) => `${f.nombre}. Ver ficha`}
      />,
    )
    const tabla = screen.getByRole('table', { name: 'Productores' })
    expect(within(tabla).getByRole('columnheader', { name: 'Productor' })).toHaveAttribute(
      'scope',
      'col',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Pedro Suárez. Ver ficha' }))
    expect(onOpen).toHaveBeenCalledWith(filas[1])
  })

  it('anuncia la carga y muestra el estado vacío', () => {
    const { rerender } = render(
      <Table
        label="Casos"
        columns={columnas}
        rows={[]}
        rowKey={(f) => f.id}
        loading
        loadingLabel="Cargando casos"
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Cargando casos')
    rerender(
      <Table
        label="Casos"
        columns={columnas}
        rows={[]}
        rowKey={(f) => f.id}
        empty={<p>No hay resultados para esta búsqueda</p>}
      />,
    )
    expect(screen.getByText('No hay resultados para esta búsqueda')).toBeInTheDocument()
  })
})

describe('Pagination', () => {
  it('muestra el rango como en el diseño y cambia de página', async () => {
    const onPage = vi.fn()
    render(<Pagination page={1} pageSize={15} total={32} noun="casos" onPageChange={onPage} />)
    expect(screen.getByText('1–15 de 32 casos · 15 por página')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(onPage).toHaveBeenCalledWith(2)
  })
})

describe('ConfirmDialog', () => {
  it('es un alertdialog que se cancela con Esc', async () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        open
        danger
        title="¿Desactivar a Diana Marcela Rincón?"
        message="No podrá entrar al panel."
        confirmLabel="Desactivar cuenta"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    )
    expect(
      screen.getByRole('alertdialog', { name: '¿Desactivar a Diana Marcela Rincón?' }),
    ).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalled()
  })
})
