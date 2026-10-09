import { LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ROL_LABEL } from '@/locales/es'

export function Topbar() {
  const { usuario, cerrarSesion } = useAuth()

  return (
    <header className="flex h-14 items-center justify-end gap-4 border-b border-borde bg-blanco px-6">
      {usuario && (
        <span className="text-sm text-tinta-secundaria">
          {usuario.nombre} · {ROL_LABEL[usuario.rol]}
        </span>
      )}
      {/* TODO(F2): llamar a /auth/logout antes de limpiar la sesión */}
      <button
        type="button"
        onClick={cerrarSesion}
        className="flex items-center gap-1 text-sm text-tinta-secundaria hover:text-tinta"
      >
        <LogOut size={16} /> Salir
      </button>
    </header>
  )
}
