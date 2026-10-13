import { useState } from 'react'
import { cn } from '@/utils/cn'
import { Button } from './Button'
import { Input } from './Input'

type PasswordInputProps = Omit<Parameters<typeof Input>[0], 'type' | 'mono'>

/**
 * Campo de contraseña con botón «Mostrar» / «Ocultar» (WCAG 2.2, 3.3.8): permite pegar,
 * es compatible con gestores de contraseñas y el botón expone su estado con aria-pressed.
 */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-22', className)} {...props} />
      <Button
        variant="text"
        size="sm"
        className="absolute top-1 right-1"
        aria-pressed={visible}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? 'Ocultar' : 'Mostrar'}
      </Button>
    </div>
  )
}
