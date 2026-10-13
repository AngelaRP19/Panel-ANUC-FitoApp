import { ClipboardCheck, Leaf, Map } from 'lucide-react'
import { useLocation, useNavigate, type Location } from 'react-router'
import { LoginForm } from '@/features/auth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PATHS } from '@/routes/paths'

const PUNTOS = [
  { icon: Leaf, texto: 'Gulupa, granadilla y maracuyá de Zetaquirá, Boyacá' },
  {
    icon: ClipboardCheck,
    texto: 'El sistema orienta con una identificación preliminar; el técnico decide',
  },
  { icon: Map, texto: 'Mapa de vigilancia y alertas de posible concentración' },
]

// TODO(pantalla 1): consultar GET /auth/estado y redirigir a /primer-uso si aún no hay líder (RQF01).
export default function LoginPage() {
  usePageTitle('Inicia sesión')
  const navigate = useNavigate()
  const location = useLocation()
  const destino = (location.state as { from?: Location } | null)?.from?.pathname ?? PATHS.inicio

  return (
    <div className="flex min-h-screen bg-verde-50">
      {/* Panel de marca: se oculta en pantallas pequeñas */}
      <aside className="hidden w-140 flex-none flex-col gap-8 bg-verde-950 p-14 text-verde-100 lg:flex">
        <div>
          <p className="font-titulos text-display font-bold text-blanco">ANUC Zetaquirá</p>
          <p className="font-medium text-verde-300">Panel fitosanitario</p>
        </div>
        <p className="mt-12 max-w-105 text-lg leading-7">
          Revisa los casos que los productores envían por WhatsApp, registra el diagnóstico técnico
          y vigila posibles concentraciones de casos.
        </p>
        <ul className="flex flex-col gap-4 text-[15px] leading-[22px]">
          {PUNTOS.map(({ icon: Icon, texto }) => (
            <li key={texto} className="flex gap-3">
              <Icon
                size={20}
                strokeWidth={1.75}
                className="flex-none text-verde-300"
                aria-hidden="true"
              />
              {texto}
            </li>
          ))}
        </ul>
        <p className="mt-auto text-nota text-verde-300">
          Uso exclusivo de los técnicos de la asociación. 
        </p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
        {/* Marca compacta para pantallas pequeñas */}
        <div className="text-center lg:hidden">
          <p className="font-titulos text-h1 font-bold text-verde-950">ANUC Zetaquirá</p>
          <p className="text-cuerpo-sm font-medium text-tinta-secundaria">Panel fitosanitario</p>
        </div>
        <LoginForm onSuccess={() => navigate(destino, { replace: true })} />
      </main>
    </div>
  )
}
