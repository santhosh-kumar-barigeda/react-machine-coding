import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

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

  // Auto-load initial batch (when no initialItems or when content doesn't fill container)
  useEffect(() => {
    if (items.length === 0 && hasMore) {
      fetchMore()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const containerStyle: React.CSSProperties | undefined =
    height != null
      ? {
          height: `${height}px`,
          overflowY: 'auto',
        }
      : undefined

  return (
    <div ref={scrollContainerRef} style={containerStyle}>
      {items.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : index

        return <div key={key}>{renderItem(item, index)}</div>
      })}

      {/* Sentinel element observed by IntersectionObserver */}
      {hasMore && <div ref={sentinelRef} style={{ height: '1px' }} />}

      {/* Loading indicator */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px',
            color: '#a1a1aa',
          }}
        >
          Loading...
        </div>
      )}

      {/* Error state with retry */}
      {error && !isLoading && (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '16px',
            color: '#ef4444',
          }}
        >
          <span>{error.message}</span>

          <button
            type="button"
            onClick={fetchMore}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: '1px solid #ef4444',
              color: '#ef4444',
              background: 'transparent',
              cursor: 'pointer',
            }}
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
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px',
            color: '#71717a',
          }}
        >
          No more items
        </div>
      )}
    </div>
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
      }}
    >
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          padding: '16px',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        Infinite Scroll
      </h1>

      <div style={{ flex: 1, minHeight: 0 }}>
        <InfiniteScroll<FakeUser>
          loadMore={loadMore}
          threshold="300px"
          height={600}
          renderItem={(user) => <UserCard user={user} />}
          keyExtractor={(user) => user.id}
        />
      </div>
    </div>
  )
}

function UserCard({ user }: { user: FakeUser }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: '1px solid #27272a',
      }}
    >
      <img
        src={user.avatar}
        alt={user.name}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#3f3f46',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontWeight: 600 }}>{user.name}</span>

        <span style={{ fontSize: '14px', color: '#a1a1aa' }}>
          {user.email}
        </span>
      </div>
    </div>
  )
}
