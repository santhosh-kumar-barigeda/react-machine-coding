import { useState } from 'react'

interface StarRatingProps {
  maxRating?: number
  value: number | null
  onChange: (value: number) => void
  readOnly?: boolean
  size?: number
  color?: string
}

export function StarRatingPlayArea() {
  const [rating, setRating] = useState<number | null>(null)

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-10 shadow-2xl shadow-amber-500/5 backdrop-blur-sm">
      <StarRating
        value={rating}
        maxRating={5}
        onChange={setRating}
        readOnly={false}
        size={52}
        color="#fbbf24"
      />
    </div>
  )
}

export function StarRating({
  maxRating = 5,
  value,
  onChange,
  readOnly = false,
  size = 32,
  color = '#fbbf24',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue ?? value ?? 0

  const getRatingFromMouse = (
    event: React.MouseEvent<HTMLButtonElement>,
    starIndex: number,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left

    const isHalf = x < rect.width / 2

    return starIndex + (isHalf ? 0.5 : 1)
  }

  const getStarFill = (starIndex: number) => {
    const starValue = starIndex + 1

    if (displayValue >= starValue) {
      return '100%'
    }

    if (displayValue >= starValue - 0.5) {
      return '50%'
    }

    return '0%'
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    starIndex: number,
  ) => {
    if (readOnly) return

    if (event.key === 'ArrowRight') {
      event.preventDefault()

      const nextValue = Math.min(maxRating, (value ?? 0) + 0.5)

      setHoverValue(nextValue)
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()

      const nextValue = Math.max(0, (value ?? 0) - 0.5)

      setHoverValue(nextValue)
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      const selectedValue = hoverValue ?? starIndex + 1

      onChange(selectedValue)
      setHoverValue(null)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        role="radiogroup"
        aria-label="Star rating"
        className="flex items-center gap-1"
      >
        {Array.from({ length: maxRating }).map((_, starIndex) => {
          const fill = getStarFill(starIndex)

          return (
            <button
              key={starIndex}
              type="button"
              disabled={readOnly}
              aria-label={`Rate ${starIndex + 1} stars`}
              aria-pressed={value === starIndex + 1}
              onMouseMove={(event) => {
                if (!readOnly) {
                  setHoverValue(getRatingFromMouse(event, starIndex))
                }
              }}
              onMouseLeave={() => {
                if (!readOnly) {
                  setHoverValue(null)
                }
              }}
              onClick={(event) => {
                if (!readOnly) {
                  onChange(getRatingFromMouse(event, starIndex))
                  setHoverValue(null)
                }
              }}
              onKeyDown={(event) => handleKeyDown(event, starIndex)}
              className="group relative cursor-pointer border-none bg-transparent p-0 transition-transform duration-150 hover:scale-110 disabled:cursor-default disabled:hover:scale-100"
              style={{
                width: size,
                height: size,
                fontSize: size,
                lineHeight: 1,
              }}
            >
              {/* Empty star */}
              <span className="absolute inset-0" style={{ color: '#3f3f46' }}>
                ★
              </span>

              {/* Filled / half-filled star */}
              <span
                className="absolute inset-0 overflow-hidden whitespace-nowrap transition-[width] duration-150"
                style={{
                  color,
                  width: fill,
                  filter:
                    fill !== '0%' ? `drop-shadow(0 0 6px ${color}40)` : 'none',
                }}
              >
                ★
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="m-0 text-2xl font-bold text-zinc-100">
          {value ?? 0}
          <span className="text-lg font-normal text-zinc-500">
            /{maxRating}
          </span>
        </p>

        <p className="m-0 text-xs text-zinc-500">
          {value === null
            ? 'Click to rate'
            : value >= maxRating
              ? 'Perfect!'
              : value >= maxRating * 0.7
                ? 'Great!'
                : value >= maxRating * 0.4
                  ? 'Good'
                  : 'Could be better'}
        </p>
      </div>
    </div>
  )
}
