import { useCallback, useState } from 'react'

/** Parámetros page/page_size para los listados paginados de la API. */
export function usePagination(pageSizeInicial = 20) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(pageSizeInicial)
  const reset = useCallback(() => setPage(1), [])
  return { page, pageSize, setPage, setPageSize, reset }
}
