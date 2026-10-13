import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

interface EnConstruccionPageProps {
  titulo: string
  /** Número de la pantalla en la tabla maestra de la guía. */
  pantalla: number
}

/** Página temporal para las rutas que aún no se desarrollan (se reemplaza pantalla por pantalla). */
export default function EnConstruccionPage({ titulo, pantalla }: EnConstruccionPageProps) {
  return (
    <>
      <PageHeader title={titulo} />
      <Card>
        <EmptyState
          icon={Construction}
          title="Pantalla en construcción"
          message={`Esta sección corresponde a la pantalla ${pantalla} del plan de desarrollo y todavía no está disponible.`}
        />
      </Card>
    </>
  )
}
