// Hooks de TanStack Query del feature "reportes".
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useOpcionesFiltroCasos } from '@/features/casos'
import { useTodosProductores } from '@/features/productores'
import { useCuentas } from '@/features/usuarios'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { descargarTexto } from '@/utils/descarga'
import {
  eliminarConsulta,
  guardarConsulta,
  listarConsultas,
  obtenerReporte,
  obtenerResumen,
} from './api'
import {
  csvDeDocumento,
  documentoDeReporte,
  documentoDeResumen,
  textoGenerado,
  type DocumentoExportable,
} from './exportar'
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

interface PedidoExportar {
  tipo: TipoReporte | 'resumen'
  filtros: FiltrosReporte
}

/** Arma el documento exportable con los datos del reporte (de la caché si ya se cargaron). */
function useDocumento() {
  const queryClient = useQueryClient()
  const nombres = useNombresFiltros()
  return async ({ tipo, filtros }: PedidoExportar): Promise<DocumentoExportable> => {
    if (tipo === 'resumen') {
      const datos = await queryClient.fetchQuery({
        queryKey: reportesKeys.resumen(filtros),
        queryFn: () => obtenerResumen(filtros),
        staleTime: 60_000,
      })
      return documentoDeResumen(datos, filtros, nombres)
    }
    const datos = await queryClient.fetchQuery({
      queryKey: reportesKeys.reporte(tipo, filtros),
      queryFn: () => obtenerReporte(tipo, filtros),
      staleTime: 60_000,
    })
    return documentoDeReporte(datos, filtros, nombres)
  }
}

/** Descarga el CSV del reporte (punto y coma, para Excel en español) con los filtros dados. */
export function useExportarCsv() {
  const documento = useDocumento()
  return useMutation({
    mutationFn: async (pedido: PedidoExportar) => {
      const d = await documento(pedido)
      descargarTexto(
        csvDeDocumento(d, textoGenerado()),
        `${d.nombreArchivo}.csv`,
        'text/csv;charset=utf-8',
      )
    },
  })
}

/** Prepara el documento para imprimir o guardar como PDF. */
export function usePrepararPdf() {
  const documento = useDocumento()
  return useMutation({ mutationFn: documento })
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
