import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge debe conocer la escala tipográfica propia (text-h1, text-cuerpo-sm…);
// si no, confunde `text-cuerpo-sm` con un color y elimina `text-tinta`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display', 'h1', 'h2', 'h3', 'kpi', 'cuerpo', 'cuerpo-sm', 'nota', 'sobretitulo'],
      shadow: ['1', '2'],
      radius: ['pill'],
    },
  },
})

/** Une clases condicionales y resuelve conflictos de Tailwind: cn('px-2', cond && 'px-4'). */
export function cn(...clases: ClassValue[]): string {
  return twMerge(clsx(clases))
}
