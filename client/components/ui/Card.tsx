import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ hover, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={[
        'bg-surface rounded-2xl shadow-card border border-border p-6',
        hover ? 'transition-all duration-150 hover:shadow-glow hover:-translate-y-0.5 cursor-pointer' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
