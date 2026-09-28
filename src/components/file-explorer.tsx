import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

interface FileExplorerProps {
  data: FileNode[]
  defaultExpandedIds?: string[]
  expandedIds?: string[]
  onExpandedChange?: (ids: string[]) => void
  onSelect?: (node: FileNode) => void
  onCreate?: (parentId: string | null, node: FileNode) => void
  onRename?: (nodeId: string, newName: string) => void
  onDelete?: (nodeId: string) => void
  onMove?: (nodeId: string, targetFolderId: string) => void
}

interface ContextMenuState {
  x: number
  y: number
  nodeId: string
}

// ─── Tree Helpers ───────────────────────────────────────────────────────────

let nodeCounter = 0
function generateId(): string {
  return `node-${++nodeCounter}-${Date.now()}`
}

function findNode(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node

    if (node.children) {
      const found = findNode(node.children, id)

      if (found) return found
    }
  }

  return null
}

function findParentId(nodes: FileNode[], id: string): string | null {
  for (const node of nodes) {
    if (node.children) {
      for (const child of node.children) {
        if (child.id === id) return node.id
      }

      const found = findParentId(node.children, id)

      if (found !== null) return found
    }
  }

  return null
}

function removeNode(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      n.children ? { ...n, children: removeNode(n.children, id) } : n,
    )
}

function insertInto(
  nodes: FileNode[],
  parentId: string | null,
  child: FileNode,
): FileNode[] {
  if (parentId === null) {
    return [...nodes, child]
  }

  return nodes.map((n) => {
    if (n.id === parentId) {
      return { ...n, children: [...(n.children ?? []), child] }
    }

    if (n.children) {
      return { ...n, children: insertInto(n.children, parentId, child) }
    }

    return n
  })
}

function renameNode(
  nodes: FileNode[],
  id: string,
  newName: string,
): FileNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, name: newName }

    if (n.children) {
      return { ...n, children: renameNode(n.children, id, newName) }
    }

    return n
  })
}

function isDescendant(
  nodes: FileNode[],
  ancestorId: string,
  targetId: string,
): boolean {
  const node = findNode(nodes, ancestorId)

  if (!node?.children) return false

  for (const child of node.children) {
    if (child.id === targetId) return true

    if (child.children && isDescendant([child], child.id, targetId)) return true
  }

  return false
}

function getVisibleNodes(
  nodes: FileNode[],
  expandedIds: Set<string>,
): FileNode[] {
  const result: FileNode[] = []

  for (const node of nodes) {
    result.push(node)

    if (node.type === 'folder' && expandedIds.has(node.id) && node.children) {
      result.push(...getVisibleNodes(node.children, expandedIds))
    }
  }

  return result
}

// ─── FileExplorer Component ─────────────────────────────────────────────────

export function FileExplorer({
  data: initialData,
  defaultExpandedIds = [],
  expandedIds: controlledExpanded,
  onExpandedChange,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onMove,
}: FileExplorerProps) {
  const isControlledExpansion = controlledExpanded !== undefined

  const [tree, setTree] = useState<FileNode[]>(initialData)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
    () => new Set(defaultExpandedIds),
  )
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const treeContainerRef = useRef<HTMLDivElement>(null)

  const expandedIds = useMemo(
    () =>
      isControlledExpansion ? new Set(controlledExpanded) : internalExpanded,
    [isControlledExpansion, controlledExpanded, internalExpanded],
  )

  const updateExpanded = useCallback(
    (next: Set<string>) => {
      if (!isControlledExpansion) {
        setInternalExpanded(next)
      }

      onExpandedChange?.(Array.from(next))
    },
    [isControlledExpansion, onExpandedChange],
  )

  // ── Search filtering ────────────────────────────────────────────────

  const { displayTree, searchExpandedIds } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { displayTree: tree, searchExpandedIds: null }
    }

    const lower = searchQuery.trim().toLowerCase()
    const ancestors: string[] = []

    function walkFilter(items: FileNode[]): FileNode[] {
      const result: FileNode[] = []

      for (const node of items) {
        const nameMatches = node.name.toLowerCase().includes(lower)

        if (node.children) {
          const filteredChildren = walkFilter(node.children)

          if (nameMatches || filteredChildren.length > 0) {
            ancestors.push(node.id)
            result.push({
              ...node,
              children:
                filteredChildren.length > 0 ? filteredChildren : node.children,
            })
          }
        } else if (nameMatches) {
          result.push(node)
        }
      }

      return result
    }

    const filtered = walkFilter(tree)

    return {
      displayTree: filtered,
      searchExpandedIds: new Set(ancestors),
    }
  }, [tree, searchQuery])

  const effectiveExpanded = searchExpandedIds ?? expandedIds

  // ── Visible nodes for keyboard nav ──────────────────────────────────

  const visibleNodes = useMemo(
    () => getVisibleNodes(displayTree, effectiveExpanded),
    [displayTree, effectiveExpanded],
  )

  // ── Toggle expand ───────────────────────────────────────────────────

  const toggleExpand = useCallback(
    (id: string) => {
      const next = new Set(expandedIds)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      updateExpanded(next)
    },
    [expandedIds, updateExpanded],
  )

  // ── Select ──────────────────────────────────────────────────────────

  const selectNode = useCallback(
    (id: string) => {
      setSelectedId(id)

      const node = findNode(tree, id)

      if (node) onSelect?.(node)
    },
    [tree, onSelect],
  )

  // ── Create ──────────────────────────────────────────────────────────

  const createNode = useCallback(
    (type: 'file' | 'folder') => {
      const parentId =
        selectedId && findNode(tree, selectedId)?.type === 'folder'
          ? selectedId
          : selectedId
            ? findParentId(tree, selectedId)
            : null

      const newNode: FileNode = {
        id: generateId(),
        name: type === 'file' ? 'untitled' : 'new-folder',
        type,
        ...(type === 'folder' ? { children: [] } : {}),
      }

      setTree((prev) => insertInto(prev, parentId, newNode))

      if (parentId) {
        const next = new Set(expandedIds)
        next.add(parentId)
        updateExpanded(next)
      }

      setSelectedId(newNode.id)
      setRenamingId(newNode.id)
      setContextMenu(null)

      onCreate?.(parentId, newNode)
    },
    [selectedId, tree, expandedIds, updateExpanded, onCreate],
  )

  // ── Rename ──────────────────────────────────────────────────────────

  const commitRename = useCallback(
    (id: string, newName: string) => {
      const trimmed = newName.trim()

      if (!trimmed) {
        setRenamingId(null)

        return
      }

      setTree((prev) => renameNode(prev, id, trimmed))
      setRenamingId(null)
      onRename?.(id, trimmed)
    },
    [onRename],
  )

  // ── Delete ──────────────────────────────────────────────────────────

  const deleteNode = useCallback(
    (id: string) => {
      setTree((prev) => removeNode(prev, id))

      if (selectedId === id) setSelectedId(null)

      setConfirmDeleteId(null)
      setContextMenu(null)
      onDelete?.(id)
    },
    [selectedId, onDelete],
  )

  // ── Move (drag and drop) ────────────────────────────────────────────

  const moveNode = useCallback(
    (nodeId: string, targetFolderId: string) => {
      if (nodeId === targetFolderId) return

      if (isDescendant(tree, nodeId, targetFolderId)) return

      const node = findNode(tree, nodeId)

      if (!node) return

      setTree((prev) => {
        const removed = removeNode(prev, nodeId)

        return insertInto(removed, targetFolderId, node)
      })

      const next = new Set(expandedIds)
      next.add(targetFolderId)
      updateExpanded(next)

      onMove?.(nodeId, targetFolderId)
    },
    [tree, expandedIds, updateExpanded, onMove],
  )

  // ── Keyboard navigation ─────────────────────────────────────────────

  const handleTreeKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!selectedId) {
        if (event.key === 'ArrowDown' && visibleNodes.length > 0) {
          event.preventDefault()
          selectNode(visibleNodes[0].id)
        }

        return
      }

      const currentIndex = visibleNodes.findIndex((n) => n.id === selectedId)

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          if (currentIndex < visibleNodes.length - 1) {
            selectNode(visibleNodes[currentIndex + 1].id)
          }
          break

        case 'ArrowUp':
          event.preventDefault()
          if (currentIndex > 0) {
            selectNode(visibleNodes[currentIndex - 1].id)
          }
          break

        case 'ArrowRight': {
          event.preventDefault()
          const node = findNode(tree, selectedId)

          if (node?.type === 'folder') {
            if (!expandedIds.has(selectedId)) {
              toggleExpand(selectedId)
            } else if (node.children?.length) {
              selectNode(node.children[0].id)
            }
          }
          break
        }

        case 'ArrowLeft': {
          event.preventDefault()
          const node = findNode(tree, selectedId)

          if (node?.type === 'folder' && expandedIds.has(selectedId)) {
            toggleExpand(selectedId)
          } else {
            const parentId = findParentId(tree, selectedId)

            if (parentId) selectNode(parentId)
          }
          break
        }

        case 'Enter':
          event.preventDefault()
          selectNode(selectedId)
          break

        case 'F2':
          event.preventDefault()
          setRenamingId(selectedId)
          break

        case 'Delete':
          event.preventDefault()
          setConfirmDeleteId(selectedId)
          break
      }
    },
    [selectedId, visibleNodes, tree, expandedIds, selectNode, toggleExpand],
  )

  // ── Context menu ────────────────────────────────────────────────────

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, nodeId: string) => {
      event.preventDefault()
      setSelectedId(nodeId)
      setContextMenu({ x: event.clientX, y: event.clientY, nodeId })
    },
    [],
  )

  // Close context menu on outside click / escape
  useEffect(() => {
    if (!contextMenu) return

    const handleClick = () => setContextMenu(null)
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [contextMenu])

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
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
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/60 py-2 pr-3 pl-9 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
        />
      </div>

      {/* Toolbar */}
      <div className="flex gap-1.5">
        <ToolbarButton onClick={() => createNode('file')}>+ File</ToolbarButton>

        <ToolbarButton onClick={() => createNode('folder')}>
          + Folder
        </ToolbarButton>
      </div>

      {/* Tree */}
      <div
        ref={treeContainerRef}
        role="tree"
        aria-label="File explorer"
        tabIndex={0}
        onKeyDown={handleTreeKeyDown}
        className="max-h-[500px] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-1 outline-none focus:ring-1 focus:ring-violet-500/30"
      >
        {displayTree.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-zinc-600">
            {searchQuery ? 'No matching files' : 'No files'}
          </div>
        ) : (
          displayTree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedId}
              expandedIds={effectiveExpanded}
              renamingId={renamingId}
              dragOverId={dragOverId}
              searchQuery={searchQuery}
              onSelect={selectNode}
              onToggleExpand={toggleExpand}
              onContextMenu={handleContextMenu}
              onCommitRename={commitRename}
              onCancelRename={() => setRenamingId(null)}
              onDragStart={() => {}}
              onDragOver={setDragOverId}
              onDrop={moveNode}
              onDragEnd={() => setDragOverId(null)}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onNewFile={() => createNode('file')}
          onNewFolder={() => createNode('folder')}
          onRename={() => {
            setRenamingId(contextMenu.nodeId)
            setContextMenu(null)
          }}
          onDelete={() => {
            setConfirmDeleteId(contextMenu.nodeId)
            setContextMenu(null)
          }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
          <span className="flex-1 text-red-300">Delete this item?</span>

          <button
            type="button"
            onClick={() => deleteNode(confirmDeleteId)}
            className="cursor-pointer rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-500"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={() => setConfirmDeleteId(null)}
            className="cursor-pointer rounded-md bg-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ─── TreeNode ───────────────────────────────────────────────────────────────

const TreeNode = memo(function TreeNode({
  node,
  depth,
  selectedId,
  expandedIds,
  renamingId,
  dragOverId,
  searchQuery,
  onSelect,
  onToggleExpand,
  onContextMenu,
  onCommitRename,
  onCancelRename,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  node: FileNode
  depth: number
  selectedId: string | null
  expandedIds: Set<string>
  renamingId: string | null
  dragOverId: string | null
  searchQuery: string
  onSelect: (id: string) => void
  onToggleExpand: (id: string) => void
  onContextMenu: (event: React.MouseEvent, nodeId: string) => void
  onCommitRename: (id: string, name: string) => void
  onCancelRename: () => void
  onDragStart: () => void
  onDragOver: (id: string | null) => void
  onDrop: (nodeId: string, targetId: string) => void
  onDragEnd: () => void
}) {
  const isFolder = node.type === 'folder'
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id
  const isRenaming = renamingId === node.id
  const isDragOver = dragOverId === node.id

  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [isRenaming])

  const handleClick = () => {
    onSelect(node.id)

    if (isFolder) {
      onToggleExpand(node.id)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', node.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (isFolder) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      onDragOver(node.id)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')

    if (draggedId && isFolder) {
      onDrop(draggedId, node.id)
    }

    onDragOver(null)
  }

  const handleDragLeave = () => {
    onDragOver(null)
  }

  const icon = isFolder ? (isExpanded ? '📂' : '📁') : '📄'

  return (
    <div
      role="treeitem"
      aria-expanded={isFolder ? isExpanded : undefined}
      aria-selected={isSelected}
    >
      <div
        draggable
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node.id)}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
        onDragEnd={onDragEnd}
        className={`group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors ${
          isSelected
            ? 'bg-violet-600/20 text-violet-200'
            : 'text-zinc-300 hover:bg-zinc-800'
        } ${isDragOver ? 'bg-violet-500/10 ring-1 ring-violet-500/50' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand chevron */}
        {isFolder && (
          <span
            className={`text-[10px] text-zinc-500 transition-transform duration-150 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          >
            ▶
          </span>
        )}

        {!isFolder && <span className="w-[10px]" />}

        {/* Icon */}
        <span className="text-sm">{icon}</span>

        {/* Name or rename input */}
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            defaultValue={node.name}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onCommitRename(node.id, e.currentTarget.value)
              }

              if (e.key === 'Escape') {
                onCancelRename()
              }
            }}
            onBlur={(e) => onCommitRename(node.id, e.currentTarget.value)}
            onClick={(e) => e.stopPropagation()}
            className="min-w-0 flex-1 rounded border border-violet-500/50 bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-200 outline-none"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate">
            <HighlightedName name={node.name} query={searchQuery} />
          </span>
        )}
      </div>

      {/* Children */}
      {isFolder && isExpanded && node.children && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              renamingId={renamingId}
              dragOverId={dragOverId}
              searchQuery={searchQuery}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onContextMenu={onContextMenu}
              onCommitRename={onCommitRename}
              onCancelRename={onCancelRename}
              onDragStart={() => {}}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  )
})

// ─── Highlighted Name ───────────────────────────────────────────────────────

function HighlightedName({ name, query }: { name: string; query: string }) {
  const trimmed = query.trim()

  if (!trimmed) return <>{name}</>

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = name.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="font-semibold text-amber-300">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

// ─── Context Menu ───────────────────────────────────────────────────────────

function ContextMenu({
  x,
  y,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
}: {
  x: number
  y: number
  onNewFile: () => void
  onNewFolder: () => void
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="fixed z-50 min-w-[140px] rounded-lg border border-zinc-700/60 bg-zinc-900/95 py-1 shadow-xl backdrop-blur-xl"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <ContextMenuItem onClick={onNewFile}>New File</ContextMenuItem>
      <ContextMenuItem onClick={onNewFolder}>New Folder</ContextMenuItem>

      <div className="mx-2 my-1 border-t border-zinc-800" />

      <ContextMenuItem onClick={onRename}>Rename</ContextMenuItem>
      <ContextMenuItem onClick={onDelete} danger>
        Delete
      </ContextMenuItem>
    </div>
  )
}

function ContextMenuItem({
  onClick,
  danger,
  children,
}: {
  onClick: () => void
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full cursor-pointer px-3 py-1.5 text-left text-sm transition-colors ${
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-zinc-300 hover:bg-zinc-800'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Toolbar Button ─────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-md border border-zinc-700/50 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:bg-zinc-700/80 hover:text-zinc-200"
    >
      {children}
    </button>
  )
}

// ─── Demo / Play Area ───────────────────────────────────────────────────────

const sampleFileTree: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: '2',
        name: 'components',
        type: 'folder',
        children: [
          { id: '3', name: 'Button.tsx', type: 'file' },
          { id: '4', name: 'Modal.tsx', type: 'file' },
          { id: '5', name: 'Sidebar.tsx', type: 'file' },
        ],
      },
      {
        id: '6',
        name: 'hooks',
        type: 'folder',
        children: [
          { id: '7', name: 'useAuth.ts', type: 'file' },
          { id: '8', name: 'useTheme.ts', type: 'file' },
        ],
      },
      {
        id: '9',
        name: 'pages',
        type: 'folder',
        children: [
          { id: '10', name: 'Home.tsx', type: 'file' },
          { id: '11', name: 'About.tsx', type: 'file' },
          { id: '12', name: 'Settings.tsx', type: 'file' },
        ],
      },
      { id: '13', name: 'App.tsx', type: 'file' },
      { id: '14', name: 'index.ts', type: 'file' },
    ],
  },
  {
    id: '15',
    name: 'public',
    type: 'folder',
    children: [
      { id: '16', name: 'favicon.svg', type: 'file' },
      { id: '17', name: 'index.html', type: 'file' },
    ],
  },
  { id: '18', name: 'package.json', type: 'file' },
  { id: '19', name: 'tsconfig.json', type: 'file' },
  { id: '20', name: 'README.md', type: 'file' },
]

export function FileExplorerPlayArea() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <h1 className="text-xl font-bold tracking-wide text-zinc-100">
        File Explorer
      </h1>

      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl shadow-violet-500/5 backdrop-blur-sm">
        <FileExplorer
          data={sampleFileTree}
          defaultExpandedIds={['1']}
          onSelect={(node) => console.log('Selected:', node.name)}
          onRename={(id, name) => console.log('Renamed:', id, name)}
          onDelete={(id) => console.log('Deleted:', id)}
          onMove={(id, target) => console.log('Moved:', id, '→', target)}
        />
      </div>

      <p className="text-center text-xs leading-relaxed text-zinc-600">
        Right-click for context menu · F2 to rename · Delete key to remove
        <br />
        Drag files into folders · Arrow keys to navigate
      </p>
    </div>
  )
}
