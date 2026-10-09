// Hooks de TanStack Query del feature "cultivos". Las páginas solo usan estos hooks.

export const cultivosKeys = {
  all: ['cultivos'] as const,
  lists: () => [...cultivosKeys.all, 'list'] as const,
  list: (params: object) => [...cultivosKeys.lists(), params] as const,
  detail: (id: string) => [...cultivosKeys.all, 'detail', id] as const,
}
