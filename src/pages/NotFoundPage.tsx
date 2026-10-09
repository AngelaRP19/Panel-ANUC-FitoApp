import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <Link to="/casos" className="text-sm text-verde-700 hover:underline">
        Volver a casos
      </Link>
    </div>
  )
}
