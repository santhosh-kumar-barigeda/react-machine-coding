import { useCallback, useEffect, useRef, useState } from 'react'

interface Lap {
  id: number
  totalTime: number
  lapTime: number
}

interface StopwatchProps {
  autoStart?: boolean
  onLap?: (lap: Lap) => void
}

export function Stopwatch({ autoStart = false, onLap }: StopwatchProps) {
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [laps, setLaps] = useState<Lap[]>([])

  const startTimeRef = useRef<number | null>(null)
  const elapsedBeforeStartRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const lastLapTimeRef = useRef(0)
  const lapIdRef = useRef(0)

  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const startAnimation = useCallback(() => {
    const tick = () => {
      if (startTimeRef.current === null) {
        return
      }

      const currentTime =
        elapsedBeforeStartRef.current + (Date.now() - startTimeRef.current)

      setElapsed(currentTime)

      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(() => {
    if (startTimeRef.current !== null) {
      return
    }

    startTimeRef.current = Date.now()

    setIsRunning(true)

    startAnimation()
  }, [startAnimation])

  const pause = useCallback(() => {
    if (startTimeRef.current === null) {
      return
    }

    const currentElapsed =
      elapsedBeforeStartRef.current + (Date.now() - startTimeRef.current)

    elapsedBeforeStartRef.current = currentElapsed

    startTimeRef.current = null

    setElapsed(currentElapsed)
    setIsRunning(false)

    cancelAnimation()
  }, [cancelAnimation])

  const reset = useCallback(() => {
    cancelAnimation()

    startTimeRef.current = null
    elapsedBeforeStartRef.current = 0
    lastLapTimeRef.current = 0
    lapIdRef.current = 0

    setElapsed(0)
    setIsRunning(false)
    setLaps([])
  }, [cancelAnimation])

  const recordLap = useCallback(() => {
    if (startTimeRef.current === null) {
      return
    }

    const currentElapsed =
      elapsedBeforeStartRef.current + (Date.now() - startTimeRef.current)

    const lapTime = currentElapsed - lastLapTimeRef.current

    const lap: Lap = {
      id: ++lapIdRef.current,
      totalTime: currentElapsed,
      lapTime,
    }

    lastLapTimeRef.current = currentElapsed

    setElapsed(currentElapsed)

    setLaps((previousLaps) => [...previousLaps, lap])

    onLap?.(lap)
  }, [onLap])

  useEffect(() => {
    if (autoStart) {
      start()
    }

    return cancelAnimation
  }, [autoStart, start, cancelAnimation])

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-violet-500/5 backdrop-blur-sm">
      {/* Timer display */}
      <div className="relative">
        <div className="absolute -inset-4 rounded-full bg-violet-500/10 blur-2xl" />

        <div className="relative font-mono text-5xl font-light tracking-wider text-zinc-100 tabular-nums">
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-3">
        <StopwatchButton onClick={start} disabled={isRunning} variant="primary">
          Start
        </StopwatchButton>

        <StopwatchButton
          onClick={pause}
          disabled={!isRunning}
          variant="warning"
        >
          Pause
        </StopwatchButton>

        <StopwatchButton
          onClick={start}
          disabled={isRunning || elapsed === 0}
          variant="success"
        >
          Resume
        </StopwatchButton>

        <StopwatchButton
          onClick={recordLap}
          disabled={!isRunning}
          variant="default"
        >
          Lap
        </StopwatchButton>

        <StopwatchButton
          onClick={reset}
          disabled={elapsed === 0 && laps.length === 0}
          variant="danger"
        >
          Reset
        </StopwatchButton>
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div className="w-full">
          <h3 className="mb-3 text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Laps
          </h3>

          <div className="flex max-h-52 flex-col gap-1 overflow-y-auto pr-1">
            {laps.map((lap) => (
              <div
                key={lap.id}
                className="flex items-center justify-between rounded-lg bg-zinc-800/60 px-4 py-2.5 text-sm transition-colors hover:bg-zinc-800"
              >
                <span className="font-medium text-zinc-400">Lap {lap.id}</span>

                <span className="font-mono text-zinc-300 tabular-nums">
                  {formatTime(lap.totalTime)}
                </span>

                <span className="font-mono text-violet-400 tabular-nums">
                  {formatTime(lap.lapTime)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StopwatchButton({
  onClick,
  disabled,
  variant,
  children,
}: {
  onClick: () => void
  disabled: boolean
  variant: 'primary' | 'success' | 'warning' | 'danger' | 'default'
  children: React.ReactNode
}) {
  const variants = {
    primary:
      'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20',
    success:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
    warning:
      'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20',
    danger:
      'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20',
    default:
      'bg-zinc-700 hover:bg-zinc-600 text-zinc-200 shadow-lg shadow-zinc-900/40',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-30 disabled:shadow-none ${variants[variant]}`}
    >
      {children}
    </button>
  )
}

export function StopwatchPlayArea() {
  return <Stopwatch />
}

function formatTime(milliseconds: number) {
  const totalMilliseconds = Math.max(0, milliseconds)

  const hours = Math.floor(totalMilliseconds / (60 * 60 * 1000))

  const minutes = Math.floor(
    (totalMilliseconds % (60 * 60 * 1000)) / (60 * 1000),
  )

  const seconds = Math.floor((totalMilliseconds % (60 * 1000)) / 1000)

  const ms = totalMilliseconds % 1000

  return (
    [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0'),
    ].join(':') + `.${String(ms).padStart(3, '0')}`
  )
}
