import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

export type FormValues = Record<string, unknown>

export type FieldType =
  'text' | 'email' | 'number' | 'select' | 'checkbox' | 'date'

export interface Field {
  id: string
  name: string
  type: FieldType
  label: string
  required?: boolean
  options?: string[]
  condition?: (values: FormValues) => boolean
  validate?: (
    value: unknown,
    values: FormValues,
  ) => string | undefined | Promise<string | undefined>
}

export interface Step {
  id: string
  title: string
  description?: string
  fields?: Field[]
  isReview?: boolean
  condition?: (values: FormValues) => boolean
}

interface MultiStepFormProps {
  steps: Step[]
  initialValues?: FormValues
  currentStep?: string
  onStepChange?: (stepId: string) => void
  onSubmit?: (values: FormValues) => void | Promise<void>
  allowStepNavigation?: boolean
  persistStepInUrl?: boolean
  storageKey?: string
}

// ─── MultiStepForm Component ────────────────────────────────────────────────

export function MultiStepForm({
  steps,
  initialValues = {},
  currentStep: controlledCurrentStep,
  onStepChange,
  onSubmit,
  allowStepNavigation = true,
  persistStepInUrl = false,
  storageKey = 'multi-step-form-save',
}: MultiStepFormProps) {
  // ─── Local Storage & Resume Prompt ─────────────────────────────────────────
  const [savedData] = useState<{
    values: FormValues
    stepId: string
    completed: string[]
  } | null>(() => {
    if (!storageKey) return null
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.values) {
          return parsed
        }
      } catch {
        // invalid data
      }
    }
    return null
  })

  const [resumePrompt, setResumePrompt] = useState(() => savedData !== null)

  // ─── State ────────────────────────────────────────────────────────────────
  const [values, setValues] = useState<FormValues>(initialValues)
  const [history, setHistory] = useState<FormValues[]>([])
  const [future, setFuture] = useState<FormValues[]>([])
  const [uncontrolledStep, setUncontrolledStep] = useState<string>(
    steps[0]?.id || '',
  )
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const activeStepId = controlledCurrentStep ?? uncontrolledStep

  // ─── Derived State ────────────────────────────────────────────────────────
  const visibleSteps = useMemo(
    () => steps.filter((s) => !s.condition || s.condition(values)),
    [steps, values],
  )

  const activeStepIndex = useMemo(
    () => visibleSteps.findIndex((s) => s.id === activeStepId),
    [visibleSteps, activeStepId],
  )

  const currentStep = visibleSteps[activeStepIndex] ?? visibleSteps[0]
  const currentStepIdx = visibleSteps.findIndex((s) => s.id === currentStep?.id)

  const isFirstStep = currentStepIdx === 0
  const isLastStep = currentStepIdx === visibleSteps.length - 1

  // ─── Sync URL ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (persistStepInUrl && currentStep) {
      const url = new URL(window.location.href)
      url.searchParams.set('step', currentStep.id)
      window.history.pushState({}, '', url)
    }
  }, [persistStepInUrl, currentStep?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!persistStepInUrl) return
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const step = params.get('step')
      if (step) {
        setUncontrolledStep(step)
        onStepChange?.(step)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [persistStepInUrl, onStepChange])

  // ─── Save Progress ────────────────────────────────────────────────────────
  useEffect(() => {
    if (storageKey && !resumePrompt && !submitSuccess) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          values,
          stepId: currentStep?.id,
          completed: Array.from(completedSteps),
        }),
      )
    }
  }, [
    values,
    currentStep?.id,
    completedSteps,
    storageKey,
    resumePrompt,
    submitSuccess,
  ])

  // ─── Actions ──────────────────────────────────────────────────────────────
  const updateStep = useCallback(
    (stepId: string) => {
      setUncontrolledStep(stepId)
      onStepChange?.(stepId)
    },
    [onStepChange],
  )

  const handleValueChange = useCallback(
    (name: string, value: unknown) => {
      setValues((prev) => {
        setHistory((h) => [...h, prev])
        setFuture([])
        return { ...prev, [name]: value }
      })
      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[name]
          return next
        })
      }
    },
    [errors],
  )

  const handleUndo = useCallback(() => {
    if (history.length === 0) return
    setValues((prev) => {
      const prevVal = history[history.length - 1]
      setHistory((h) => h.slice(0, -1))
      setFuture((f) => [prev, ...f])
      return prevVal
    })
  }, [history])

  const handleRedo = useCallback(() => {
    if (future.length === 0) return
    setValues((prev) => {
      const nextVal = future[0]
      setFuture((f) => f.slice(1))
      setHistory((h) => [...h, prev])
      return nextVal
    })
  }, [future])

  const validateStep = async (step: Step): Promise<boolean> => {
    const stepErrors: Record<string, string> = {}
    const fields = step.fields || []
    const activeFields = fields.filter(
      (f) => !f.condition || f.condition(values),
    )

    for (const field of activeFields) {
      const val = values[field.name]
      if (
        field.required &&
        (val === undefined || val === '' || val === false || val === null)
      ) {
        stepErrors[field.name] = `${field.label} is required`
        continue
      }
      if (val !== undefined && val !== '' && val !== null) {
        if (
          field.type === 'email' &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))
        ) {
          stepErrors[field.name] = 'Invalid email address'
          continue
        }
        if (field.type === 'number' && isNaN(Number(val))) {
          stepErrors[field.name] = 'Invalid number'
          continue
        }
      }
      if (field.validate) {
        const err = await field.validate(val, values)
        if (err) stepErrors[field.name] = err
      }
    }

    setErrors((prev) => {
      const next = { ...prev }
      for (const f of activeFields) delete next[f.name]
      return { ...next, ...stepErrors }
    })

    if (Object.keys(stepErrors).length > 0) {
      const firstInvalid = activeFields.find((f) => stepErrors[f.name])
      if (firstInvalid) {
        document.getElementById(`field-${firstInvalid.id}`)?.focus()
      }
      return false
    }
    return true
  }

  const handleNext = async () => {
    if (!currentStep) return
    setIsValidating(true)
    const isValid = await validateStep(currentStep)
    setIsValidating(false)

    if (isValid) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep.id))
      if (!isLastStep) {
        updateStep(visibleSteps[currentStepIdx + 1].id)
      }
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      updateStep(visibleSteps[currentStepIdx - 1].id)
    }
  }

  const handleSubmit = async () => {
    if (!currentStep) return
    setSubmitError('')
    setIsValidating(true)
    const isValid = await validateStep(currentStep)
    setIsValidating(false)

    if (isValid) {
      setIsSubmitting(true)
      try {
        await onSubmit?.(values)
        setSubmitSuccess(true)
        if (storageKey) localStorage.removeItem(storageKey)
      } catch (err: unknown) {
        setSubmitError(
          (err as Error).message ||
            'Unable to submit the form. Please try again.',
        )
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleReset = () => {
    if (
      Object.keys(values).length > 0 &&
      !window.confirm('Are you sure you want to start over?')
    ) {
      return
    }
    setValues(initialValues)
    setHistory([])
    setFuture([])
    setErrors({})
    setCompletedSteps(new Set())
    setSubmitSuccess(false)
    setSubmitError('')
    updateStep(visibleSteps[0]?.id || '')
    if (storageKey) localStorage.removeItem(storageKey)
  }

  // ─── Render Resume Prompt ─────────────────────────────────────────────────
  if (resumePrompt) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-100">
          Continue your saved form?
        </h2>
        <p className="text-sm text-zinc-400">
          You have unsaved progress from a previous session.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => {
              if (savedData) {
                setValues(savedData.values)
                setCompletedSteps(new Set(savedData.completed))
                setUncontrolledStep(savedData.stepId)
                onStepChange?.(savedData.stepId)
              }
              setResumePrompt(false)
            }}
            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Resume
          </button>
          <button
            onClick={() => {
              if (storageKey) localStorage.removeItem(storageKey)
              setResumePrompt(false)
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-5 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  // ─── Render Success ───────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-400">
          ✓
        </div>
        <p className="text-lg font-semibold text-emerald-400">
          Form submitted successfully
        </p>
        <button
          onClick={() => {
            setValues(initialValues)
            setHistory([])
            setFuture([])
            setCompletedSteps(new Set())
            setSubmitSuccess(false)
            updateStep(visibleSteps[0]?.id || '')
          }}
          className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
        >
          Start New Form
        </button>
      </div>
    )
  }

  if (!currentStep) return null

  // ─── Render Form ──────────────────────────────────────────────────────────
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl">
      {/* Undo/Redo & Reset Controls */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-50"
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={future.length === 0}
            className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-50"
          >
            Redo
          </button>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-zinc-500 transition-colors hover:text-red-400"
        >
          Start Over
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 text-sm md:gap-4">
        {visibleSteps.map((step, idx) => {
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = step.id === currentStep.id
          const isClickable = allowStepNavigation && (isCompleted || isCurrent)

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && updateStep(step.id)}
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'font-semibold text-violet-400'
                    : isCompleted
                      ? 'cursor-pointer text-emerald-500 hover:text-emerald-400'
                      : 'cursor-not-allowed text-zinc-600'
                }`}
              >
                <span className="text-xs">
                  {isCompleted && !isCurrent ? '✓' : isCurrent ? '●' : '○'}
                </span>
                {step.title}
              </button>
              {idx < visibleSteps.length - 1 && (
                <span className="text-zinc-700">→</span>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Error Banner */}
      {submitError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {submitError}
        </div>
      )}

      {/* Step Content */}
      <div className="flex flex-col gap-5 py-2">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">
            {currentStep.title}
          </h2>
          {currentStep.description && (
            <p className="mt-1 text-sm text-zinc-400">
              {currentStep.description}
            </p>
          )}
        </div>

        {currentStep.isReview ? (
          <ReviewStep
            visibleSteps={visibleSteps}
            values={values}
            onEdit={updateStep}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {(currentStep.fields || [])
              .filter((f) => !f.condition || f.condition(values))
              .map((field) => (
                <FormFieldRenderer
                  key={field.id}
                  field={field}
                  value={values[field.name]}
                  error={errors[field.name]}
                  onChange={handleValueChange}
                />
              ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-2 flex justify-between border-t border-zinc-800 pt-5">
        <button
          type="button"
          onClick={handleBack}
          disabled={isFirstStep || isValidating || isSubmitting}
          className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
            isFirstStep
              ? 'pointer-events-none opacity-0'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50'
          }`}
        >
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isValidating || isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={isValidating}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {isValidating ? 'Checking...' : 'Next'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Form Field Renderer ────────────────────────────────────────────────────

const FormFieldRenderer = memo(function FormFieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: Field
  value: unknown
  error?: string
  onChange: (name: string, value: unknown) => void
}) {
  const id = `field-${field.id}`
  const errorId = `error-${field.id}`
  const strVal = String(value ?? '')

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    error
      ? 'border-red-500/50 bg-red-500/5 text-red-200 focus:border-red-400 focus:ring-1 focus:ring-red-400/20'
      : 'border-zinc-700/60 bg-zinc-800/60 text-zinc-200 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20'
  }`

  return (
    <div className="flex flex-col gap-1.5">
      {field.type !== 'checkbox' && (
        <label htmlFor={id} className="text-sm font-medium text-zinc-300">
          {field.label}{' '}
          {field.required && <span className="text-red-400">*</span>}
        </label>
      )}

      {(field.type === 'text' ||
        field.type === 'email' ||
        field.type === 'number' ||
        field.type === 'date') && (
        <input
          id={id}
          type={field.type}
          value={strVal}
          onChange={(e) => onChange(field.name, e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={inputClass}
        />
      )}

      {field.type === 'select' && (
        <select
          id={id}
          value={strVal}
          onChange={(e) => onChange(field.name, e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={inputClass}
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.type === 'checkbox' && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            id={id}
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(field.name, e.target.checked)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 accent-violet-500"
          />
          {field.label}{' '}
          {field.required && <span className="text-red-400">*</span>}
        </label>
      )}

      {error && (
        <p id={errorId} className="mt-0.5 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})

// ─── Review Step Renderer ───────────────────────────────────────────────────

function ReviewStep({
  visibleSteps,
  values,
  onEdit,
}: {
  visibleSteps: Step[]
  values: FormValues
  onEdit: (stepId: string) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {visibleSteps
        .filter((s) => !s.isReview)
        .map((step) => {
          const activeFields = (step.fields || []).filter(
            (f) => !f.condition || f.condition(values),
          )
          if (activeFields.length === 0) return null

          return (
            <div
              key={step.id}
              className="relative rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
            >
              <button
                type="button"
                onClick={() => onEdit(step.id)}
                className="absolute top-4 right-4 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
              >
                Edit
              </button>

              <h3 className="mb-3 text-sm font-semibold text-zinc-200">
                {step.title}
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                {activeFields.map((field) => (
                  <div key={field.id} className="flex flex-col gap-1">
                    <dt className="text-xs text-zinc-500">{field.label}</dt>
                    <dd className="text-sm text-zinc-300">
                      {field.type === 'checkbox'
                        ? values[field.name]
                          ? 'Yes'
                          : 'No'
                        : String(values[field.name] || '-')}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })}
    </div>
  )
}

// ─── Demo / Play Area ───────────────────────────────────────────────────────

const sampleSteps: Step[] = [
  {
    id: 'personal',
    title: 'Personal Info',
    fields: [
      { id: 'f1', name: 'name', type: 'text', label: 'Name', required: true },
      {
        id: 'f2',
        name: 'email',
        type: 'email',
        label: 'Email',
        required: true,
      },
      {
        id: 'f3',
        name: 'username',
        type: 'text',
        label: 'Username (async validation)',
        required: true,
        validate: async (val) => {
          if (!val) return
          await new Promise((r) => setTimeout(r, 600))
          if (String(val).toLowerCase() === 'admin') return 'Username taken'
        },
      },
    ],
  },
  {
    id: 'business-check',
    title: 'Employment',
    fields: [
      {
        id: 'f4',
        name: 'isEmployed',
        type: 'select',
        label: 'Are you employed?',
        required: true,
        options: ['Yes', 'No'],
      },
      {
        id: 'f5',
        name: 'companyName',
        type: 'text',
        label: 'Company Name',
        required: true,
        condition: (v) => v.isEmployed === 'Yes',
      },
    ],
  },
  {
    id: 'business-details',
    title: 'Company Details',
    condition: (v) => v.isEmployed === 'Yes',
    fields: [
      {
        id: 'f6',
        name: 'role',
        type: 'text',
        label: 'Your Role',
        required: true,
      },
    ],
  },
  {
    id: 'preferences',
    title: 'Preferences',
    fields: [
      {
        id: 'f7',
        name: 'newsletter',
        type: 'checkbox',
        label: 'Subscribe to newsletter',
      },
    ],
  },
  {
    id: 'review',
    title: 'Review',
    isReview: true,
  },
]

export function MultiStepFormPlayArea() {
  return (
    <div className="flex w-full flex-col items-center gap-6 pb-10">
      <h1 className="text-xl font-bold tracking-wide text-zinc-100">
        Multi-Step Form
      </h1>
      <MultiStepForm
        steps={sampleSteps}
        onSubmit={async (values) => {
          await new Promise((r) => setTimeout(r, 1000))
          console.log('Submitted:', values)
        }}
        persistStepInUrl={false}
      />
    </div>
  )
}
