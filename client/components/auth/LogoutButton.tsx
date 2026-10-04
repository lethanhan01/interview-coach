import Button, { type ButtonProps } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export type LogoutButtonProps = ButtonProps

export default function LogoutButton({ className, variant = 'ghost', size = 'sm', ...props }: LogoutButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'text-ink-muted hover:text-brand-subtle-fg hover:bg-brand-subtle font-normal',
        className
      )}
      {...props}
    >
      Đăng xuất
    </Button>
  )
}

