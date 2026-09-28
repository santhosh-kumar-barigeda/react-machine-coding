# Machine Coding: Nested Comments System

Build a **recursive nested comments component** in React + TypeScript.

### Requirements

1. **Comment structure**

   ```ts
   type Comment = {
     id: string
     author: string
     text: string
     createdAt: string
     replies: Comment[]
   }
   ```

2. **Nested replies**

   - Comments can have unlimited nesting depth.
   - Each comment can contain any number of replies.
   - Render the tree recursively.

3. **Comment actions**
   Each comment should support:

   - Reply
   - Edit
   - Delete
   - Collapse/expand replies

4. **Add reply**

   - Clicking **Reply** opens an inline input.
   - Submit creates a new child comment under the current comment.
   - Cancel closes the reply input.
   - Empty replies should not be submitted.

5. **Edit**

   - Clicking **Edit** converts the comment text into an input/textarea.
   - Save updates the comment.
   - Cancel restores the previous value.
   - Empty text should not be saved.

6. **Delete**

   - Delete removes the comment and its entire subtree.
   - Ask for confirmation before deleting.

7. **Collapse/expand**

   - Comments with replies should have a collapse/expand control.
   - Collapsing hides all descendants.
   - Each comment maintains its own expanded state.

8. **State management**

   - Use React state only; no external state-management library.
   - Keep the comment data as a single tree.
   - Updates should correctly modify deeply nested comments without mutating existing state.

9. **Recursive component**
   Create something similar to:

   ```tsx
   <CommentItem
     comment={comment}
     onReply={...}
     onEdit={...}
     onDelete={...}
   />
   ```

10. **Performance**

    - Avoid unnecessary traversal of the entire tree when possible.
    - Use stable keys.
    - The solution should work with hundreds of nested comments.

11. **Accessibility**

    - Buttons must have accessible labels.
    - Reply/edit inputs should support keyboard interaction.
    - Use semantic buttons instead of clickable `<div>` elements.

12. **UI**

    - Indent nested replies visually.
    - Show:

      - author
      - timestamp
      - comment text
      - Reply / Edit / Delete controls
      - collapse/expand control where applicable

    - Keep styling simple; functionality is more important.

### Sample data

```tsx
const initialComments: Comment[] = [
  {
    id: '1',
    author: 'Alice',
    text: 'This is the first comment.',
    createdAt: '2 hours ago',
    replies: [
      {
        id: '2',
        author: 'Bob',
        text: 'I agree with you.',
        createdAt: '1 hour ago',
        replies: [
          {
            id: '3',
            author: 'Charlie',
            text: 'Same here!',
            createdAt: '30 minutes ago',
            replies: [],
          },
        ],
      },
    ],
  },
]
```

### Expected behavior

```text
Alice
This is the first comment.
[Reply] [Edit] [Delete] [-]

  Bob
  I agree with you.
  [Reply] [Edit] [Delete] [-]

    Charlie
    Same here!
    [Reply] [Edit] [Delete]

  [Reply input...]

[Add Comment]
```

### Constraints

- React + TypeScript
- No external comment/tree libraries
- No mutation of the existing comment tree
- Unlimited nesting depth
- Component should be reusable with different initial comment data
