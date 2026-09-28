import { useRef, useState } from 'react'

interface TabItem {
  id: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: TabItem[]
  defaultActiveTab?: string
  activeTab?: string
  onChange?: (tabId: string) => void
  orientation?: 'horizontal' | 'vertical'
}

const tabs: TabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    content: <div>Overview content</div>,
  },
  {
    id: 'profile',
    label: 'Profile',
    content: <div>Profile content</div>,
  },
  {
    id: 'settings',
    label: 'Settings',
    content: <div>Settings content</div>,
  },
  {
    id: 'billing',
    label: 'Billing',
    content: <div>Billing content</div>,
    disabled: true,
  },
]

export function TabsPlayArea() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <Tabs
      tabs={tabs}
      activeTab={activeTab}
      onChange={setActiveTab}
      orientation="vertical"
    />
  )
}

export function Tabs({
  tabs,
  defaultActiveTab,
  activeTab,
  onChange,
  orientation = 'horizontal',
}: TabsProps) {
  const isControlled = activeTab !== undefined

  const firstEnabledTab = tabs.find((tab) => !tab.disabled)?.id

  const [localActiveTab, setLocalActiveTab] = useState<string | undefined>(
    defaultActiveTab ?? firstEnabledTab,
  )

  const currentActiveTab = isControlled ? activeTab : localActiveTab

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const activeTabContent = tabs.find(
    (tab) => tab.id === currentActiveTab,
  )?.content

  const selectTab = (tabId: string) => {
    const tab = tabs.find((tab) => tab.id === tabId)

    if (!tab || tab.disabled) return

    if (!isControlled) {
      setLocalActiveTab(tabId)
    }

    onChange?.(tabId)
  }

  const getEnabledTabs = () => {
    return tabs.filter((tab) => !tab.disabled)
  }

  const moveFocus = (
    currentId: string,
    direction: 'next' | 'previous' | 'first' | 'last',
  ) => {
    const enabledTabs = getEnabledTabs()

    if (!enabledTabs.length) return

    const currentIndex = enabledTabs.findIndex((tab) => tab.id === currentId)

    let nextIndex = 0

    if (direction === 'next') {
      nextIndex = currentIndex === enabledTabs.length - 1 ? 0 : currentIndex + 1
    }

    if (direction === 'previous') {
      nextIndex = currentIndex <= 0 ? enabledTabs.length - 1 : currentIndex - 1
    }

    if (direction === 'first') {
      nextIndex = 0
    }

    if (direction === 'last') {
      nextIndex = enabledTabs.length - 1
    }

    const nextTab = enabledTabs[nextIndex]

    tabRefs.current[nextTab.id]?.focus()
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    tabId: string,
  ) => {
    const isHorizontal = orientation === 'horizontal'

    switch (event.key) {
      case 'ArrowRight':
        if (isHorizontal) {
          event.preventDefault()
          moveFocus(tabId, 'next')
        }
        break

      case 'ArrowLeft':
        if (isHorizontal) {
          event.preventDefault()
          moveFocus(tabId, 'previous')
        }
        break

      case 'ArrowDown':
        if (!isHorizontal) {
          event.preventDefault()
          moveFocus(tabId, 'next')
        }
        break

      case 'ArrowUp':
        if (!isHorizontal) {
          event.preventDefault()
          moveFocus(tabId, 'previous')
        }
        break

      case 'Home':
        event.preventDefault()
        moveFocus(tabId, 'first')
        break

      case 'End':
        event.preventDefault()
        moveFocus(tabId, 'last')
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        selectTab(tabId)
        break
    }
  }

  if (tabs.length === 0) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'row' : 'column',
        width: '100%',
      }}
    >
      <div
        role="tablist"
        aria-orientation={orientation}
        style={{
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === currentActiveTab

          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              ref={(element) => {
                tabRefs.current[tab.id] = element
              }}
              type="button"
              role="tab"
              disabled={tab.disabled}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, tab.id)}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom:
                  orientation === 'horizontal'
                    ? `2px solid ${isActive ? 'green' : 'transparent'}`
                    : 'none',
                borderRight:
                  orientation === 'vertical'
                    ? `2px solid ${isActive ? 'green' : 'transparent'}`
                    : 'none',
                background: 'transparent',
                color: 'inherit',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                opacity: tab.disabled ? 0.5 : 1,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {currentActiveTab && (
        <div
          id={`panel-${currentActiveTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${currentActiveTab}`}
          tabIndex={0}
          style={{
            padding: '16px',
            flex: 1,
          }}
        >
          {activeTabContent}
        </div>
      )}
    </div>
  )
}
