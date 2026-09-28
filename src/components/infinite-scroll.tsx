import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface LoadMoreResult<T> {
  items: T[]
  hasMore: boolean
}

interface InfiniteScrollProps<T> {
  loadMore: () => Promise<LoadMoreResult<T>>
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor?: (item: T, index: number) => string | number
  initialItems?: T[]
  threshold?: string
  height?: number
  onLoadStart?: () => void
  onLoadSuccess?: (items: T[]) => void
  onLoadError?: (error: Error) => void
  onEnd?: () => void
}

// ─── InfiniteScroll Component ───────────────────────────────────────────────

export function InfiniteScroll<T>({
  loadMore,
  renderItem,
  keyExtractor,
  initialItems,
  threshold = '0px',
  height,
  onLoadStart,
  onLoadSuccess,
  onLoadError,
  onEnd,
}: InfiniteScrollProps<T>) {
  const [items, setItems] = useState<T[]>(initialItems ?? [])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const isLoadingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const unmountedRef = useRef(false)

  // Keep refs in sync for use inside the observer callback
  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  // Cleanup flag on unmount
  useEffect(() => {
    unmountedRef.current = false

    return () => {
      unmountedRef.current = true
    }
  }, [])

  const fetchMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current) {
      return
    }

    isLoadingRef.current = true
    setIsLoading(true)
    setError(null)
    onLoadStart?.()

    try {
      const result = await loadMore()

      if (unmountedRef.current) {
        return
      }

      setItems((previous) => [...previous, ...result.items])
      setHasMore(result.hasMore)
      hasMoreRef.current = result.hasMore

      onLoadSuccess?.(result.items)

      if (!result.hasMore) {
        onEnd?.()
      }
    } catch (err) {
      if (unmountedRef.current) {
        return
      }

      const error =
        err instanceof Error ? err : new Error('Failed to load items')

      setError(error)
      onLoadError?.(error)
    } finally {
      if (!unmountedRef.current) {
        isLoadingRef.current = false
        setIsLoading(false)
      }
    }
  }, [loadMore, onLoadStart, onLoadSuccess, onLoadError, onEnd])

  // IntersectionObserver setup
  useEffect(() => {
    const sentinel = sentinelRef.current

    if (!sentinel) {
      return
    }

    const root = height != null ? scrollContainerRef.current : null

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]

        if (entry?.isIntersecting) {
          fetchMore()
        }
      },
      {
        root,
        rootMargin: `0px 0px ${threshold} 0px`,
        threshold: 0,
      },
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [fetchMore, threshold, height])

  return (
    <div
      ref={scrollContainerRef}
      className="scrollbar-thin"
      style={
        height != null
          ? { height: `${height}px`, overflowY: 'auto' }
          : undefined
      }
    >
      {items.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : index

        return <div key={key}>{renderItem(item, index)}</div>
      })}

      {/* Sentinel element observed by IntersectionObserver */}
      {hasMore && <div ref={sentinelRef} className="h-px" />}

      {/* Loading indicator */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-500"
        >
          <LoadingSpinner />
          Loading...
        </div>
      )}

      {/* Error state with retry */}
      {error && !isLoading && (
        <div role="alert" className="flex flex-col items-center gap-3 py-6">
          <span className="text-sm text-red-400">{error.message}</span>

          <button
            type="button"
            onClick={fetchMore}
            className="cursor-pointer rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-2 text-sm font-semibold text-red-400 transition-all duration-200 hover:border-red-500/60 hover:bg-red-500/20"
          >
            Retry
          </button>
        </div>
      )}

      {/* End of list */}
      {!hasMore && !isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="py-6 text-center text-sm text-zinc-600"
        >
          — No more items —
        </div>
      )}
    </div>
  )
}

function LoadingSpinner() {
  return (
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
  )
}

// ─── Demo / Play Area ───────────────────────────────────────────────────────

interface FakeUser {
  id: number
  name: string
  email: string
  avatar: string
}

const PAGE_SIZE = 15
const TOTAL_USERS = 100

function generateFakeUsers(page: number): FakeUser[] {
  const start = (page - 1) * PAGE_SIZE

  const count = Math.min(PAGE_SIZE, TOTAL_USERS - start)

  return Array.from({ length: count }, (_, i) => {
    const id = start + i + 1

    return {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
      avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=user${id}`,
    }
  })
}

export function InfiniteScrollPlayArea() {
  const pageRef = useRef(1)

  const loadMore = useCallback(async (): Promise<LoadMoreResult<FakeUser>> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const page = pageRef.current
    const users = generateFakeUsers(page)
    const hasMore = page * PAGE_SIZE < TOTAL_USERS

    pageRef.current = page + 1

    return { items: users, hasMore }
  }, [])

  return (
    <div className="flex h-screen w-full flex-col">
      <h1 className="shrink-0 py-5 text-center text-xl font-bold tracking-wide text-zinc-100">
        Infinite Scroll
      </h1>

      <div className="mx-auto w-full max-w-xl flex-1 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-violet-500/5 backdrop-blur-sm">
        <InfiniteScroll<FakeUser>
          loadMore={loadMore}
          threshold="300px"
          height={560}
          renderItem={(user) => <UserCard user={user} />}
          keyExtractor={(user) => user.id}
        />
      </div>
    </div>
  )
}

function UserCard({ user }: { user: FakeUser }) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-800/60 px-5 py-3.5 transition-colors duration-150 hover:bg-white/[0.03]">
      <img
        src={user.avatar}
        alt={user.name}
        className="h-10 w-10 rounded-full bg-zinc-800 ring-1 ring-zinc-700/50"
      />

      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-zinc-200">{user.name}</span>

        <span className="text-xs text-zinc-500">{user.email}</span>
      </div>
    </div>
  )
}
