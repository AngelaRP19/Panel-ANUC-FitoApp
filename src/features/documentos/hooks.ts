// Hooks de TanStack Query del feature "documentos".
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { listarDocumentos, obtenerArchivo, subirDocumento, type FiltrosDocumentos } from './api'

export const documentosKeys = {
  all: ['documentos'] as const,
  lista: (f: FiltrosDocumentos) => [...documentosKeys.all, f] as const,
}

const VACIOS: FiltrosDocumentos = { q: '', tipo: '' }

export function useFiltrosDocumentos() {
  return useUrlFilters(VACIOS)
}

export function useDocumentos(f: FiltrosDocumentos) {
  return useQuery({
    queryKey: documentosKeys.lista(f),
    queryFn: () => listarDocumentos(f),
    placeholderData: keepPreviousData,
  })
}

export function useSubirDocumento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: subirDocumento,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentosKeys.all }),
  })
}

/**
 * Abre el PDF en una pestaña nueva. La pestaña se abre en el mismo clic (si no, el navegador
 * la bloquea) y se carga cuando llega el archivo.
 */
export function useAbrirDocumento() {
  return useMutation({
    mutationFn: async (id: string) => {
      const pestana = window.open('', '_blank')
      try {
        const url = URL.createObjectURL(await obtenerArchivo(id))
        if (pestana) pestana.location.href = url
        else window.location.assign(url)
      } catch (error) {
        pestana?.close()
        throw error
      }
    },
  })
}
