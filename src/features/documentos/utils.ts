import type { TipoDocumento } from './api'

export const TIPO_DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
  MANUAL: 'Manual',
  FICHA_TECNICA: 'Ficha técnica',
  GUIA_MANEJO: 'Guía de manejo',
  LIBRO_REFERENCIA: 'Libro de referencia',
}

/** Tamaño máximo de un documento (PDF). */
export const MAX_MB = 20
