// Hooks de TanStack Query del feature "usuarios". Las páginas solo usan estos hooks.

export const usuariosKeys = {
  all: ['usuarios'] as const,
  lists: () => [...usuariosKeys.all, 'list'] as const,
  list: (params: object) => [...usuariosKeys.lists(), params] as const,
  detail: (id: string) => [...usuariosKeys.all, 'detail', id] as const,
}
