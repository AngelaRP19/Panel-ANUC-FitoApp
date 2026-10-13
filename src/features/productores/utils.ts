// Utilidades del feature "productores" (sin componentes).

/** Claves del panel (todo menos búsqueda, página y filas por página). */
export const CLAVES_FILTRO_PRODUCTORES = [
  'estado',
  'vereda',
  'especie',
  'casos',
  'finca',
  'desde',
  'hasta',
  'consulta',
] as const
export type ClavePanel = (typeof CLAVES_FILTRO_PRODUCTORES)[number]
