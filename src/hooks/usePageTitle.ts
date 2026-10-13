import { useEffect } from 'react'

const SUFIJO = 'ANUC Zetaquirá · Panel'

/** Título descriptivo de la pestaña del navegador por pantalla («Casos · ANUC Zetaquirá · Panel»). */
export function usePageTitle(titulo: string | undefined) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${SUFIJO}` : SUFIJO
  }, [titulo])
}
