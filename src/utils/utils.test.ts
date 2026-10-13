import { describe, expect, it } from 'vitest'
import { etiqueta, ESTADO_CASO_LABEL } from '@/locales/es'
import { cn } from './cn'
import {
  formatearFecha,
  formatearFechaEntrada,
  formatearFechaHora,
  parsearFechaEntrada,
  textoFaltan,
  tiempoEspera,
} from './fechas'
import {
  formatearCoordenadas,
  formatearDecimal,
  formatearPorcentaje,
  latitudEnRango,
  parsearDecimal,
} from './numeros'
import { aE164, esCelularValido, formatearTelefono } from './telefono'

describe('fechas (America/Bogota)', () => {
  // 14:14 UTC = 09:14 en Bogotá (UTC-5)
  const iso = '2026-09-28T14:14:00Z'

  it('formatea fecha y hora como en el diseño', () => {
    expect(formatearFechaHora(iso)).toBe('28 sep 2026 · 09:14')
    expect(formatearFecha(iso)).toBe('28 sep 2026')
    expect(formatearFechaHora(null)).toBe('—')
  })

  it('usa la zona de Bogotá aunque en UTC ya sea otro día', () => {
    expect(formatearFecha('2026-09-29T03:00:00Z')).toBe('28 sep 2026')
  })

  it('calcula tiempos de espera y días que faltan', () => {
    const ahora = new Date('2026-09-28T20:14:00Z')
    expect(tiempoEspera(iso, ahora)).toBe('6 h en espera')
    expect(tiempoEspera('2026-09-20T14:14:00Z', ahora)).toBe('8 días')
    expect(textoFaltan('2027-03-22T12:00:00Z', ahora)).toBe('faltan 175 días')
    expect(textoFaltan('2026-09-01T00:00:00Z', ahora)).toBe('vencido')
  })

  it('lee y escribe fechas de entrada dd/mm/aaaa', () => {
    expect(parsearFechaEntrada('28/09/2026')).toBe('2026-09-28')
    expect(parsearFechaEntrada('31/02/2026')).toBeNull()
    expect(parsearFechaEntrada('2026-09-28')).toBeNull()
    expect(formatearFechaEntrada('2026-09-28')).toBe('28/09/2026')
  })
})

describe('teléfonos', () => {
  it('valida celulares de 10 dígitos que empiezan por 3', () => {
    expect(esCelularValido('313 402 7781')).toBe(true)
    expect(esCelularValido('+57 313 402 7781')).toBe(true)
    expect(esCelularValido('213 402 7781')).toBe(false)
    expect(esCelularValido('313 402 778')).toBe(false)
  })

  it('convierte a E.164 y lo muestra agrupado', () => {
    expect(aE164('313 402 7781')).toBe('+573134027781')
    expect(aE164('12345')).toBeNull()
    expect(formatearTelefono('+573134027781')).toBe('313 402 7781')
    expect(formatearTelefono(undefined)).toBe('—')
  })
})

describe('números', () => {
  it('muestra coordenadas con punto decimal', () => {
    expect(formatearCoordenadas(5.2481, -73.1702)).toBe('5.2481, -73.1702')
    expect(formatearCoordenadas(null, -73.1)).toBe('—')
    expect(latitudEnRango(5.2481)).toBe(true)
    expect(latitudEnRango(4.9)).toBe(false)
  })

  it('escribe y lee decimales con coma', () => {
    expect(formatearDecimal(3.5)).toBe('3,5')
    expect(formatearDecimal(3)).toBe('3')
    expect(parsearDecimal('3,5')).toBe(3.5)
    expect(parsearDecimal('3.5')).toBe(3.5)
    expect(parsearDecimal('tres')).toBeNull()
    expect(formatearPorcentaje(86.4)).toBe('86 %')
  })
})

describe('cn y etiquetas', () => {
  it('resuelve conflictos sin confundir tamaños de texto con colores', () => {
    expect(cn('text-cuerpo-sm text-tinta', 'text-peligro')).toBe('text-cuerpo-sm text-peligro')
    expect(cn('px-2', false, 'px-4')).toBe('px-4')
  })

  it('no rompe con valores desconocidos de la API', () => {
    expect(etiqueta(ESTADO_CASO_LABEL, 'EN_REVISION')).toBe('En revisión')
    expect(etiqueta(ESTADO_CASO_LABEL, 'REABIERTO')).toBe('Sin clasificar')
  })
})
