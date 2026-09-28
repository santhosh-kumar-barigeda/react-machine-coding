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
    <StarRating
      value={rating}
      maxRating={5}
      onChange={setRating}
      readOnly={false}
      size={48}
      color="gold"
    />
  )
}

export function StarRating({
  maxRating = 5,
  value,
  onChange,
  readOnly = false,
  size = 32,
  color = 'gold',
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <div
        role="radiogroup"
        aria-label="Star rating"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}
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
              style={{
                position: 'relative',
                width: size,
                height: size,
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: readOnly ? 'default' : 'pointer',
                fontSize: size,
                lineHeight: 1,
              }}
            >
              {/* Empty star */}
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  color: '#ccc',
                }}
              >
                ★
              </span>

              {/* Filled / half-filled star */}
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  color,
                  width: fill,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                ★
              </span>
            </button>
          )
        })}
      </div>

      <p
        style={{
          margin: 0,
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
        }}
      >
        Rating: {value ?? 0}/{maxRating}
      </p>
    </div>
  )
}
