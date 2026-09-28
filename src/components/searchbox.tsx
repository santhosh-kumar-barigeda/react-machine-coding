import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface SearchBoxOption {
  disabled?: boolean
}

interface SearchBoxProps<T extends SearchBoxOption> {
  search: (query: string) => Promise<T[]>
  getOptionLabel: (item: T) => string
  getOptionKey: (item: T) => string | number
  onSelect?: (item: T) => void
  placeholder?: string
  debounceMs?: number
  minQueryLength?: number
  value?: string
  onChange?: (value: string) => void
}

// ─── SearchBox Component ────────────────────────────────────────────────────

export function SearchBox<T extends SearchBoxOption>({
  search,
  getOptionLabel,
  getOptionKey,
  onSelect,
  placeholder = 'Search...',
  debounceMs = 300,
  minQueryLength = 1,
  value: controlledValue,
  onChange: controlledOnChange,
}: SearchBoxProps<T>) {
  const isControlled = controlledValue !== undefined

  const [internalValue, setInternalValue] = useState('')
  const query = isControlled ? controlledValue : internalValue

  const [results, setResults] = useState<T[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)
  const lastSearchedQueryRef = useRef('')

  const instanceId = useId()
  const listboxId = `searchbox-listbox-${instanceId}`

  // ── Update input value ────────────────────────────────────────────────

  const updateValue = useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue)
      }

      controlledOnChange?.(nextValue)
    },
    [isControlled, controlledOnChange],
  )

  // ── Perform search ────────────────────────────────────────────────────

  const performSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim()

      if (trimmed.length < minQueryLength) {
        setResults([])
        setIsOpen(false)
        setError(null)
        return
      }

      const currentRequestId = ++requestIdRef.current

      setIsLoading(true)
      setError(null)

      try {
        const items = await search(trimmed)

        // Ignore stale responses
        if (currentRequestId !== requestIdRef.current) {
          return
        }

        lastSearchedQueryRef.current = trimmed
        setResults(items)
        setIsOpen(true)
        setHighlightedIndex(-1)
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) {
          return
        }

        setError(err instanceof Error ? err : new Error('Something went wrong'))
        setResults([])
        setIsOpen(true)
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false)
        }
      }
    },
    [search, minQueryLength],
  )

  // ── Retry last search ─────────────────────────────────────────────────

  const retry = useCallback(() => {
    performSearch(query)
  }, [performSearch, query])

  // ── Debounced input handler ───────────────────────────────────────────

  const handleInputChange = useCallback(
    (nextValue: string) => {
      updateValue(nextValue)

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      const trimmed = nextValue.trim()

      if (trimmed.length < minQueryLength) {
        setResults([])
        setIsOpen(false)
        setError(null)
        requestIdRef.current++
        return
      }

      debounceTimerRef.current = setTimeout(() => {
        performSearch(nextValue)
      }, debounceMs)
    },
    [updateValue, performSearch, debounceMs, minQueryLength],
  )

  // ── Selection ─────────────────────────────────────────────────────────

  const selectItem = useCallback(
    (item: T) => {
      if (item.disabled) return

      updateValue(getOptionLabel(item))
      setIsOpen(false)
      setResults([])
      setHighlightedIndex(-1)
      onSelect?.(item)
    },
    [updateValue, getOptionLabel, onSelect],
  )

  // ── Clear ─────────────────────────────────────────────────────────────

  const clearInput = useCallback(() => {
    updateValue('')
    setResults([])
    setIsOpen(false)
    setError(null)
    setHighlightedIndex(-1)
    requestIdRef.current++
    inputRef.current?.focus()
  }, [updateValue])

  // ── Enabled indices for keyboard nav ──────────────────────────────────

  const getEnabledIndices = useCallback(() => {
    return results
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.disabled)
      .map(({ index }) => index)
  }, [results])

  // ── Keyboard navigation ───────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen && event.key !== 'ArrowDown') return

      const enabledIndices = getEnabledIndices()

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault()

          if (!isOpen && results.length > 0) {
            setIsOpen(true)
            return
          }

          if (enabledIndices.length === 0) return

          const currentPos = enabledIndices.indexOf(highlightedIndex)
          const nextPos =
            currentPos === -1 || currentPos === enabledIndices.length - 1
              ? 0
              : currentPos + 1

          setHighlightedIndex(enabledIndices[nextPos])
          break
        }

        case 'ArrowUp': {
          event.preventDefault()

          if (enabledIndices.length === 0) return

          const currentPos = enabledIndices.indexOf(highlightedIndex)
          const nextPos =
            currentPos <= 0 ? enabledIndices.length - 1 : currentPos - 1

          setHighlightedIndex(enabledIndices[nextPos])
          break
        }

        case 'Enter': {
          event.preventDefault()

          if (
            highlightedIndex >= 0 &&
            highlightedIndex < results.length &&
            !results[highlightedIndex].disabled
          ) {
            selectItem(results[highlightedIndex])
          }
          break
        }

        case 'Escape': {
          event.preventDefault()
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
        }
      }
    },
    [isOpen, results, highlightedIndex, getEnabledIndices, selectItem],
  )

  // ── Click outside ─────────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // ── Cleanup debounce on unmount ───────────────────────────────────────

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // ── Scroll highlighted item into view ─────────────────────────────────

  useEffect(() => {
    if (highlightedIndex < 0) return

    const option = document.getElementById(
      `${listboxId}-option-${highlightedIndex}`,
    )

    option?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, listboxId])

  // ── Active descendant ─────────────────────────────────────────────────

  const activeDescendant =
    highlightedIndex >= 0
      ? `${listboxId}-option-${highlightedIndex}`
      : undefined

  const showDropdown = isOpen || isLoading

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input area */}
      <div className="relative flex items-center">
        {/* Search icon */}
        <svg
          className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 && query.trim().length >= minQueryLength) {
              setIsOpen(true)
            }
          }}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 py-3 pr-10 pl-10 text-sm text-zinc-100 transition-all duration-200 outline-none placeholder:text-zinc-500 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
        />

        {/* Loading spinner or clear button */}
        {isLoading ? (
          <div className="absolute right-3.5">
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
          </div>
        ) : query.length > 0 ? (
          <button
            type="button"
            onClick={clearInput}
            aria-label="Clear search"
            className="absolute right-3 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-zinc-700 text-xs text-zinc-400 transition-colors hover:bg-zinc-600 hover:text-zinc-200"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-zinc-700/60 bg-zinc-900/95 py-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          {/* Loading state */}
          {isLoading && results.length === 0 && (
            <li className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-zinc-500">
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
              Searching...
            </li>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <li className="flex flex-col items-center gap-3 px-4 py-6">
              <span className="text-sm text-red-400">Something went wrong</span>

              <button
                type="button"
                onClick={retry}
                className="cursor-pointer rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-400 transition-all duration-200 hover:border-red-500/60 hover:bg-red-500/20"
              >
                Retry
              </button>
            </li>
          )}

          {/* Empty state */}
          {!isLoading && !error && results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-zinc-500">
              No results found
            </li>
          )}

          {/* Results */}
          {!error &&
            results.map((item, index) => {
              const label = getOptionLabel(item)
              const key = getOptionKey(item)
              const isHighlighted = index === highlightedIndex
              const isDisabled = !!item.disabled

              return (
                <li
                  key={key}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isHighlighted}
                  aria-disabled={isDisabled}
                  onMouseEnter={() => {
                    if (!isDisabled) {
                      setHighlightedIndex(index)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault() // prevent input blur

                    if (!isDisabled) {
                      selectItem(item)
                    }
                  }}
                  className={`mx-1.5 cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-colors duration-100 ${
                    isDisabled
                      ? 'cursor-not-allowed opacity-40'
                      : isHighlighted
                        ? 'bg-violet-600/20 text-violet-200'
                        : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <HighlightedText text={label} query={query} />
                </li>
              )
            })}
        </ul>
      )}
    </div>
  )
}

// ─── Highlighted Text ───────────────────────────────────────────────────────

function HighlightedText({ text, query }: { text: string; query: string }) {
  const trimmedQuery = query.trim()

  if (trimmedQuery.length === 0) {
    return <span>{text}</span>
  }

  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="font-semibold text-violet-300">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  )
}

// ─── Demo / Play Area ───────────────────────────────────────────────────────

interface FakeUser {
  id: number
  name: string
  email: string
  disabled?: boolean
}

const FAKE_USERS: FakeUser[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', disabled: true },
  { id: 5, name: 'Eve Adams', email: 'eve@example.com' },
  { id: 6, name: 'Frank Miller', email: 'frank@example.com' },
  { id: 7, name: 'Grace Lee', email: 'grace@example.com' },
  { id: 8, name: 'Hank Pym', email: 'hank@example.com' },
  { id: 9, name: 'Irene Adler', email: 'irene@example.com' },
  { id: 10, name: 'Jack Reacher', email: 'jack@example.com' },
  { id: 11, name: 'Karen Page', email: 'karen@example.com', disabled: true },
  { id: 12, name: 'Leo Messi', email: 'leo@example.com' },
  { id: 13, name: 'Mia Wallace', email: 'mia@example.com' },
  { id: 14, name: 'Nathan Drake', email: 'nathan@example.com' },
  { id: 15, name: 'Olivia Pope', email: 'olivia@example.com' },
]

const searchUsers = async (query: string): Promise<FakeUser[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const lower = query.toLowerCase()

  return FAKE_USERS.filter(
    (user) =>
      user.name.toLowerCase().includes(lower) ||
      user.email.toLowerCase().includes(lower),
  )
}

export function SearchBoxPlayArea() {
  const [selected, setSelected] = useState<FakeUser | null>(null)

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <h1 className="text-xl font-bold tracking-wide text-zinc-100">
        Search Box
      </h1>

      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-violet-500/5 backdrop-blur-sm">
        <SearchBox<FakeUser>
          search={searchUsers}
          debounceMs={300}
          minQueryLength={1}
          placeholder="Search users..."
          getOptionLabel={(user) => user.name}
          getOptionKey={(user) => user.id}
          onSelect={(user) => setSelected(user)}
        />

        {selected && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600/20 text-sm font-bold text-violet-300">
              {selected.name.charAt(0)}
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-zinc-200">
                {selected.name}
              </span>
              <span className="text-xs text-zinc-500">{selected.email}</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-600">
        Try: &quot;alice&quot;, &quot;frank&quot;, &quot;leo&quot; — Diana &amp;
        Karen are disabled
      </p>
    </div>
  )
}
