import { memo, useCallback, useMemo, useReducer, useRef, useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'

interface Condition {
  fieldId: string
  operator: 'equals' | 'notEquals'
  value: string
}

interface FormField {
  id: string
  type: FieldType
  label: string
  name: string
  placeholder?: string
  required?: boolean
  options?: string[]
  defaultValue?: string | number | boolean
  condition?: Condition
}

type Mode = 'builder' | 'preview'

interface FormState {
  fields: FormField[]
  selectedFieldId: string | null
  mode: Mode
  history: FormField[][]
  future: FormField[][]
}

// ─── Actions ────────────────────────────────────────────────────────────────

type FormAction =
  | { type: 'ADD_FIELD'; field: FormField }
  | { type: 'UPDATE_FIELD'; id: string; updates: Partial<FormField> }
  | { type: 'DELETE_FIELD'; id: string }
  | { type: 'DUPLICATE_FIELD'; id: string }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'SELECT_FIELD'; id: string | null }
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'LOAD_FIELDS'; fields: FormField[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }

// ─── Helpers ────────────────────────────────────────────────────────────────

let fieldCounter = 0

function generateId(): string {
  return `field-${++fieldCounter}-${Date.now()}`
}

function generateUniqueName(baseName: string, fields: FormField[]): string {
  const names = new Set(fields.map((f) => f.name))
  let candidate = baseName
  let i = 1

  while (names.has(candidate)) {
    candidate = `${baseName}${i++}`
  }

  return candidate
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text Field',
  textarea: 'Textarea',
  number: 'Number',
  email: 'Email',
  select: 'Select',
  radio: 'Radio',
  checkbox: 'Checkbox',
  date: 'Date',
}

const FIELD_TYPE_NAMES: Record<FieldType, string> = {
  text: 'textField',
  textarea: 'textareaField',
  number: 'numberField',
  email: 'emailField',
  select: 'selectField',
  radio: 'radioField',
  checkbox: 'checkboxField',
  date: 'dateField',
}

const STORAGE_KEY = 'form-builder-config'

function pushHistory(state: FormState): FormState {
  return {
    ...state,
    history: [...state.history, state.fields],
    future: [],
  }
}

// ─── Reducer ────────────────────────────────────────────────────────────────

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'ADD_FIELD': {
      const updated = pushHistory(state)

      return {
        ...updated,
        fields: [...updated.fields, action.field],
        selectedFieldId: action.field.id,
      }
    }

    case 'UPDATE_FIELD': {
      const updated = pushHistory(state)

      return {
        ...updated,
        fields: updated.fields.map((f) =>
          f.id === action.id ? { ...f, ...action.updates } : f,
        ),
      }
    }

    case 'DELETE_FIELD': {
      const updated = pushHistory(state)

      return {
        ...updated,
        fields: updated.fields.filter((f) => f.id !== action.id),
        selectedFieldId:
          updated.selectedFieldId === action.id
            ? null
            : updated.selectedFieldId,
      }
    }

    case 'DUPLICATE_FIELD': {
      const idx = state.fields.findIndex((f) => f.id === action.id)

      if (idx === -1) return state

      const original = state.fields[idx]
      const duplicate: FormField = {
        ...original,
        id: generateId(),
        name: generateUniqueName(original.name, state.fields),
      }

      const updated = pushHistory(state)
      const newFields = [...updated.fields]
      newFields.splice(idx + 1, 0, duplicate)

      return {
        ...updated,
        fields: newFields,
        selectedFieldId: duplicate.id,
      }
    }

    case 'REORDER': {
      const updated = pushHistory(state)
      const newFields = [...updated.fields]
      const [moved] = newFields.splice(action.fromIndex, 1)
      newFields.splice(action.toIndex, 0, moved)

      return { ...updated, fields: newFields }
    }

    case 'SELECT_FIELD':
      return { ...state, selectedFieldId: action.id }

    case 'SET_MODE':
      return { ...state, mode: action.mode, selectedFieldId: null }

    case 'LOAD_FIELDS':
      return {
        ...state,
        fields: action.fields,
        selectedFieldId: null,
        history: [],
        future: [],
      }

    case 'UNDO': {
      if (state.history.length === 0) return state

      const previous = state.history[state.history.length - 1]

      return {
        ...state,
        fields: previous,
        history: state.history.slice(0, -1),
        future: [state.fields, ...state.future],
        selectedFieldId: null,
      }
    }

    case 'REDO': {
      if (state.future.length === 0) return state

      const next = state.future[0]

      return {
        ...state,
        fields: next,
        history: [...state.history, state.fields],
        future: state.future.slice(1),
        selectedFieldId: null,
      }
    }

    default:
      return state
  }
}

// ─── FormBuilder Component ──────────────────────────────────────────────────

interface FormBuilderProps {
  initialFields?: FormField[]
  onChange?: (fields: FormField[]) => void
  onSubmit?: (values: Record<string, unknown>) => void
}

export function FormBuilder({
  initialFields = [],
  onChange,
  onSubmit,
}: FormBuilderProps) {
  const [state, dispatch] = useReducer(formReducer, {
    fields: initialFields,
    selectedFieldId: null,
    mode: 'builder',
    history: [],
    future: [],
  })

  const selectedField = useMemo(
    () => state.fields.find((f) => f.id === state.selectedFieldId) ?? null,
    [state.fields, state.selectedFieldId],
  )

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Add field ─────────────────────────────────────────────────────────

  const addField = useCallback(
    (type: FieldType) => {
      const field: FormField = {
        id: generateId(),
        type,
        label: FIELD_TYPE_LABELS[type],
        name: generateUniqueName(FIELD_TYPE_NAMES[type], state.fields),
        ...(type === 'select' || type === 'radio'
          ? { options: ['Option 1', 'Option 2'] }
          : {}),
        ...(type === 'checkbox' ? { defaultValue: false } : {}),
      }

      dispatch({ type: 'ADD_FIELD', field })
      onChange?.(state.fields)
    },
    [state.fields, onChange],
  )

  // ── Persistence ───────────────────────────────────────────────────────

  const saveForm = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.fields))
  }

  const loadForm = () => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      try {
        const fields = JSON.parse(saved) as FormField[]
        dispatch({ type: 'LOAD_FIELDS', fields })
      } catch {
        // invalid JSON
      }
    }
  }

  // ── Import / Export ───────────────────────────────────────────────────

  const exportJSON = () => {
    const json = JSON.stringify(state.fields, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'form-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (
          Array.isArray(data) &&
          data.every((f: unknown) => {
            const field = f as Record<string, unknown>

            return field.id && field.type && field.label && field.name
          })
        ) {
          dispatch({ type: 'LOAD_FIELDS', fields: data as FormField[] })
        }
      } catch {
        // invalid JSON
      }
    }

    reader.readAsText(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Mode toggle */}
        <div className="flex overflow-hidden rounded-lg border border-zinc-700/60">
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_MODE', mode: 'builder' })}
            className={`cursor-pointer px-4 py-1.5 text-sm font-medium transition-colors ${
              state.mode === 'builder'
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Builder
          </button>

          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_MODE', mode: 'preview' })}
            className={`cursor-pointer px-4 py-1.5 text-sm font-medium transition-colors ${
              state.mode === 'preview'
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Preview
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5">
          {state.mode === 'builder' && (
            <>
              <SmallButton
                onClick={() => dispatch({ type: 'UNDO' })}
                disabled={state.history.length === 0}
              >
                Undo
              </SmallButton>

              <SmallButton
                onClick={() => dispatch({ type: 'REDO' })}
                disabled={state.future.length === 0}
              >
                Redo
              </SmallButton>

              <div className="mx-1 border-l border-zinc-700/40" />
            </>
          )}

          <SmallButton onClick={saveForm}>Save</SmallButton>
          <SmallButton onClick={loadForm}>Load</SmallButton>
          <SmallButton onClick={exportJSON}>Export</SmallButton>

          <SmallButton onClick={() => fileInputRef.current?.click()}>
            Import
          </SmallButton>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Content */}
      {state.mode === 'builder' ? (
        <div className="grid grid-cols-[140px_1fr_200px] gap-3">
          {/* Left: Field types */}
          <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <p className="mb-1 text-[10px] font-semibold tracking-widest text-zinc-600 uppercase">
              Fields
            </p>

            {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addField(type)}
                className="cursor-pointer rounded-lg bg-zinc-800/60 px-3 py-2 text-left text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700/80 hover:text-white"
              >
                {FIELD_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {/* Center: Canvas */}
          <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            {state.fields.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-zinc-600">
                Click a field type to add it
              </div>
            ) : (
              state.fields.map((field, index) => (
                <CanvasField
                  key={field.id}
                  field={field}
                  index={index}
                  isSelected={field.id === state.selectedFieldId}
                  onSelect={() =>
                    dispatch({ type: 'SELECT_FIELD', id: field.id })
                  }
                  onDelete={() =>
                    dispatch({ type: 'DELETE_FIELD', id: field.id })
                  }
                  onDuplicate={() =>
                    dispatch({ type: 'DUPLICATE_FIELD', id: field.id })
                  }
                  onReorder={(from, to) =>
                    dispatch({ type: 'REORDER', fromIndex: from, toIndex: to })
                  }
                />
              ))
            )}
          </div>

          {/* Right: Settings */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            {selectedField ? (
              <FieldSettings
                field={selectedField}
                allFields={state.fields}
                onUpdate={(updates) =>
                  dispatch({
                    type: 'UPDATE_FIELD',
                    id: selectedField.id,
                    updates,
                  })
                }
              />
            ) : (
              <div className="flex h-40 items-center justify-center text-xs text-zinc-600">
                Select a field to edit
              </div>
            )}
          </div>
        </div>
      ) : (
        <FormPreview fields={state.fields} onSubmit={onSubmit} />
      )}
    </div>
  )
}

// ─── Canvas Field ───────────────────────────────────────────────────────────

const CanvasField = memo(function CanvasField({
  field,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onReorder,
}: {
  field: FormField
  index: number
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onReorder: (from: number, to: number) => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)

    if (!isNaN(fromIndex) && fromIndex !== index) {
      onReorder(fromIndex, index)
    }
  }

  return (
    <div
      draggable
      onClick={onSelect}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`group cursor-pointer rounded-lg border p-3 transition-all ${
        isSelected
          ? 'border-violet-500/50 bg-violet-500/5 ring-1 ring-violet-500/20'
          : isDragOver
            ? 'border-violet-400/40 bg-violet-500/5'
            : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-300">
            {field.label}
            {field.required && <span className="ml-0.5 text-red-400">*</span>}
          </label>

          <FieldPreviewWidget field={field} disabled />
        </div>

        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
            aria-label="Duplicate field"
            className="cursor-pointer rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
          >
            ⧉
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            aria-label="Delete field"
            className="cursor-pointer rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
})

// ─── Field Preview Widget (disabled) ────────────────────────────────────────

function FieldPreviewWidget({
  field,
  disabled,
}: {
  field: FormField
  disabled?: boolean
}) {
  const baseClass =
    'w-full rounded-md border border-zinc-700/50 bg-zinc-800/40 px-2.5 py-1.5 text-xs text-zinc-400'

  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
    case 'date':
      return (
        <input
          type={field.type}
          placeholder={field.placeholder || field.label}
          disabled={disabled}
          className={baseClass}
          readOnly
        />
      )

    case 'textarea':
      return (
        <textarea
          placeholder={field.placeholder || field.label}
          disabled={disabled}
          rows={2}
          className={`${baseClass} resize-none`}
          readOnly
        />
      )

    case 'select':
      return (
        <select disabled={disabled} className={baseClass}>
          <option>{field.placeholder || 'Select...'}</option>
          {field.options?.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      )

    case 'radio':
      return (
        <div className="flex flex-col gap-1">
          {field.options?.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-1.5 text-xs text-zinc-400"
            >
              <input type="radio" name={field.name} disabled={disabled} />
              {opt}
            </label>
          ))}
        </div>
      )

    case 'checkbox':
      return (
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" disabled={disabled} />
          {field.label}
        </label>
      )

    default:
      return null
  }
}

// ─── Field Settings Panel ───────────────────────────────────────────────────

function FieldSettings({
  field,
  allFields,
  onUpdate,
}: {
  field: FormField
  allFields: FormField[]
  onUpdate: (updates: Partial<FormField>) => void
}) {
  const hasOptions = field.type === 'select' || field.type === 'radio'
  const otherFields = allFields.filter((f) => f.id !== field.id)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold tracking-widest text-zinc-600 uppercase">
        Settings
      </p>

      {/* Label */}
      <SettingsInput
        label="Label"
        value={field.label}
        onChange={(v) => onUpdate({ label: v })}
      />

      {/* Name */}
      <SettingsInput
        label="Name"
        value={field.name}
        onChange={(v) => onUpdate({ name: v })}
      />

      {/* Placeholder */}
      {field.type !== 'checkbox' && field.type !== 'radio' && (
        <SettingsInput
          label="Placeholder"
          value={field.placeholder ?? ''}
          onChange={(v) => onUpdate({ placeholder: v })}
        />
      )}

      {/* Required */}
      <label className="flex items-center gap-2 text-xs text-zinc-300">
        <input
          type="checkbox"
          checked={field.required ?? false}
          onChange={(e) => onUpdate({ required: e.target.checked })}
          className="accent-violet-500"
        />
        Required
      </label>

      {/* Options */}
      {hasOptions && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-600 uppercase">
            Options
          </p>

          {(field.options ?? []).map((opt, i) => (
            <div key={i} className="flex gap-1">
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOpts = [...(field.options ?? [])]
                  newOpts[i] = e.target.value
                  onUpdate({ options: newOpts })
                }}
                className="min-w-0 flex-1 rounded border border-zinc-700/50 bg-zinc-800/60 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-violet-500/50"
              />

              <button
                type="button"
                onClick={() => {
                  const newOpts = (field.options ?? []).filter(
                    (_, j) => j !== i,
                  )
                  onUpdate({ options: newOpts })
                }}
                className="cursor-pointer text-xs text-zinc-600 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              onUpdate({
                options: [
                  ...(field.options ?? []),
                  `Option ${(field.options?.length ?? 0) + 1}`,
                ],
              })
            }
            className="cursor-pointer self-start rounded border border-zinc-700/50 px-2 py-1 text-[10px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          >
            + Add Option
          </button>
        </div>
      )}

      {/* Condition */}
      <div className="flex flex-col gap-1.5 border-t border-zinc-800 pt-3">
        <p className="text-[10px] font-semibold tracking-widest text-zinc-600 uppercase">
          Visibility
        </p>

        {otherFields.length > 0 ? (
          <>
            <select
              value={field.condition?.fieldId ?? ''}
              onChange={(e) => {
                if (!e.target.value) {
                  onUpdate({ condition: undefined })
                } else {
                  onUpdate({
                    condition: {
                      fieldId: e.target.value,
                      operator: field.condition?.operator ?? 'equals',
                      value: field.condition?.value ?? '',
                    },
                  })
                }
              }}
              className="rounded border border-zinc-700/50 bg-zinc-800/60 px-2 py-1 text-xs text-zinc-300 outline-none"
            >
              <option value="">Always visible</option>
              {otherFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            {field.condition && (
              <>
                <select
                  value={field.condition.operator}
                  onChange={(e) =>
                    onUpdate({
                      condition: {
                        ...field.condition!,
                        operator: e.target.value as 'equals' | 'notEquals',
                      },
                    })
                  }
                  className="rounded border border-zinc-700/50 bg-zinc-800/60 px-2 py-1 text-xs text-zinc-300 outline-none"
                >
                  <option value="equals">equals</option>
                  <option value="notEquals">not equals</option>
                </select>

                <input
                  type="text"
                  value={field.condition.value}
                  onChange={(e) =>
                    onUpdate({
                      condition: {
                        ...field.condition!,
                        value: e.target.value,
                      },
                    })
                  }
                  placeholder="Value"
                  className="rounded border border-zinc-700/50 bg-zinc-800/60 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-violet-500/50"
                />
              </>
            )}
          </>
        ) : (
          <p className="text-[10px] text-zinc-600">
            Add more fields to set conditions
          </p>
        )}
      </div>
    </div>
  )
}

function SettingsInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] text-zinc-500">{label}</label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-zinc-700/50 bg-zinc-800/60 px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-violet-500/50"
      />
    </div>
  )
}

// ─── Form Preview ───────────────────────────────────────────────────────────

function FormPreview({
  fields,
  onSubmit,
}: {
  fields: FormField[]
  onSubmit?: (values: Record<string, unknown>) => void
}) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const setValue = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]

        return next
      })
    }
  }

  const isFieldVisible = useCallback(
    (field: FormField): boolean => {
      if (!field.condition) return true

      const depField = fields.find((f) => f.id === field.condition!.fieldId)

      if (!depField) return true

      const depValue = String(values[depField.name] ?? '')

      if (field.condition.operator === 'equals') {
        return depValue === field.condition.value
      }

      return depValue !== field.condition.value
    },
    [fields, values],
  )

  const visibleFields = useMemo(
    () => fields.filter(isFieldVisible),
    [fields, isFieldVisible],
  )

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    for (const field of visibleFields) {
      const val = values[field.name]

      if (field.required) {
        if (val === undefined || val === '' || val === null || val === false) {
          newErrors[field.name] = `${field.label} is required`
          continue
        }
      }

      if (field.type === 'email' && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (!emailRegex.test(String(val))) {
          newErrors[field.name] = 'Please enter a valid email address'
        }
      }

      if (field.type === 'number' && val !== undefined && val !== '') {
        if (isNaN(Number(val))) {
          newErrors[field.name] = 'Please enter a valid number'
        }
      }
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validate()) {
      setSubmitted(true)
      onSubmit?.(values)
    }
  }

  if (fields.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-600">
        No fields to preview. Switch to Builder to add fields.
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl">
          ✓
        </div>

        <p className="text-sm font-medium text-emerald-400">
          Form submitted successfully!
        </p>

        <pre className="max-h-48 w-full overflow-auto rounded-lg bg-zinc-800/50 p-3 text-xs text-zinc-300">
          {JSON.stringify(values, null, 2)}
        </pre>

        <button
          type="button"
          onClick={() => {
            setSubmitted(false)
            setValues({})
          }}
          className="cursor-pointer rounded-lg bg-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-600"
        >
          Reset
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
    >
      {visibleFields.map((field) => (
        <PreviewField
          key={field.id}
          field={field}
          value={values[field.name]}
          error={errors[field.name]}
          onChange={(v) => setValue(field.name, v)}
        />
      ))}

      <button
        type="submit"
        className="mt-2 cursor-pointer self-start rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-colors hover:bg-violet-500"
      >
        Submit
      </button>
    </form>
  )
}

// ─── Preview Field ──────────────────────────────────────────────────────────

function PreviewField({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField
  value: unknown
  error?: string
  onChange: (value: unknown) => void
}) {
  const inputId = `preview-${field.id}`
  const errorId = `error-${field.id}`
  const stringVal = String(value ?? field.defaultValue ?? '')

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm text-zinc-200 outline-none transition-colors ${
    error
      ? 'border-red-500/50 bg-red-500/5 focus:border-red-400'
      : 'border-zinc-700/60 bg-zinc-800/60 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20'
  }`

  return (
    <div className="flex flex-col gap-1">
      {field.type !== 'checkbox' && (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-300">
          {field.label}
          {field.required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
      )}

      {(field.type === 'text' ||
        field.type === 'email' ||
        field.type === 'number' ||
        field.type === 'date') && (
        <input
          id={inputId}
          type={field.type}
          placeholder={field.placeholder}
          value={stringVal}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={inputClass}
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          id={inputId}
          placeholder={field.placeholder}
          value={stringVal}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`${inputClass} resize-none`}
        />
      )}

      {field.type === 'select' && (
        <select
          id={inputId}
          value={stringVal}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={inputClass}
        >
          <option value="">{field.placeholder || 'Select...'}</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.type === 'radio' && (
        <div
          className="flex flex-col gap-2"
          role="radiogroup"
          aria-labelledby={inputId}
        >
          {field.options?.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm text-zinc-300"
            >
              <input
                type="radio"
                name={field.name}
                value={opt}
                checked={stringVal === opt}
                onChange={() => onChange(opt)}
                className="accent-violet-500"
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && (
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            id={inputId}
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="accent-violet-500"
          />
          {field.label}
          {field.required && <span className="text-red-400">*</span>}
        </label>
      )}

      {error && (
        <p id={errorId} className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Small Button ───────────────────────────────────────────────────────────

function SmallButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded-md border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  )
}

// ─── Demo / Play Area ───────────────────────────────────────────────────────

const sampleFields: FormField[] = [
  {
    id: 'f1',
    type: 'text',
    label: 'Full Name',
    name: 'fullName',
    placeholder: 'Enter your name',
    required: true,
  },
  {
    id: 'f2',
    type: 'email',
    label: 'Email Address',
    name: 'email',
    placeholder: 'you@example.com',
    required: true,
  },
  {
    id: 'f3',
    type: 'select',
    label: 'Country',
    name: 'country',
    placeholder: 'Select a country',
    options: ['United States', 'India', 'Germany', 'Japan', 'Brazil'],
  },
  {
    id: 'f4',
    type: 'radio',
    label: 'Do you have a company?',
    name: 'hasCompany',
    options: ['Yes', 'No'],
  },
  {
    id: 'f5',
    type: 'text',
    label: 'Company Name',
    name: 'companyName',
    placeholder: 'Enter company name',
    condition: { fieldId: 'f4', operator: 'equals', value: 'Yes' },
  },
  {
    id: 'f6',
    type: 'checkbox',
    label: 'Subscribe to newsletter',
    name: 'subscribe',
    defaultValue: false,
  },
]

export function FormBuilderPlayArea() {
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      <h1 className="text-xl font-bold tracking-wide text-zinc-100">
        Form Builder
      </h1>

      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl shadow-violet-500/5 backdrop-blur-sm">
        <FormBuilder
          initialFields={sampleFields}
          onChange={(fields) => console.log('Fields changed:', fields)}
          onSubmit={(values) => console.log('Form submitted:', values)}
        />
      </div>

      <p className="text-center text-xs leading-relaxed text-zinc-600">
        Drag fields to reorder · Click to select and edit settings
        <br />
        Switch to Preview to test validation and submission
      </p>
    </div>
  )
}
