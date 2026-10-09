// Hooks de TanStack Query del feature "casos". Las páginas solo usan estos hooks.

export const casosKeys = {
  all: ['casos'] as const,
  lists: () => [...casosKeys.all, 'list'] as const,
  list: (params: object) => [...casosKeys.lists(), params] as const,
  detail: (id: string) => [...casosKeys.all, 'detail', id] as const,
}
