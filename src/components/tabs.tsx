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
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-zinc-100">
          Welcome to the Overview
        </h3>
        <p className="text-sm leading-relaxed text-zinc-400">
          This is the overview tab. It provides a high-level summary of your
          dashboard with key metrics and recent activity.
        </p>
      </div>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-zinc-100">Your Profile</h3>
        <p className="text-sm leading-relaxed text-zinc-400">
          Manage your personal information, avatar, and display preferences from
          this section.
        </p>
      </div>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-zinc-100">Settings</h3>
        <p className="text-sm leading-relaxed text-zinc-400">
          Configure application preferences, notifications, and privacy
          settings.
        </p>
      </div>
    ),
  },
  {
    id: 'billing',
    label: 'Billing',
    content: (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-zinc-100">Billing</h3>
        <p className="text-sm leading-relaxed text-zinc-400">
          View invoices, manage payment methods, and update your subscription.
        </p>
      </div>
    ),
  },
]

export function TabsPlayArea() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/80 p-1 shadow-2xl shadow-violet-500/5 backdrop-blur-sm">
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        orientation="horizontal"
      />
    </div>
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

  const isVertical = orientation === 'vertical'

  return (
    <div className={`flex w-full ${isVertical ? 'flex-row' : 'flex-col'}`}>
      <div
        role="tablist"
        aria-orientation={orientation}
        className={`flex ${
          isVertical
            ? 'flex-col gap-1 border-r border-zinc-800 p-2'
            : 'gap-1 border-b border-zinc-800 p-2'
        }`}
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
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                tab.disabled
                  ? 'cursor-not-allowed text-zinc-600 opacity-40'
                  : isActive
                    ? 'bg-violet-600/20 text-violet-300 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
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
          className="flex-1 p-5 outline-none"
        >
          {activeTabContent}
        </div>
      )}
    </div>
  )
}
