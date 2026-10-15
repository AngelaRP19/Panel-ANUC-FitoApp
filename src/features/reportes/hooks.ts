// Hooks de TanStack Query del feature "reportes".
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useOpcionesFiltroCasos } from '@/features/casos'
import { useTodosProductores } from '@/features/productores'
import { useCuentas } from '@/features/usuarios'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { nombreConFecha } from '@/utils/descarga'
import {
  eliminarConsulta,
  exportarReporte,
  guardarConsulta,
  listarConsultas,
  obtenerReporte,
  obtenerResumen,
} from './api'
import type { FiltrosReporte, TipoReporte } from './types'
import { CLAVES_REPORTES } from './utils'

export const reportesKeys = {
  all: ['reportes'] as const,
  resumen: (f: FiltrosReporte) => [...reportesKeys.all, 'resumen', f] as const,
  reporte: (tipo: TipoReporte, f: FiltrosReporte) => [...reportesKeys.all, tipo, f] as const,
  consultas: () => [...reportesKeys.all, 'consultas'] as const,
}

const VACIOS = Object.fromEntries(CLAVES_REPORTES.map((k) => [k, ''])) as FiltrosReporte

/** Filtros de los reportes en la URL (periodo y los de cada panel). */
export function useFiltrosReporte() {
  const { filtros, setFiltros, limpiar } = useUrlFilters(VACIOS)
  // Solo las claves con valor: así la clave de la consulta es estable y compacta.
  const activos = useMemo(
    () => Object.fromEntries(Object.entries(filtros).filter(([, v]) => v)) as FiltrosReporte,
    [filtros],
  )
  return { filtros: activos, setFiltros, limpiar }
}

export function useResumenReportes(f: FiltrosReporte) {
  return useQuery({
    queryKey: reportesKeys.resumen(f),
    queryFn: () => obtenerResumen(f),
    placeholderData: keepPreviousData,
  })
}

export function useReporte(tipo: TipoReporte, f: FiltrosReporte, enabled = true) {
  return useQuery({
    queryKey: reportesKeys.reporte(tipo, f),
    queryFn: () => obtenerReporte(tipo, f),
    placeholderData: keepPreviousData,
    enabled,
  })
}

/** Descarga el CSV o el PDF del reporte con los filtros aplicados. */
export function useExportarReporte() {
  return useMutation({
    mutationFn: async ({
      tipo,
      filtros,
      formato,
    }: {
      tipo: TipoReporte | 'resumen'
      filtros: FiltrosReporte
      formato: 'csv' | 'pdf'
    }) => {
      const archivo = await exportarReporte(tipo, filtros, formato)
      const url = URL.createObjectURL(archivo)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = nombreConFecha(`reporte-${tipo}`, formato)
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      setTimeout(() => URL.revokeObjectURL(url), 0)
    },
  })
}

/** Nombres legibles de los filtros con id (técnico, finca, «decidida por») para los chips. */
export function useNombresFiltros(): Record<string, string> {
  const cuentas = useCuentas({ q: '', rol: '', estado: '', carga: '', page: '1' })
  const opciones = useOpcionesFiltroCasos()
  const productores = useTodosProductores()
  return {
    ...Object.fromEntries((productores.data ?? []).map((p) => [`productor:${p.id}`, p.nombre])),
    'tecnico:sin': 'Sin técnico',
    'decidida:sin': 'Sin decisión',
    ...Object.fromEntries(
      (cuentas.data?.items ?? []).flatMap((c) => [
        [`tecnico:${c.id}`, c.nombre],
        [`decidida:${c.id}`, c.nombre],
      ]),
    ),
    ...Object.fromEntries((opciones.data?.fincas ?? []).map((f) => [`finca:${f.id}`, f.nombre])),
  }
}

export function useConsultas() {
  return useQuery({ queryKey: reportesKeys.consultas(), queryFn: listarConsultas })
}

export function useGuardarConsulta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: guardarConsulta,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportesKeys.consultas() }),
  })
}

export function useEliminarConsulta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: eliminarConsulta,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportesKeys.consultas() }),
  })
}
