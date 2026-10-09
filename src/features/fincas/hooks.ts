// Hooks de TanStack Query del feature "fincas". Las páginas solo usan estos hooks.

export const fincasKeys = {
  all: ['fincas'] as const,
  lists: () => [...fincasKeys.all, 'list'] as const,
  list: (params: object) => [...fincasKeys.lists(), params] as const,
  detail: (id: string) => [...fincasKeys.all, 'detail', id] as const,
}
