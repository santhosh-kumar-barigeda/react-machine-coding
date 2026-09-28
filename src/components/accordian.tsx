import { useRef, useState } from 'react'

interface AccordionItem {
  id: string
  title: string
  content: string
  disabled?: boolean
  defaultOpen?: boolean
  children?: AccordionItem[]
}

interface AccordionProps {
  items: AccordionItem[]
  openItems?: string[]
  onChange?: (openItems: string[]) => void
  allowMultiple?: boolean
  defaultOpen?: string[]
}

export const items: AccordionItem[] = [
  {
    id: '1',
    title: 'Frontend',
    content:
      'Everything that runs in the browser: UI, styling, and client-side logic.',
    defaultOpen: true,
    children: [
      {
        id: '1-1',
        title: 'React',
        content:
          'React is a JavaScript library for building component-based UIs.',
        defaultOpen: true,
        children: [
          {
            id: '1-1-1',
            title: 'Hooks',
            content: 'Hooks allow functional components to use React features.',
          },
          {
            id: '1-1-2',
            title: 'Context',
            content:
              'Context passes data through the tree without prop drilling.',
          },
          {
            id: '1-1-3',
            title: 'Suspense',
            content: 'Suspense lets components wait for data before rendering.',
          },
        ],
      },
      {
        id: '1-2',
        title: 'CSS',
        content: 'CSS controls layout, color, and typography.',
        children: [
          {
            id: '1-2-1',
            title: 'Flexbox',
            content: 'Flexbox lays out items along a single axis.',
          },
          {
            id: '1-2-2',
            title: 'Grid',
            content: 'Grid lays out items in rows and columns at once.',
            disabled: true,
          },
        ],
      },
      {
        id: '1-3',
        title: 'TypeScript',
        content: 'TypeScript adds static types to JavaScript.',
        children: [
          {
            id: '1-3-1',
            title: 'Generics',
            content:
              'Generics let one function or type work across many types.',
          },
          {
            id: '1-3-2',
            title: 'Utility Types',
            content:
              'Utility types like Partial and Pick reshape existing types.',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    title: 'Backend',
    content:
      'Server-side code that handles requests, business logic, and data.',
    children: [
      {
        id: '2-1',
        title: 'Node.js',
        content: 'Node.js runs JavaScript outside the browser.',
        children: [
          {
            id: '2-1-1',
            title: 'Express',
            content: 'Express is a minimal web framework for Node.js.',
          },
          {
            id: '2-1-2',
            title: 'Streams',
            content: 'Streams process data in chunks instead of all at once.',
          },
        ],
      },
      {
        id: '2-2',
        title: 'Databases',
        content: 'Databases store and query application data.',
        disabled: true,
        defaultOpen: true,
        children: [
          {
            id: '2-2-1',
            title: 'PostgreSQL',
            content:
              'PostgreSQL is a relational database with strong SQL support.',
          },
          {
            id: '2-2-2',
            title: 'Redis',
            content: 'Redis is an in-memory store often used for caching.',
          },
        ],
      },
    ],
  },
  {
    id: '3',
    title: 'DevOps',
    content: 'The tooling that builds, ships, and runs software.',
    children: [
      {
        id: '3-1',
        title: 'Docker',
        content: 'Docker packages apps and dependencies into containers.',
        disabled: true,
      },
      {
        id: '3-2',
        title: 'CI/CD',
        content: 'CI/CD automates testing and deployment on every change.',
        children: [
          {
            id: '3-2-1',
            title: 'GitHub Actions',
            content: 'GitHub Actions runs workflows triggered by repo events.',
          },
        ],
      },
    ],
  },
  {
    id: '4',
    title: 'Design',
    content: 'Designing interfaces people can actually use.',
    children: [
      {
        id: '4-1',
        title: 'Accessibility',
        content: 'Accessibility makes interfaces usable for everyone.',
        children: [
          {
            id: '4-1-1',
            title: 'ARIA',
            content:
              'ARIA attributes describe custom widgets to assistive tech.',
          },
          {
            id: '4-1-2',
            title: 'Keyboard Navigation',
            content: 'Every interactive element should work without a mouse.',
          },
        ],
      },
      {
        id: '4-2',
        title: 'Design Systems',
        content: 'Design systems keep UI consistent through shared components.',
      },
    ],
  },
]

export function AccordionPlayArea() {
  const [openItems, setOpenItems] = useState<string[]>([])

  return (
    <Accordion
      items={items}
      openItems={openItems}
      onChange={setOpenItems}
      allowMultiple={false}
    />
  )
}

export function Accordion({
  items,
  openItems: controlledOpenItems,
  onChange,
  allowMultiple = false,
  defaultOpen = [],
}: AccordionProps) {
  const isControlled = controlledOpenItems !== undefined

  const initialOpenItems = items
    .filter((item) => item.defaultOpen)
    .map((item) => item.id)
    .concat(defaultOpen)
    .filter((id, index, array) => array.indexOf(id) === index)

  const [internalOpenItems, setInternalOpenItems] =
    useState<string[]>(initialOpenItems)

  const openItems = isControlled ? controlledOpenItems : internalOpenItems

  const updateOpenItems = (nextItems: string[]) => {
    if (!isControlled) {
      setInternalOpenItems(nextItems)
    }

    onChange?.(nextItems)
  }

  const toggleItem = (item: AccordionItem) => {
    if (item.disabled) return

    const isOpen = openItems.includes(item.id)

    let nextItems: string[]

    if (isOpen) {
      nextItems = openItems.filter((id) => id !== item.id)
    } else if (allowMultiple) {
      nextItems = [...openItems, item.id]
    } else {
      nextItems = [item.id]
    }

    updateOpenItems(nextItems)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
      }}
    >
      {items.map((item) => (
        <AccordionItemView
          key={item.id}
          item={item}
          isOpen={openItems.includes(item.id)}
          onToggle={() => toggleItem(item)}
          openItems={openItems}
          onChange={updateOpenItems}
          allowMultiple={allowMultiple}
        />
      ))}
    </div>
  )
}

interface AccordionItemViewProps {
  item: AccordionItem
  isOpen: boolean
  onToggle: () => void
  openItems: string[]
  onChange: (openItems: string[]) => void
  allowMultiple: boolean
}

function AccordionItemView({
  item,
  isOpen,
  onToggle,
  allowMultiple,
}: AccordionItemViewProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        disabled={item.disabled}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${item.id}`}
        aria-disabled={item.disabled}
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: 'none',
          background: 'transparent',
          color: 'inherit',
          cursor: item.disabled ? 'not-allowed' : 'pointer',
          opacity: item.disabled ? 0.5 : 1,
          textAlign: 'left',
        }}
      >
        <span>{item.title}</span>

        <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
      </button>

      <div
        id={`accordion-content-${item.id}`}
        role="region"
        aria-labelledby={`accordion-trigger-${item.id}`}
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 200ms ease',
        }}
      >
        <div
          style={{
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: isOpen ? '12px 16px' : '0 16px',
              borderTop: isOpen ? '1px solid #e5e7eb' : 'none',
              transition: 'padding 200ms ease',
            }}
          >
            <div>{item.content}</div>

            {item.children && item.children.length > 0 && (
              <div
                style={{
                  marginTop: '12px',
                  marginLeft: '8px',
                  paddingLeft: '12px',
                }}
              >
                <Accordion
                  items={item.children}
                  allowMultiple={allowMultiple}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
