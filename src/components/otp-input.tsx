import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OtpInputHandle {
  focus: () => void
}

interface OtpInputProps {
  length?: number
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onComplete?: (otp: string) => void
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  placeholder?: string
  autoFocus?: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sanitize(raw: string): string {
  return raw.replace(/\D/g, '')
}

function toDigits(value: string, length: number): string[] {
  const clean = sanitize(value).slice(0, length)

  return Array.from({ length }, (_, i) => clean[i] ?? '')
}

// ─── OtpInput Component ────────────────────────────────────────────────────

export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(
  function OtpInput(
    {
      length = 6,
      value: controlledValue,
      defaultValue = '',
      onChange,
      onComplete,
      disabled = false,
      error = false,
      errorMessage,
      placeholder = '',
      autoFocus = false,
    },
    ref,
  ) {
    const isControlled = controlledValue !== undefined

    const [internalValue, setInternalValue] = useState(() =>
      sanitize(defaultValue).slice(0, length),
    )

    const currentValue = isControlled
      ? sanitize(controlledValue).slice(0, length)
      : internalValue

    const digits = toDigits(currentValue, length)

    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const wasCompleteRef = useRef(currentValue.length === length)
    const errorId = `otp-error-${length}`

    // ── Expose focus via ref ──────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRefs.current[0]?.focus()
      },
    }))

    // ── Auto-focus ────────────────────────────────────────────────────

    useEffect(() => {
      if (autoFocus && !disabled) {
        inputRefs.current[0]?.focus()
      }
    }, [autoFocus, disabled])

    // ── Update value ──────────────────────────────────────────────────

    const updateValue = useCallback(
      (nextValue: string) => {
        if (!isControlled) {
          setInternalValue(nextValue)
        }

        onChange?.(nextValue)
      },
      [isControlled, onChange],
    )

    // ── onComplete tracking ───────────────────────────────────────────

    useEffect(() => {
      const isComplete = currentValue.length === length

      if (isComplete && !wasCompleteRef.current) {
        onComplete?.(currentValue)
      }

      wasCompleteRef.current = isComplete
    }, [currentValue, length, onComplete])

    // ── Focus helper ──────────────────────────────────────────────────

    const focusInput = (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1))
      inputRefs.current[clamped]?.focus()
      inputRefs.current[clamped]?.select()
    }

    // ── Handle input ──────────────────────────────────────────────────

    const handleInput = (index: number, inputValue: string) => {
      if (disabled) return

      const digit = sanitize(inputValue).slice(-1)

      if (!digit) return

      const nextDigits = [...digits]
      nextDigits[index] = digit

      updateValue(nextDigits.join(''))

      // Move to next input
      if (index < length - 1) {
        focusInput(index + 1)
      }
    }

    // ── Handle keydown ────────────────────────────────────────────────

    const handleKeyDown = (
      index: number,
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (disabled) return

      switch (event.key) {
        case 'Backspace': {
          event.preventDefault()

          const nextDigits = [...digits]

          if (digits[index]) {
            // Clear current
            nextDigits[index] = ''
            updateValue(nextDigits.join(''))
          } else if (index > 0) {
            // Move back and clear
            nextDigits[index - 1] = ''
            updateValue(nextDigits.join(''))
            focusInput(index - 1)
          }
          break
        }

        case 'ArrowLeft':
          event.preventDefault()
          if (index > 0) focusInput(index - 1)
          break

        case 'ArrowRight':
          event.preventDefault()
          if (index < length - 1) focusInput(index + 1)
          break

        case 'Home':
          event.preventDefault()
          focusInput(0)
          break

        case 'End':
          event.preventDefault()
          focusInput(length - 1)
          break

        default: {
          // If it's a digit, let handleInput deal with it via onChange
          // If it's not a digit and not a special key, prevent
          if (/^\d$/.test(event.key)) {
            // Will be handled by onChange
          } else if (event.key.length === 1) {
            event.preventDefault()
          }
        }
      }
    }

    // ── Handle paste ──────────────────────────────────────────────────

    const handlePaste = (
      index: number,
      event: React.ClipboardEvent<HTMLInputElement>,
    ) => {
      if (disabled) return

      event.preventDefault()

      const pasted = sanitize(event.clipboardData.getData('text'))

      if (!pasted) return

      const nextDigits = [...digits]
      const chars = pasted.slice(0, length - index).split('')

      chars.forEach((char, offset) => {
        if (index + offset < length) {
          nextDigits[index + offset] = char
        }
      })

      updateValue(nextDigits.join(''))

      // Focus the input after the last pasted digit
      const focusTarget = Math.min(index + chars.length, length - 1)
      focusInput(focusTarget)
    }

    // ── Handle focus ──────────────────────────────────────────────────

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      event.target.select()
    }

    return (
      <div className="flex flex-col items-center gap-3">
        {/* OTP Inputs */}
        <div className="flex gap-2.5" role="group" aria-label="OTP Input">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              placeholder={placeholder}
              disabled={disabled}
              aria-label={`Digit ${index + 1} of ${length}`}
              aria-invalid={error}
              aria-describedby={error && errorMessage ? errorId : undefined}
              onChange={(e) => handleInput(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              onFocus={handleFocus}
              className={`flex h-14 w-12 cursor-text items-center justify-center rounded-xl border-2 bg-zinc-800/60 text-center text-xl font-semibold transition-all duration-200 outline-none placeholder:text-zinc-600 ${
                disabled
                  ? 'cursor-not-allowed border-zinc-800 bg-zinc-800/30 text-zinc-600 opacity-50'
                  : error
                    ? 'border-red-500/60 text-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
                    : digit
                      ? 'border-violet-500/50 text-zinc-100 shadow-sm shadow-violet-500/10'
                      : 'border-zinc-700 text-zinc-100 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && errorMessage && (
          <p id={errorId} className="text-sm text-red-400" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    )
  },
)

// ─── Demo / Play Area ───────────────────────────────────────────────────────

export function OtpInputPlayArea() {
  const [otp, setOtp] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'verifying' | 'success' | 'error'
  >('idle')
  const otpRef = useRef<OtpInputHandle>(null)

  const handleComplete = useCallback((completedOtp: string) => {
    setStatus('verifying')

    // Simulate verification
    setTimeout(() => {
      if (completedOtp === '123456') {
        setStatus('success')
      } else {
        setStatus('error')
      }
    }, 1200)
  }, [])

  const handleReset = () => {
    setOtp('')
    setStatus('idle')
    otpRef.current?.focus()
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <h1 className="text-xl font-bold tracking-wide text-zinc-100">
        OTP Verification
      </h1>

      <div className="flex w-full flex-col items-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-6 py-8 shadow-2xl shadow-violet-500/5 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm text-zinc-400">
            Enter the 6-digit code sent to your device
          </p>
        </div>

        <OtpInput
          ref={otpRef}
          length={6}
          value={otp}
          onChange={setOtp}
          onComplete={handleComplete}
          autoFocus
          error={status === 'error'}
          errorMessage={
            status === 'error' ? 'Invalid OTP. Try 123456.' : undefined
          }
          placeholder="·"
          disabled={status === 'verifying' || status === 'success'}
        />

        {/* Status indicator */}
        {status === 'verifying' && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <svg
              className="h-4 w-4 animate-spin text-violet-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Verifying...
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            Verified successfully!
          </div>
        )}

        {(status === 'error' || status === 'success') && (
          <button
            type="button"
            onClick={handleReset}
            className="cursor-pointer rounded-lg bg-zinc-800 px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            {status === 'error' ? 'Try Again' : 'Reset'}
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-600">
        Hint: the correct code is <span className="text-zinc-400">123456</span>
      </p>
    </div>
  )
}
