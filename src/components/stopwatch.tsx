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

  const updateTime = useCallback(() => {
    if (startTimeRef.current === null) {
      return
    }

    const currentTime =
      elapsedBeforeStartRef.current + (Date.now() - startTimeRef.current)

    setElapsed(currentTime)

    animationFrameRef.current = requestAnimationFrame(updateTime)
  }, [])

  const start = useCallback(() => {
    if (startTimeRef.current !== null) {
      return
    }

    startTimeRef.current = Date.now()

    setIsRunning(true)

    animationFrameRef.current = requestAnimationFrame(updateTime)
  }, [updateTime])

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
        maxWidth: '500px',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'center',
        }}
      >
        {formatTime(elapsed)}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <button type="button" onClick={start} disabled={isRunning}>
          Start
        </button>

        <button type="button" onClick={pause} disabled={!isRunning}>
          Pause
        </button>

        <button
          type="button"
          onClick={start}
          disabled={isRunning || elapsed === 0}
        >
          Resume
        </button>

        <button type="button" onClick={recordLap} disabled={!isRunning}>
          Lap
        </button>

        <button
          type="button"
          onClick={reset}
          disabled={elapsed === 0 && laps.length === 0}
        >
          Reset
        </button>
      </div>

      {laps.length > 0 && (
        <div>
          <h3>Laps</h3>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {laps.map((lap) => (
              <div
                key={lap.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px',
                  borderBottom: '1px solid #ddd',
                }}
              >
                <span>Lap {lap.id}</span>

                <span>Total: {formatTime(lap.totalTime)}</span>

                <span>Lap: {formatTime(lap.lapTime)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
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
