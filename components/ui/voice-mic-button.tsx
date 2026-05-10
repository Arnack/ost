'use client'

import { cn } from '@/lib/utils'

interface VoiceMicButtonProps {
  active: boolean
  interimText?: string
  label?: string
  size?: 'sm' | 'md'
  onClick: () => void
}

/**
 * Animated microphone button for voice input.
 * Shows pulsing rings and sound bars when active.
 */
export function VoiceMicButton({
  active,
  interimText,
  label,
  size = 'md',
  onClick,
}: VoiceMicButtonProps) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11'
  const text = interimText || label || 'Запись'

  return (
    <>
      <style>{`
        @keyframes voiceBar {
          from { transform: scaleY(0.35); }
          to   { transform: scaleY(1); }
        }
      `}</style>
      <div className={cn('relative flex items-center gap-2', size === 'sm' && 'gap-1.5')}>
        <button
          type="button"
          onClick={onClick}
          title={active ? 'Остановить запись' : 'Голосовой ввод'}
          className={cn(
            'relative flex shrink-0 items-center justify-center rounded-full border-2',
            'transition-all duration-200 focus:outline-none select-none',
            dim,
            active
              ? 'border-red-500 bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
              : 'border-border bg-background text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-sm'
          )}
        >
          {/* Pulse rings when recording */}
          {active && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-40" />
              <span className="absolute inset-[-5px] animate-pulse rounded-full border-2 border-red-400 opacity-50" />
            </>
          )}

          {/* Icon: sound bars when active, mic SVG when idle */}
          {active ? (
            <span className="relative flex items-end gap-[2px]" style={{ height: 16 }}>
              {[1.8, 3, 2.4, 4, 2.4, 3, 1.8].map((h, i) => (
                <span
                  key={i}
                  className="w-[2.5px] rounded-full bg-white"
                  style={{
                    height: `${h * 4}px`,
                    animation: `voiceBar 0.45s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.07}s`,
                    transformOrigin: 'bottom',
                  }}
                />
              ))}
            </span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        {/* Label / interim text bubble */}
        {(active || label) && (
          <span
            className={cn(
              'flex max-w-[260px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
              active
                ? 'border-red-200 bg-red-50 text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950/60 dark:text-red-300'
                : 'border-border bg-muted/40 text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 shrink-0 rounded-full',
                active ? 'animate-pulse bg-red-500' : 'bg-muted-foreground/50'
              )}
            />
            <span className={cn('truncate', active && interimText && 'italic')}>
              {active ? text : label}
            </span>
          </span>
        )}
      </div>
    </>
  )
}
