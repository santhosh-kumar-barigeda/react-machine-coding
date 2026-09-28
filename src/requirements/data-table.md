# Machine Coding: Data Table

Build a **reusable Data Table component** in React + TypeScript that supports sorting, filtering, pagination, row selection, column customization, and inline editing.

### 1. Generic API

The table should be generic and support different data types.

```tsx
<DataTable<User> data={users} columns={columns} rowKey={(user) => user.id} />
```

Define:

```ts
type Column<T> = {
  id: string
  header: string
  accessor?: keyof T
  render?: (value: unknown, row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: number
}
```

### 2. Basic rendering

Render:

```text
┌──────────────────────────────────────────────────────────────┐
│ Name        Email              Role        Status             │
├──────────────────────────────────────────────────────────────┤
│ John        john@test.com      Admin       Active             │
│ Sarah       sarah@test.com     User        Active             │
│ Mike        mike@test.com      User        Inactive           │
└──────────────────────────────────────────────────────────────┘
```

Requirements:

- Header row
- Data rows
- Empty state
- Loading state
- Error state
- Custom cell rendering

### 3. Sorting

Sortable columns should support:

```text
Name ↑
Name ↓
Name
```

Clicking the column header cycles through:

```text
unsorted → ascending → descending → unsorted
```

Only one column needs to be sorted at a time.

Expose:

```ts
onSortChange?: (sort: SortState | null) => void;

type SortState = {
  columnId: string;
  direction: "asc" | "desc";
};
```

### 4. Filtering

Support column-level filtering.

Example:

```text
Name
[Search...]

Role
[All ▼]

Status
[Active ▼]
```

Filtering should be applied before pagination.

Support:

- Text filtering
- Select filtering
- Case-insensitive matching

Columns should be able to define their own filter behavior.

### 5. Global search

Add:

```text
🔍 Search users...
```

The global search should search across configured searchable columns.

Example:

```tsx
<DataTable searchable searchPlaceholder="Search users..." />
```

Debounce the search input by approximately 300ms.

### 6. Pagination

Support:

```text
Rows per page: [10 ▼]

< 1  2  3  4  5 >
```

Display:

```text
Showing 21–30 of 147
```

Requirements:

- Configurable page size
- Previous/next
- First/last page
- Disable controls at boundaries
- Reset to page 1 when filters change

### 7. Row selection

Support:

- Select individual row
- Select all visible rows
- Indeterminate checkbox state
- Clear selection

Example:

```text
☑  Name       Email
☑  John       john@test.com
☐  Sarah      sarah@test.com
☑  Mike       mike@test.com

2 rows selected
```

Expose:

```ts
selectedRowIds: Set<string>;

onSelectionChange?: (ids: Set<string>) => void;
```

Support both controlled and uncontrolled selection.

### 8. Bulk actions

When rows are selected, show:

```text
2 selected    [Delete] [Activate] [Deactivate]
```

Provide:

```ts
bulkActions?: BulkAction<T>[];

type BulkAction<T> = {
  id: string;
  label: string;
  onClick: (rows: T[]) => void;
};
```

### 9. Row actions

Allow custom actions per row:

```text
John    john@test.com    [Edit] [Delete] [⋮]
```

Example:

```tsx
rowActions={(row) => [
  {
    label: "Edit",
    onClick: () => editUser(row),
  },
  {
    label: "Delete",
    onClick: () => deleteUser(row),
  },
]}
```

### 10. Inline editing

Allow editable columns.

Clicking a cell should turn it into an input:

```text
John
↓
[John____________]
```

Support:

- Enter → save
- Escape → cancel
- Blur → save
- Validation errors

Expose:

```ts
onCellEdit?: (
  row: T,
  columnId: string,
  value: unknown
) => void | Promise<void>;
```

### 11. Column visibility

Provide a column settings menu:

```text
Columns

☑ Name
☑ Email
☑ Role
☐ Phone
☑ Status
```

Users can hide/show columns.

Do not allow the table to render with zero visible columns.

### 12. Column resizing

Allow users to resize columns by dragging the boundary between headers.

```text
Name          | Email                 | Status
              ↑
          resize handle
```

Requirements:

- Minimum column width
- Preserve widths while interacting with the table
- Avoid accidental sorting when dragging the resize handle

### 13. Row expansion

Allow expandable rows.

Example:

```text
▶ John     john@test.com     Admin
```

After clicking:

```text
▼ John     john@test.com     Admin
  ┌─────────────────────────────────────┐
  │ Department: Engineering             │
  │ Joined: January 2025                │
  │ Last login: Today                   │
  └─────────────────────────────────────┘
```

Expose:

```ts
renderExpandedRow?: (row: T) => React.ReactNode;
```

### 14. Loading state

Support:

```tsx
<DataTable loading data={[]} columns={columns} />
```

Display skeleton rows rather than an empty state while loading.

### 15. Server-side mode

Support optional server-side operations:

```tsx
<DataTable
  data={data}
  serverSide
  totalRows={10000}
  loading={loading}
  onQueryChange={(query) => fetchUsers(query)}
/>
```

Query should contain:

```ts
type TableQuery = {
  page: number
  pageSize: number
  search: string
  sort: SortState | null
  filters: Record<string, unknown>
}
```

In server-side mode:

- Do not sort locally
- Do not filter locally
- Do not paginate locally
- Notify the parent whenever the query changes

### 16. Sticky header

Support:

```tsx
stickyHeader
```

The header should remain visible while scrolling vertically.

### 17. Horizontal scrolling

If columns exceed the available width:

- Enable horizontal scrolling.
- Do not shrink columns below their minimum width.
- Keep the header aligned with the body.

### 18. Accessibility

Use semantic table elements:

```html
<table>
  <thead></thead>
  <tbody>
    <tr>
      <th></th>
      <td></td>
    </tr>
  </tbody>
</table>
```

Support:

- Keyboard-accessible controls
- Proper checkbox labels
- `aria-sort`
- Accessible pagination controls
- Accessible loading/error states
- Focus management for inline editing

### 19. Performance

The table should support **10,000+ rows**.

Do not:

- Re-render every row unnecessarily
- Recalculate expensive filtering/sorting on every keystroke
- Create unnecessary objects/functions during every render

Use appropriate techniques such as:

- `useMemo`
- `useCallback`
- `React.memo`

### 20. Virtualization

Add optional:

```tsx
virtualized
rowHeight={48}
```

When enabled, only visible rows should be rendered.

The table should continue supporting:

- Selection
- Sorting
- Filtering
- Expansion
- Inline editing

with virtualization enabled.

### 21. Controlled state

Support controlled state for:

```ts
sort
filters
page
pageSize
selectedRowIds
visibleColumns
expandedRowIds
```

For example:

```tsx
<DataTable
  sort={sort}
  onSortChange={setSort}
  selectedRowIds={selectedRows}
  onSelectionChange={setSelectedRows}
/>
```

### 22. Expected API

```tsx
<DataTable<User>
  data={users}
  columns={[
    {
      id: 'name',
      header: 'Name',
      accessor: 'name',
      sortable: true,
      filterable: true,
    },
    {
      id: 'email',
      header: 'Email',
      accessor: 'email',
      sortable: true,
    },
    {
      id: 'role',
      header: 'Role',
      accessor: 'role',
      filterable: true,
    },
    {
      id: 'status',
      header: 'Status',
      render: (_, user) => <StatusBadge status={user.status} />,
    },
  ]}
  rowKey={(user) => user.id}
  searchable
  pagination
  selectable
  stickyHeader
  onSelectionChange={(ids) => {}}
/>
```

### 23. Sample data

```ts
type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
}

const users: User[] = [
  {
    id: '1',
    name: 'John',
    email: 'john@test.com',
    role: 'admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'Sarah',
    email: 'sarah@test.com',
    role: 'user',
    status: 'active',
  },
  {
    id: '3',
    name: 'Mike',
    email: 'mike@test.com',
    role: 'user',
    status: 'inactive',
  },
]
```

### Constraints

- React + TypeScript
- No table/grid library
- No external state-management library
- No mutation of input data
- Reusable generic component
- Support client-side and server-side modes
- Keep sorting, filtering, pagination, selection, and virtualization modular

### Bonus

Add **column drag-and-drop reordering**:

```text
Name | Email | Role | Status
 ↓
Name | Role | Email | Status
```

Persist column order, visibility, and widths to `localStorage`.
