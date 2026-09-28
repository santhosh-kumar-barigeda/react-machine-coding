# React Machine Coding — Nested Accordion Component

Build a reusable **Accordion component** in React that supports **nested accordions**.

### Requirements

Create an `<Accordion />` component with the following functionality:

1. Display a list of accordion items. Each item should contain:

   - A title
   - Content
   - Optional nested accordion items

2. Clicking an accordion title should:

   - Expand the item if it is closed.
   - Collapse the item if it is open.

3. Only **one item** should be open at a time by default.

4. Support an `allowMultiple` prop:

   ```jsx
   <Accordion allowMultiple />
   ```

   When `allowMultiple` is `true`, multiple items at the same level can be open simultaneously.

5. Support **nested accordion items**:

   ```tsx
   const items = [
     {
       id: '1',
       title: 'Frontend',
       content: 'Frontend development',
       children: [
         {
           id: '1-1',
           title: 'React',
           content: 'React is a JavaScript library.',
           children: [
             {
               id: '1-1-1',
               title: 'Hooks',
               content:
                 'Hooks allow functional components to use React features.',
             },
           ],
         },
       ],
     },
   ]
   ```

   Nested accordions must behave independently from their parent accordion. Opening or closing a nested item must not automatically close its parent or other items at the same level.

6. Support `defaultOpen` on individual items:

   ```tsx
   {
     id: '1',
     title: 'React',
     content: 'React content',
     defaultOpen: true
   }
   ```

7. Support `disabled` on individual items:

   ```tsx
   {
     id: '2',
     title: 'Disabled',
     content: 'Cannot be opened',
     disabled: true
   }
   ```

8. Support controlled usage:

   ```jsx
   <Accordion openItems={openItems} onChange={setOpenItems} />
   ```

9. Support an `onChange` callback that provides the currently open item IDs.

10. Display an expand/collapse indicator such as `+` / `−` or `⌄` / `⌃`.

11. Add a smooth expand/collapse animation using CSS.

12. The component must be keyboard accessible:

    - `Enter` → open/close the focused item
    - `Space` → open/close the focused item
    - `ArrowDown` → move focus to the next accordion item at the current level
    - `ArrowUp` → move focus to the previous accordion item at the current level
    - `Home` → move focus to the first accordion item at the current level
    - `End` → move focus to the last accordion item at the current level

13. Keyboard navigation must respect nesting. For example, `ArrowDown` on a nested accordion item should navigate within that nested accordion level rather than jumping to unrelated parent/sibling items.

14. Use appropriate ARIA attributes:

    - `aria-expanded`
    - `aria-controls`
    - `aria-disabled`
    - `role="region"` where appropriate

15. Ensure each accordion item's trigger has a unique ID so that `aria-controls` correctly references its content region.

16. Support an empty items array without crashing.

17. Do not use a third-party accordion/UI library. Use **React and CSS** only.

### Expected Usage

```tsx
const items = [
  {
    id: 'frontend',
    title: 'Frontend',
    content: 'Frontend development',
    children: [
      {
        id: 'react',
        title: 'React',
        content: 'React is a JavaScript library.',
        children: [
          {
            id: 'hooks',
            title: 'React Hooks',
            content: 'Hooks allow functional components to use React features.',
          },
          {
            id: 'state',
            title: 'React State',
            content: 'State allows components to manage changing data.',
          },
        ],
      },
      {
        id: 'vue',
        title: 'Vue',
        content: 'Vue is a progressive JavaScript framework.',
      },
    ],
  },
  {
    id: 'backend',
    title: 'Backend',
    content: 'Backend development',
    children: [
      {
        id: 'node',
        title: 'Node.js',
        content: 'Node.js is a JavaScript runtime.',
      },
    ],
  },
]
```

```tsx
<Accordion
  items={items}
  allowMultiple={false}
  onChange={(openItems) => console.log(openItems)}
/>
```

### Constraints

- Use functional components and React hooks.
- Keep the component reusable and self-contained.
- Do not use external UI/component libraries.
- Support unlimited nesting depth.
- Each nesting level must maintain its own open/closed state.
- `allowMultiple` applies independently at each nesting level.
- Support both controlled and uncontrolled usage.
- Correctly handle `defaultOpen`, `disabled`, nesting, keyboard navigation, accessibility, and animation.
- The implementation should work with any number of items and any nesting depth.
