import { useCallback, useState } from 'react'

/** Estado abierto/cerrado para modales, menús y diálogos. */
export function useDisclosure(inicial = false) {
  const [isOpen, setIsOpen] = useState(inicial)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])
  return { isOpen, open, close, toggle }
}
