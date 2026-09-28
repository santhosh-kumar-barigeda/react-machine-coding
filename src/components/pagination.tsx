import { useMemo, useRef, useState } from 'react'

interface PaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage?: number
  defaultPage?: number
  visiblePages?: number
  onPageChange?: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  onChange?: (page: number) => void
}

type PageItem = number | 'ellipsis'

export function PaginationPlayArea() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  return (
    <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-violet-500/5 backdrop-blur-sm">
      <Pagination
        totalItems={250}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        visiblePages={5}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        onChange={(page) => {
          console.log('Current page:', page)
        }}
      />
    </div>
  )
}

export function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  defaultPage = 1,
  visiblePages = 5,
  onPageChange,
  onItemsPerPageChange,
  onChange,
}: PaginationProps) {
  const isControlled = currentPage !== undefined

  const safeTotalItems = Math.max(0, totalItems)
  const safeItemsPerPage = Math.max(1, itemsPerPage)

  const totalPages = Math.max(1, Math.ceil(safeTotalItems / safeItemsPerPage))

  const [localPage, setLocalPage] = useState(() =>
    clamp(defaultPage, 1, totalPages),
  )

  const activePage = clamp(
    isControlled ? currentPage : localPage,
    1,
    totalPages,
  )

  const pageButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({})

  const updatePage = (page: number) => {
    const nextPage = clamp(page, 1, totalPages)

    if (nextPage === activePage) return

    if (!isControlled) {
      setLocalPage(nextPage)
    }

    onPageChange?.(nextPage)
    onChange?.(nextPage)
  }

  const handleItemsPerPageChange = (value: number) => {
    const nextItemsPerPage = Math.max(1, value)

    onItemsPerPageChange?.(nextItemsPerPage)

    if (!isControlled) {
      setLocalPage(1)
    }

    onPageChange?.(1)
    onChange?.(1)
  }

  const pageItems = useMemo(
    () => getPageItems(activePage, totalPages, Math.max(3, visiblePages)),
    [activePage, totalPages, visiblePages],
  )

  const startItem =
    safeTotalItems === 0 ? 0 : (activePage - 1) * safeItemsPerPage + 1

  const endItem = Math.min(activePage * safeItemsPerPage, safeTotalItems)

  const moveFocus = (page: number) => {
    pageButtonRefs.current[page]?.focus()
  }

  const handlePageKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    page: number,
  ) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()

        if (page > 1) {
          moveFocus(page - 1)
          updatePage(page - 1)
        }
        break

      case 'ArrowRight':
        event.preventDefault()

        if (page < totalPages) {
          moveFocus(page + 1)
          updatePage(page + 1)
        }
        break

      case 'Home':
        event.preventDefault()
        moveFocus(1)
        updatePage(1)
        break

      case 'End':
        event.preventDefault()
        moveFocus(totalPages)
        updatePage(totalPages)
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        updatePage(page)
        break
    }
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Page information */}
      <div className="text-sm text-zinc-400">
        Showing <span className="font-semibold text-zinc-200">{startItem}</span>
        –<span className="font-semibold text-zinc-200">{endItem}</span> of{' '}
        <span className="font-semibold text-zinc-200">{safeTotalItems}</span>
      </div>

      {/* Pagination */}
      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center gap-1.5"
      >
        {/* Previous */}
        <button
          type="button"
          aria-label="Previous page"
          aria-disabled={activePage === 1}
          disabled={activePage === 1}
          onClick={() => updatePage(activePage - 1)}
          className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800/60 px-3.5 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-700/80 hover:text-white disabled:pointer-events-none disabled:opacity-30"
        >
          ← Prev
        </button>

        {/* Pages */}
        {pageItems.map((item, index) => {
          if (item === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="px-1 text-zinc-600"
              >
                ···
              </span>
            )
          }

          const isActive = item === activePage

          return (
            <button
              key={item}
              ref={(element) => {
                pageButtonRefs.current[item] = element
              }}
              type="button"
              aria-label={`Go to page ${item}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => updatePage(item)}
              onKeyDown={(event) => handlePageKeyDown(event, item)}
              className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                  : 'border border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {item}
            </button>
          )
        })}

        {/* Next */}
        <button
          type="button"
          aria-label="Next page"
          aria-disabled={activePage === totalPages}
          disabled={activePage === totalPages}
          onClick={() => updatePage(activePage + 1)}
          className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800/60 px-3.5 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-700/80 hover:text-white disabled:pointer-events-none disabled:opacity-30"
        >
          Next →
        </button>
      </nav>

      {/* Items per page */}
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        Items per page
        <select
          value={safeItemsPerPage}
          onChange={(event) =>
            handleItemsPerPageChange(Number(event.target.value))
          }
          className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition-colors outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </label>
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getPageItems(
  currentPage: number,
  totalPages: number,
  visiblePages: number,
): PageItem[] {
  if (totalPages <= visiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages: PageItem[] = []

  pages.push(1)

  const middleCount = visiblePages - 2

  let start = Math.max(2, currentPage - Math.floor(middleCount / 2))

  const end = Math.min(totalPages - 1, start + middleCount - 1)

  if (end - start + 1 < middleCount) {
    start = Math.max(2, end - middleCount + 1)
  }

  if (start > 2) {
    pages.push('ellipsis')
  }

  for (let page = start; page <= end; page++) {
    pages.push(page)
  }

  if (end < totalPages - 1) {
    pages.push('ellipsis')
  }

  pages.push(totalPages)

  return pages
}
