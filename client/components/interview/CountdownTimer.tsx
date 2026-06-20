import { useCountdown } from '@/hooks/useCountdown'

interface CountdownTimerProps {
  durationMin: number
  active: boolean
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CountdownTimer({ durationMin, active }: CountdownTimerProps) {
  const totalSeconds = durationMin * 60
  const { remainingSeconds, isWarning, isExpired } = useCountdown(totalSeconds, active)

  const colorClass = isExpired
    ? 'text-danger'
    : isWarning
      ? 'text-amber-500'
      : 'text-ink-muted'

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-ink-muted">Còn lại</span>
      <span className={`font-mono text-sm font-medium tabular-nums ${colorClass}`}>
        {formatTime(remainingSeconds)}
      </span>
    </div>
  )
}
