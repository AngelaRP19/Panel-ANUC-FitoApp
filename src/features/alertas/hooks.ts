// Hooks de TanStack Query del feature "alertas". Las páginas solo usan estos hooks.

export const alertasKeys = {
  all: ['alertas'] as const,
  lists: () => [...alertasKeys.all, 'list'] as const,
  list: (params: object) => [...alertasKeys.lists(), params] as const,
  detail: (id: string) => [...alertasKeys.all, 'detail', id] as const,
}
