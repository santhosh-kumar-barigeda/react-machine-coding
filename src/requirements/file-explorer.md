# Machine Coding: File Explorer

Build a **recursive File Explorer component** in React + TypeScript, similar to the file tree in VS Code.

### Requirements

1. **File structure**

Support files and folders:

```ts
type FileNode = {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
}
```

2. **Tree rendering**

   - Render folders and files recursively.
   - Folders can be expanded/collapsed.
   - Files should not have an expand/collapse control.
   - Support unlimited nesting.

Example:

```text
📁 src
  📁 components
    📄 Button.tsx
    📄 Modal.tsx
  📁 pages
    📄 Home.tsx
  📄 App.tsx
📄 package.json
📄 README.md
```

3. **Expand / collapse**

   - Clicking a folder toggles its expanded state.
   - Maintain expansion independently for each folder.
   - Add an expand/collapse icon.
   - All folders should initially be collapsed unless configured otherwise.

4. **Selection**

   - Clicking a file or folder selects it.
   - Only one node can be selected at a time.
   - Visually highlight the selected node.
   - Expose:

```tsx
onSelect={(node) => {}}
```

5. **Create**

Provide actions to create:

- New file
- New folder

Example:

```text
src/
  [New File]
  [New Folder]
```

The new node should be inserted into the currently selected folder.

6. **Rename**

   - Allow renaming files and folders.
   - Replace the node name with an input.
   - Enter → save.
   - Escape → cancel.
   - Do not allow an empty name.

7. **Delete**

   - Allow deleting files and folders.
   - Deleting a folder removes its entire subtree.
   - Ask for confirmation before deletion.

8. **Context menu**

Right-clicking a node should display:

```text
New File
New Folder
Rename
Delete
```

The menu should:

- Open at the mouse position.
- Close when clicking elsewhere.
- Close when pressing Escape.
- Operate on the node that was right-clicked.

9. **Drag and drop**

Support moving nodes:

```text
📁 src
📁 components
```

Dragging `Button.tsx` into `components` should move it there.

Rules:

- Files can be moved into folders.
- Folders can be moved into other folders.
- A folder cannot be moved inside itself or any of its descendants.
- Update the tree immutably.
- Show a visual drop indicator.

10. **Keyboard navigation**

Support:

- `ArrowUp` → previous visible node
- `ArrowDown` → next visible node
- `ArrowRight` → expand folder
- `ArrowLeft` → collapse folder / move to parent
- `Enter` → select/open
- `F2` → rename
- `Delete` → delete selected node

11. **Search**

Add a search input:

```text
Search files...
```

Requirements:

- Filter nodes by name.
- Matching files/folders should be displayed.
- Automatically expand ancestors of matching nodes.
- Highlight the matching text.
- Clearing search restores the normal tree.

12. **Controlled / uncontrolled expansion**

Support:

```tsx
<FileExplorer data={fileTree} defaultExpandedIds={['src', 'components']} />
```

and optionally:

```tsx
<FileExplorer
  data={fileTree}
  expandedIds={expandedIds}
  onExpandedChange={setExpandedIds}
/>
```

13. **Callbacks**

Expose:

```ts
onSelect?: (node: FileNode) => void;
onCreate?: (parentId: string | null, node: FileNode) => void;
onRename?: (nodeId: string, newName: string) => void;
onDelete?: (nodeId: string) => void;
onMove?: (nodeId: string, targetFolderId: string) => void;
```

14. **Accessibility**

- Use semantic interactive elements.
- Support keyboard navigation.
- Provide accessible labels for icon-only buttons.
- Use appropriate tree semantics where practical:

  - `role="tree"`
  - `role="treeitem"`
  - `aria-expanded`
  - `aria-selected`

15. **Performance**

The component should work with a tree containing thousands of nodes.

Avoid:

- Mutating the original tree.
- Re-rendering unrelated branches unnecessarily.
- Performing a full-tree traversal on every simple UI interaction when it can be avoided.

### Sample data

```tsx
const fileTree: FileNode[] = [
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
          {
            id: '3',
            name: 'Button.tsx',
            type: 'file',
          },
          {
            id: '4',
            name: 'Modal.tsx',
            type: 'file',
          },
        ],
      },
      {
        id: '5',
        name: 'App.tsx',
        type: 'file',
      },
    ],
  },
  {
    id: '6',
    name: 'package.json',
    type: 'file',
  },
  {
    id: '7',
    name: 'README.md',
    type: 'file',
  },
]
```

### Expected API

```tsx
<FileExplorer
  data={fileTree}
  defaultExpandedIds={['1']}
  onSelect={(node) => console.log(node)}
  onRename={(id, name) => {}}
  onDelete={(id) => {}}
  onMove={(id, targetId) => {}}
/>
```

### Constraints

- React + TypeScript
- No external tree/file-explorer library
- Recursive rendering
- Immutable tree updates
- Unlimited nesting
- Implement expand/collapse, selection, CRUD, search, context menu, drag/drop, and keyboard navigation
- Keep the UI simple; correctness and state management are the priority.
