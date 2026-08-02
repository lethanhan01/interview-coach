import { cn } from '@/lib/utils'

export interface LogoutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function LogoutButton({ className, ...props }: LogoutButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'text-ink-muted hover:text-brand-subtle-fg hover:bg-brand-subtle focus-visible:ring-brand rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className
      )}
    >
      Đăng xuất
    </button>
  )
}
