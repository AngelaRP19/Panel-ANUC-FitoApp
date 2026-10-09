// Hooks de TanStack Query del feature "productores". Las páginas solo usan estos hooks.

export const productoresKeys = {
  all: ['productores'] as const,
  lists: () => [...productoresKeys.all, 'list'] as const,
  list: (params: object) => [...productoresKeys.lists(), params] as const,
  detail: (id: string) => [...productoresKeys.all, 'detail', id] as const,
}
