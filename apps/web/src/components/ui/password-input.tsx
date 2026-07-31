import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from './button'
import { Input } from './input'

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'>

function PasswordInput({ className, disabled, id, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false)
  const action = visible ? 'Hide password' : 'Show password'

  return (
    <div className="relative">
      <Input
        {...props}
        id={id}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={cn('pr-11', className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground active:not-aria-[haspopup]:-translate-y-1/2"
        aria-label={action}
        aria-controls={id}
        aria-pressed={visible}
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  )
}

export { PasswordInput }
