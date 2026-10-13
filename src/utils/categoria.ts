import type { Categoria } from '@/types/enums'

/** Color de fondo de cada categoría fitosanitaria (siempre se acompaña de su etiqueta). */
export const CATEGORIA_BG: Record<Categoria, string> = {
  BOTRYTIS: 'bg-cat-botrytis',
  RONA: 'bg-cat-rona',
  DEFICIENCIA_MAGNESIO: 'bg-cat-magnesio',
  TRIPS: 'bg-cat-trips',
  FUSARIUM: 'bg-cat-fusarium',
}

/** Orden fijo de las categorías en gráficas y leyendas. */
export const CATEGORIAS_ORDEN: Categoria[] = [
  'TRIPS',
  'BOTRYTIS',
  'RONA',
  'DEFICIENCIA_MAGNESIO',
  'FUSARIUM',
]
