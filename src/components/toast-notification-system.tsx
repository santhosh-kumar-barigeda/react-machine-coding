import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

// ─── Types ──────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastOptions {
  duration?: number
  action?: ToastAction
}

interface ToastData {
  id: string
  type: ToastType
  message: string
  duration: number
  action?: ToastAction
  exiting?: boolean
}

interface ToastContextValue {
  success: (message: string, options?: ToastOptions) => string
  error: (message: string, options?: ToastOptions) => string
  warning: (message: string, options?: ToastOptions) => string
  info: (message: string, options?: ToastOptions) => string
  update: (
    id: string,
    updates: Partial<Pick<ToastData, 'message' | 'type'>>,
  ) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

// ─── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── useToast Hook ──────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a <ToastProvider>')
  }

  return context
}

// ─── ID Generator ───────────────────────────────────────────────────────────

let toastCounter = 0

function generateId(): string {
  return `toast-${++toastCounter}-${Date.now()}`
}

// ─── ToastProvider ──────────────────────────────────────────────────────────

interface ToastProviderProps {
  children: ReactNode
  position?: ToastPosition
  duration?: number
  maxToasts?: number
}

export function ToastProvider({
  children,
  position = 'top-right',
  duration: defaultDuration = 4000,
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  // ── Clear a specific timer ──────────────────────────────────────────

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id)

    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  // ── Remove toast (with exit animation) ──────────────────────────────

  const removeToast = useCallback(
    (id: string) => {
      clearTimer(id)

      // Trigger exit animation
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      )

      // Remove after animation
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 300)
    },
    [clearTimer],
  )

  // ── Start auto-dismiss timer ────────────────────────────────────────

  const startTimer = useCallback(
    (id: string, duration: number) => {
      if (duration <= 0) return

      clearTimer(id)

      const timer = setTimeout(() => {
        removeToast(id)
      }, duration)

      timersRef.current.set(id, timer)
    },
    [clearTimer, removeToast],
  )

  // ── Add toast ───────────────────────────────────────────────────────

  const addToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      const id = generateId()
      const duration = options?.duration ?? defaultDuration

      const toast: ToastData = {
        id,
        type,
        message,
        duration,
        action: options?.action,
      }

      setToasts((prev) => {
        const next = [...prev, toast]

        // Enforce maxToasts — remove oldest (mark as exiting)
        if (next.length > maxToasts) {
          const excessCount = next.length - maxToasts

          return next.map((t, i) =>
            i < excessCount && !t.exiting ? { ...t, exiting: true } : t,
          )
        }

        return next
      })

      // Clean up excess toasts after animation
      setToasts((prev) => {
        if (prev.length > maxToasts) {
          setTimeout(() => {
            setToasts((current) => {
              const excess = current.length - maxToasts

              if (excess > 0) {
                // Clear timers for removed toasts
                current.slice(0, excess).forEach((t) => clearTimer(t.id))

                return current.slice(excess)
              }

              return current
            })
          }, 300)
        }

        return prev
      })

      if (duration > 0) {
        startTimer(id, duration)
      }

      return id
    },
    [defaultDuration, maxToasts, startTimer, clearTimer],
  )

  // ── Update toast ────────────────────────────────────────────────────

  const update = useCallback(
    (id: string, updates: Partial<Pick<ToastData, 'message' | 'type'>>) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      )
    },
    [],
  )

  // ── Dismiss all ─────────────────────────────────────────────────────

  const dismissAll = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, exiting: true })))

    setTimeout(() => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
      timersRef.current.clear()
      setToasts([])
    }, 300)
  }, [])

  // ── Cleanup on unmount ──────────────────────────────────────────────

  useEffect(() => {
    const timers = timersRef.current

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  // ── API ─────────────────────────────────────────────────────────────

  const api: ToastContextValue = {
    success: (msg, opts) => addToast('success', msg, opts),
    error: (msg, opts) => addToast('error', msg, opts),
    warning: (msg, opts) => addToast('warning', msg, opts),
    info: (msg, opts) => addToast('info', msg, opts),
    update,
    dismiss: removeToast,
    dismissAll,
  }

  return (
    <ToastContext.Provider value={api}>
      {children}

      {createPortal(
        <ToastContainer
          toasts={toasts}
          position={position}
          onDismiss={removeToast}
          onPauseTimer={clearTimer}
          onResumeTimer={startTimer}
        />,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

// ─── Toast Container ────────────────────────────────────────────────────────

const positionClasses: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
}

function ToastContainer({
  toasts,
  position,
  onDismiss,
  onPauseTimer,
  onResumeTimer,
}: {
  toasts: ToastData[]
  position: ToastPosition
  onDismiss: (id: string) => void
  onPauseTimer: (id: string) => void
  onResumeTimer: (id: string, duration: number) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      className={`pointer-events-none fixed z-[9999] flex flex-col gap-3 ${positionClasses[position]}`}
      style={{ maxWidth: '420px', width: '100%' }}
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onPauseTimer={onPauseTimer}
          onResumeTimer={onResumeTimer}
        />
      ))}
    </div>
  )
}

// ─── Toast Item ─────────────────────────────────────────────────────────────

const typeConfig: Record<
  ToastType,
  { icon: string; borderColor: string; iconColor: string; bgTint: string }
> = {
  success: {
    icon: '✓',
    borderColor: 'border-emerald-500/30',
    iconColor: 'bg-emerald-500/20 text-emerald-400',
    bgTint: 'shadow-emerald-500/10',
  },
  error: {
    icon: '✕',
    borderColor: 'border-red-500/30',
    iconColor: 'bg-red-500/20 text-red-400',
    bgTint: 'shadow-red-500/10',
  },
  warning: {
    icon: '⚠',
    borderColor: 'border-amber-500/30',
    iconColor: 'bg-amber-500/20 text-amber-400',
    bgTint: 'shadow-amber-500/10',
  },
  info: {
    icon: 'ℹ',
    borderColor: 'border-blue-500/30',
    iconColor: 'bg-blue-500/20 text-blue-400',
    bgTint: 'shadow-blue-500/10',
  },
}

function ToastItem({
  toast,
  onDismiss,
  onPauseTimer,
  onResumeTimer,
}: {
  toast: ToastData
  onDismiss: (id: string) => void
  onPauseTimer: (id: string) => void
  onResumeTimer: (id: string, duration: number) => void
}) {
  const remainingRef = useRef(toast.duration)
  const pausedAtRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)

  useEffect(() => {
    startedAtRef.current = Date.now()
  }, [])

  const config = typeConfig[toast.type]

  const role =
    toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'

  const ariaLive =
    toast.type === 'error' || toast.type === 'warning'
      ? 'assertive'
      : ('polite' as const)

  const handleMouseEnter = () => {
    if (toast.duration <= 0) return

    pausedAtRef.current = Date.now()

    const elapsed = Date.now() - startedAtRef.current

    remainingRef.current = Math.max(0, toast.duration - elapsed)
    onPauseTimer(toast.id)
  }

  const handleMouseLeave = () => {
    if (toast.duration <= 0 || remainingRef.current <= 0) return

    pausedAtRef.current = null
    startedAtRef.current = Date.now()
    onResumeTimer(toast.id, remainingRef.current)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onDismiss(toast.id)
    }
  }

  const handleAction = () => {
    toast.action?.onClick()
    onDismiss(toast.id)
  }

  return (
    <div
      role={role}
      aria-live={ariaLive}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-zinc-900/95 px-4 py-3.5 shadow-xl backdrop-blur-xl transition-all duration-300 ${config.borderColor} ${config.bgTint} ${
        toast.exiting
          ? 'translate-x-4 opacity-0'
          : 'translate-x-0 animate-[slideIn_0.3s_ease-out] opacity-100'
      }`}
    >
      {/* Type icon */}
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${config.iconColor}`}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm leading-snug text-zinc-200">{toast.message}</p>

        {toast.action && (
          <button
            type="button"
            onClick={handleAction}
            className="w-fit cursor-pointer rounded-md bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/20"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Close notification"
        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
      >
        ✕
      </button>
    </div>
  )
}

// ─── Keyframe injection (self-contained, no global CSS) ─────────────────────

const styleId = 'toast-keyframes'

if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style')

  style.id = styleId
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(16px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `
  document.head.appendChild(style)
}

// ─── Demo / Play Area ───────────────────────────────────────────────────────

export function ToastPlayArea() {
  return (
    <ToastProvider position="top-right" duration={4000} maxToasts={5}>
      <ToastDemo />
    </ToastProvider>
  )
}

function ToastDemo() {
  const toast = useToast()
  const uploadIdRef = useRef<string | null>(null)

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <h1 className="text-xl font-bold tracking-wide text-zinc-100">
        Toast Notifications
      </h1>

      <div className="flex w-full flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-violet-500/5 backdrop-blur-sm">
        <p className="mb-2 text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Toast Types
        </p>

        <div className="grid grid-cols-2 gap-2">
          <DemoButton
            onClick={() => toast.success('Profile saved successfully!')}
            color="emerald"
          >
            Success
          </DemoButton>

          <DemoButton
            onClick={() =>
              toast.error('Something went wrong.', { duration: 5000 })
            }
            color="red"
          >
            Error
          </DemoButton>

          <DemoButton
            onClick={() => toast.warning('Your session is about to expire.')}
            color="amber"
          >
            Warning
          </DemoButton>

          <DemoButton
            onClick={() => toast.info('You have 3 new notifications.')}
            color="blue"
          >
            Info
          </DemoButton>
        </div>

        <div className="mt-2 border-t border-zinc-800 pt-4">
          <p className="mb-2 text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Features
          </p>

          <div className="flex flex-col gap-2">
            <DemoButton
              onClick={() =>
                toast.info('This toast will not auto-dismiss.', {
                  duration: 0,
                })
              }
              color="zinc"
            >
              Persistent Toast
            </DemoButton>

            <DemoButton
              onClick={() =>
                toast.info('New message from Alice', {
                  action: {
                    label: 'View',
                    onClick: () => {
                      toast.success('Navigating to messages...')
                    },
                  },
                })
              }
              color="zinc"
            >
              Toast with Action
            </DemoButton>

            <DemoButton
              onClick={() => {
                const id = toast.info('Uploading file... 0%', { duration: 0 })

                uploadIdRef.current = id

                let progress = 0

                const interval = setInterval(() => {
                  progress += 20

                  if (progress >= 100) {
                    clearInterval(interval)
                    toast.update(id, {
                      message: 'Upload complete!',
                      type: 'success',
                    })

                    setTimeout(() => toast.dismiss(id), 2000)
                  } else {
                    toast.update(id, {
                      message: `Uploading file... ${progress}%`,
                    })
                  }
                }, 600)
              }}
              color="zinc"
            >
              Updatable Toast
            </DemoButton>

            <DemoButton onClick={() => toast.dismissAll()} color="zinc">
              Dismiss All
            </DemoButton>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-600">
        Hover over a toast to pause its timer
      </p>
    </div>
  )
}

function DemoButton({
  onClick,
  color,
  children,
}: {
  onClick: () => void
  color: 'emerald' | 'red' | 'amber' | 'blue' | 'zinc'
  children: ReactNode
}) {
  const colors = {
    emerald:
      'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border-emerald-500/20',
    red: 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border-red-500/20',
    amber:
      'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border-amber-500/20',
    blue: 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-blue-500/20',
    zinc: 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700/80 border-zinc-600/30',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${colors[color]}`}
    >
      {children}
    </button>
  )
}
