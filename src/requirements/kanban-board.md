# Machine Coding: Kanban Board

Build a **Kanban Board** in React + TypeScript, similar to Trello/Jira.

### 1. Data model

```ts
type Card = {
  id: string
  title: string
  description?: string
  assignee?: string
  priority?: 'low' | 'medium' | 'high'
  labels?: string[]
}

type Column = {
  id: string
  title: string
  cardIds: string[]
}

type BoardState = {
  columns: Column[]
  cards: Record<string, Card>
}
```

### 2. Board UI

Render:

```text
┌─────────────────────────────────────────────────────────────┐
│ Kanban Board                              [+ Add Column]     │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Todo         │ In Progress  │ Review       │ Done           │
│              │              │              │                │
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐  │
│ │ Card 1   │ │ │ Card 3   │ │ │ Card 5   │ │ │ Card 7   │  │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │ └──────────┘  │
│              │              │              │                │
│ ┌──────────┐ │ ┌──────────┐ │              │                │
│ │ Card 2   │ │ │ Card 4   │ │              │                │
│ └──────────┘ │ └──────────┘ │              │                │
│              │              │              │                │
│ [+ Add Card] │ [+ Add Card] │ [+ Add Card] │ [+ Add Card]  │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### 3. Columns

Support:

- Add column
- Rename column
- Delete column
- Reorder columns
- Add cards to a column

When deleting a column, handle its cards explicitly rather than silently losing them.

### 4. Cards

Each card should display:

- Title
- Description, if present
- Assignee
- Priority
- Labels

Support:

- Add card
- Edit card
- Delete card
- Duplicate card

### 5. Drag and drop

Implement card drag-and-drop using native HTML5 drag/drop or pointer events.

Cards must support:

```text
Column A                 Column B

┌──────────┐
│ Card 1   │   ──────►   ┌──────────┐
└──────────┘              │ Card 1   │
                          └──────────┘
```

Support:

- Reordering cards within the same column
- Moving cards between columns
- Moving a card to the beginning, middle, or end
- Visual drop indicator
- Correctly updating both source and destination columns

Also support reordering columns.

### 6. Card editing

Clicking a card should open an edit UI/modal containing:

```text
Title
[________________________]

Description
[________________________]

Assignee
[________________________]

Priority
[ Low ▼ ]

Labels
[frontend] [bug] [+]
```

Changes should update the board immediately after saving.

### 7. Search

Provide:

```text
[ 🔍 Search cards... ]
```

Search should match:

- Title
- Description
- Assignee
- Labels

Matching cards remain visible; non-matching cards should be visually hidden or filtered.

Show an appropriate empty state when nothing matches.

### 8. Filtering

Provide filters for:

- Priority
- Assignee
- Labels

Filters can be combined.

Example:

```text
Priority: High
Assignee: John
Label: frontend
```

Only cards satisfying all active filters should be shown.

### 9. State management

Use React state or `useReducer`.

Do not mutate the board directly.

For example, moving a card should produce a new state rather than modifying:

```ts
column.cardIds
```

in place.

### 10. Persistence

Persist the board to `localStorage`.

The board should be restored after refreshing the page.

Support:

```text
[Reset Board]
```

which restores the initial board.

### 11. Undo / Redo

Implement:

```text
[Undo] [Redo]
```

Undo/redo should work for:

- Add/delete card
- Edit card
- Move card
- Reorder cards
- Add/delete column
- Rename column
- Reorder columns

Keyboard shortcuts:

```text
Ctrl/Cmd + Z      Undo
Ctrl/Cmd + Shift + Z
Ctrl/Cmd + Y      Redo
```

### 12. Card counts

Display the number of cards in each column:

```text
In Progress (4)
```

The count should reflect the actual cards in that column.

### 13. WIP limit

Allow a column to optionally specify:

```ts
type Column = {
  id: string
  title: string
  cardIds: string[]
  wipLimit?: number
}
```

If the column reaches its limit:

```text
In Progress (3/3)
```

Do not allow another card to be moved into that column.

Clearly indicate that the column is at capacity.

### 14. Accessibility

- Keyboard-accessible buttons and controls
- Accessible labels for icon-only actions
- Cards should be keyboard focusable
- Drag/drop should not be the only way to move cards
- Modal should trap focus appropriately
- Escape should close modals/dropdowns

### 15. Responsive behavior

Desktop:

```text
Column  Column  Column  Column
```

Mobile:

```text
Column
  ↓
Column
  ↓
Column
```

Columns should remain usable on smaller screens.

### 16. Expected API

Create a reusable component:

```tsx
<KanbanBoard
  initialBoard={initialBoard}
  onChange={(board) => {
    console.log(board)
  }}
/>
```

### 17. Sample data

```ts
const initialBoard: BoardState = {
  columns: [
    {
      id: 'todo',
      title: 'Todo',
      cardIds: ['1', '2'],
      wipLimit: 5,
    },
    {
      id: 'progress',
      title: 'In Progress',
      cardIds: ['3'],
      wipLimit: 3,
    },
    {
      id: 'review',
      title: 'Review',
      cardIds: ['4'],
    },
    {
      id: 'done',
      title: 'Done',
      cardIds: ['5'],
    },
  ],

  cards: {
    '1': {
      id: '1',
      title: 'Build login page',
      description: 'Implement authentication UI',
      assignee: 'John',
      priority: 'high',
      labels: ['frontend'],
    },

    '2': {
      id: '2',
      title: 'Add validation',
      assignee: 'Sarah',
      priority: 'medium',
      labels: ['frontend', 'forms'],
    },

    '3': {
      id: '3',
      title: 'Create API',
      assignee: 'Mike',
      priority: 'high',
      labels: ['backend'],
    },

    '4': {
      id: '4',
      title: 'Code review',
      assignee: 'John',
      priority: 'medium',
      labels: ['review'],
    },

    '5': {
      id: '5',
      title: 'Deploy application',
      priority: 'low',
      labels: ['devops'],
    },
  },
}
```

### Constraints

- React + TypeScript
- No Kanban/drag-and-drop libraries
- Native HTML5 drag/drop or pointer events
- Immutable state updates
- No backend required
- Persist to `localStorage`
- Support at least 100 cards
- Keep board, column, card, modal, filtering, and drag/drop logic reasonably separated

### Bonus

Add **optimistic async persistence**:

```ts
onSave?: (board: BoardState) => Promise<void>;
```

Show:

```text
Saving...
Saved
Failed to save
```

and preserve the user's changes if persistence fails.
