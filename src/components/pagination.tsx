import { useEffect, useMemo, useRef, useState } from 'react'

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

  useEffect(() => {
    if (activePage > totalPages) {
      if (!isControlled) {
        setLocalPage(totalPages)
      }

      onPageChange?.(totalPages)
      onChange?.(totalPages)
    }
  }, [activePage, totalPages, isControlled, onPageChange, onChange])

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
      }}
    >
      {/* Page information */}
      <div>
        Showing {startItem}–{endItem} of {safeTotalItems}
      </div>

      {/* Pagination */}
      <nav
        aria-label="Pagination"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {/* Previous */}
        <button
          type="button"
          aria-label="Previous page"
          aria-disabled={activePage === 1}
          disabled={activePage === 1}
          onClick={() => updatePage(activePage - 1)}
        >
          Previous
        </button>

        {/* Pages */}
        {pageItems.map((item, index) => {
          if (item === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} aria-hidden="true">
                ...
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
              style={{
                minWidth: '36px',
                height: '36px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: isActive ? 'black' : 'white',
                color: isActive ? 'white' : 'black',
                cursor: 'pointer',
              }}
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
        >
          Next
        </button>
      </nav>

      {/* Items per page */}
      <label>
        Items per page:{' '}
        <select
          value={safeItemsPerPage}
          onChange={(event) =>
            handleItemsPerPageChange(Number(event.target.value))
          }
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

  let end = Math.min(totalPages - 1, start + middleCount - 1)

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
