import { memo, useCallback, useRef, useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Comment {
  id: string
  author: string
  text: string
  createdAt: string
  replies: Comment[]
}

// ─── Tree Helpers ───────────────────────────────────────────────────────────

let commentCounter = 0

function generateId(): string {
  return `comment-${++commentCounter}-${Date.now()}`
}

function addReply(
  comments: Comment[],
  parentId: string,
  reply: Comment,
): Comment[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...c.replies, reply] }
    }

    return { ...c, replies: addReply(c.replies, parentId, reply) }
  })
}

function editComment(
  comments: Comment[],
  id: string,
  newText: string,
): Comment[] {
  return comments.map((c) => {
    if (c.id === id) {
      return { ...c, text: newText }
    }

    return { ...c, replies: editComment(c.replies, id, newText) }
  })
}

function deleteComment(comments: Comment[], id: string): Comment[] {
  return comments
    .filter((c) => c.id !== id)
    .map((c) => ({ ...c, replies: deleteComment(c.replies, id) }))
}

// ─── NestedComments Component ───────────────────────────────────────────────

interface NestedCommentsProps {
  initialComments?: Comment[]
}

export function NestedComments({ initialComments = [] }: NestedCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [topLevelInput, setTopLevelInput] = useState('')
  const topInputRef = useRef<HTMLTextAreaElement>(null)

  const handleReply = useCallback(
    (parentId: string, text: string, author: string) => {
      const reply: Comment = {
        id: generateId(),
        author,
        text,
        createdAt: 'Just now',
        replies: [],
      }

      setComments((prev) => addReply(prev, parentId, reply))
    },
    [],
  )

  const handleEdit = useCallback((id: string, newText: string) => {
    setComments((prev) => editComment(prev, id, newText))
  }, [])

  const handleDelete = useCallback((id: string) => {
    setComments((prev) => deleteComment(prev, id))
  }, [])

  const handleAddTopLevel = () => {
    const trimmed = topLevelInput.trim()

    if (!trimmed) return

    const comment: Comment = {
      id: generateId(),
      author: 'You',
      text: trimmed,
      createdAt: 'Just now',
      replies: [],
    }

    setComments((prev) => [...prev, comment])
    setTopLevelInput('')
    topInputRef.current?.focus()
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Comment list */}
      {comments.length === 0 ? (
        <div className="py-8 text-center text-sm text-zinc-600">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add top-level comment */}
      <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
        <textarea
          ref={topInputRef}
          value={topLevelInput}
          onChange={(e) => setTopLevelInput(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleAddTopLevel()
            }
          }}
          className="w-full resize-none rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAddTopLevel}
            disabled={!topLevelInput.trim()}
            className="cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-200 hover:bg-violet-500 disabled:pointer-events-none disabled:opacity-30 disabled:shadow-none"
          >
            Add Comment
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CommentItem ────────────────────────────────────────────────────────────

const CommentItem = memo(function CommentItem({
  comment,
  depth,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: Comment
  depth: number
  onReply: (parentId: string, text: string, author: string) => void
  onEdit: (id: string, newText: string) => void
  onDelete: (id: string) => void
}) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const replyInputRef = useRef<HTMLTextAreaElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const hasReplies = comment.replies.length > 0

  // ── Reply ───────────────────────────────────────────────────────────

  const handleOpenReply = () => {
    setIsReplying(true)
    setReplyText('')

    setTimeout(() => replyInputRef.current?.focus(), 0)
  }

  const handleSubmitReply = () => {
    const trimmed = replyText.trim()

    if (!trimmed) return

    onReply(comment.id, trimmed, 'You')
    setReplyText('')
    setIsReplying(false)
  }

  const handleCancelReply = () => {
    setReplyText('')
    setIsReplying(false)
  }

  // ── Edit ─────────────────────────────────────────────────────────────

  const handleOpenEdit = () => {
    setIsEditing(true)
    setEditText(comment.text)

    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  const handleSaveEdit = () => {
    const trimmed = editText.trim()

    if (!trimmed) return

    onEdit(comment.id, trimmed)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditText(comment.text)
    setIsEditing(false)
  }

  // ── Delete ──────────────────────────────────────────────────────────

  const handleDelete = () => {
    onDelete(comment.id)
    setShowDeleteConfirm(false)
  }

  // ── Author initial color ────────────────────────────────────────────

  const avatarColors = [
    'bg-violet-600/30 text-violet-300',
    'bg-emerald-600/30 text-emerald-300',
    'bg-amber-600/30 text-amber-300',
    'bg-blue-600/30 text-blue-300',
    'bg-rose-600/30 text-rose-300',
    'bg-cyan-600/30 text-cyan-300',
  ]

  const colorIndex = comment.author.charCodeAt(0) % avatarColors.length

  return (
    <div className={depth > 0 ? 'ml-5 border-l-2 border-zinc-800/60 pl-4' : ''}>
      <div className="group rounded-lg p-3 transition-colors hover:bg-zinc-800/30">
        {/* Header */}
        <div className="mb-1.5 flex items-center gap-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColors[colorIndex]}`}
          >
            {comment.author.charAt(0).toUpperCase()}
          </div>

          <span className="text-sm font-semibold text-zinc-200">
            {comment.author}
          </span>

          <span className="text-xs text-zinc-600">·</span>

          <span className="text-xs text-zinc-500">{comment.createdAt}</span>
        </div>

        {/* Body */}
        {isEditing ? (
          <div className="mb-2 flex flex-col gap-2">
            <textarea
              ref={editInputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
                  handleSaveEdit()
                if (e.key === 'Escape') handleCancelEdit()
              }}
              className="w-full resize-none rounded-lg border border-violet-500/40 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
            />

            <div className="flex gap-1.5">
              <ActionButton onClick={handleSaveEdit} variant="primary">
                Save
              </ActionButton>

              <ActionButton onClick={handleCancelEdit} variant="ghost">
                Cancel
              </ActionButton>
            </div>
          </div>
        ) : (
          <p className="mb-2 text-sm leading-relaxed text-zinc-300">
            {comment.text}
          </p>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1">
            <ActionButton onClick={handleOpenReply} variant="ghost">
              Reply
            </ActionButton>

            <ActionButton onClick={handleOpenEdit} variant="ghost">
              Edit
            </ActionButton>

            {showDeleteConfirm ? (
              <>
                <ActionButton onClick={handleDelete} variant="danger">
                  Confirm
                </ActionButton>

                <ActionButton
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="ghost"
                >
                  Cancel
                </ActionButton>
              </>
            ) : (
              <ActionButton
                onClick={() => setShowDeleteConfirm(true)}
                variant="ghost"
              >
                Delete
              </ActionButton>
            )}

            {hasReplies && (
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? 'Expand replies' : 'Collapse replies'}
                className="ml-auto cursor-pointer rounded px-2 py-0.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-700/50 hover:text-zinc-300"
              >
                {isCollapsed
                  ? `▶ ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
                  : '▼ Collapse'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reply input */}
      {isReplying && (
        <div className="mt-2 ml-5 flex flex-col gap-2 border-l-2 border-violet-500/20 pl-4">
          <textarea
            ref={replyInputRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
                handleSubmitReply()
              if (e.key === 'Escape') handleCancelReply()
            }}
            className="w-full resize-none rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
          />

          <div className="flex gap-1.5">
            <ActionButton onClick={handleSubmitReply} variant="primary">
              Reply
            </ActionButton>

            <ActionButton onClick={handleCancelReply} variant="ghost">
              Cancel
            </ActionButton>
          </div>
        </div>
      )}

      {/* Replies */}
      {hasReplies && !isCollapsed && (
        <div className="mt-1 flex flex-col gap-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
})

// ─── Action Button ──────────────────────────────────────────────────────────

function ActionButton({
  onClick,
  variant,
  children,
}: {
  onClick: () => void
  variant: 'primary' | 'ghost' | 'danger'
  children: React.ReactNode
}) {
  const styles = {
    primary:
      'bg-violet-600 text-white hover:bg-violet-500 shadow-sm shadow-violet-500/20',
    ghost: 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50',
    danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${styles[variant]}`}
    >
      {children}
    </button>
  )
}

// ─── Demo / Play Area ───────────────────────────────────────────────────────

const sampleComments: Comment[] = [
  {
    id: '1',
    author: 'Alice',
    text: 'React hooks have completely changed how I write components. The mental model is so much cleaner now.',
    createdAt: '2 hours ago',
    replies: [
      {
        id: '2',
        author: 'Bob',
        text: 'Totally agree! useEffect took some getting used to though.',
        createdAt: '1 hour ago',
        replies: [
          {
            id: '3',
            author: 'Charlie',
            text: 'Same here! The cleanup function was confusing at first.',
            createdAt: '45 min ago',
            replies: [
              {
                id: '4',
                author: 'Alice',
                text: 'The React docs have a great section on this now. Highly recommend checking it out.',
                createdAt: '30 min ago',
                replies: [],
              },
            ],
          },
        ],
      },
      {
        id: '5',
        author: 'Diana',
        text: 'Have you tried the new React compiler? It auto-memoizes everything.',
        createdAt: '50 min ago',
        replies: [],
      },
    ],
  },
  {
    id: '6',
    author: 'Eve',
    text: 'Anyone have recommendations for state management in large React apps?',
    createdAt: '3 hours ago',
    replies: [
      {
        id: '7',
        author: 'Frank',
        text: 'Zustand is fantastic for most cases. Simple API, great devtools.',
        createdAt: '2 hours ago',
        replies: [],
      },
    ],
  },
]

export function NestedCommentsPlayArea() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6">
      <h1 className="text-xl font-bold tracking-wide text-zinc-100">
        Nested Comments
      </h1>

      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl shadow-violet-500/5 backdrop-blur-sm">
        <NestedComments initialComments={sampleComments} />
      </div>

      <p className="text-center text-xs leading-relaxed text-zinc-600">
        Cmd/Ctrl + Enter to submit · Escape to cancel
      </p>
    </div>
  )
}
