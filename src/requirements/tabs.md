# React Machine Coding — Tabs Component

Build a reusable **Tabs component** in React.

### Requirements

Create a `<Tabs />` component with the following functionality:

1. Accept a list of tabs. Each tab should contain:

   - `id`
   - `label`
   - `content`
   - Optional `disabled` property

2. Display the tab labels in a tab list.

3. Clicking a tab should display its corresponding content.

4. Only **one tab** can be active at a time.

5. Support controlled usage:

   ```tsx
   <Tabs activeTab={activeTab} onChange={setActiveTab} />
   ```

6. Support uncontrolled usage:

   ```tsx
   <Tabs defaultActiveTab="profile" />
   ```

7. If `defaultActiveTab` is not provided, automatically select the first non-disabled tab.

8. Disabled tabs:

   - Cannot be selected.
   - Cannot receive keyboard focus.
   - Must have a visually distinct disabled state.

9. Support keyboard navigation:

   - `ArrowRight` → move focus to the next enabled tab
   - `ArrowLeft` → move focus to the previous enabled tab
   - `Home` → focus the first enabled tab
   - `End` → focus the last enabled tab
   - `Enter` → activate the focused tab
   - `Space` → activate the focused tab

10. Keyboard navigation should **wrap around**:

    - `ArrowRight` on the last tab → first enabled tab
    - `ArrowLeft` on the first tab → last enabled tab

11. Use proper accessibility attributes:

    - `role="tablist"`
    - `role="tab"`
    - `role="tabpanel"`
    - `aria-selected`
    - `aria-controls`
    - `aria-labelledby`
    - `tabIndex`

12. Only the active tab panel should be visible.

13. Add a visual indicator for the active tab.

14. Support an `onChange` callback:

    ```tsx
    onChange={(tabId) => console.log(tabId)}
    ```

15. Support a configurable tab orientation:

    ```tsx
    <Tabs orientation="horizontal" />
    <Tabs orientation="vertical" />
    ```

16. For vertical tabs:

    - `ArrowDown` → next enabled tab
    - `ArrowUp` → previous enabled tab
    - `Home` → first enabled tab
    - `End` → last enabled tab

17. Handle an empty tabs array without crashing.

18. Do not use a third-party tabs/UI library. Use **React and CSS** only.

### Expected Usage

```tsx
const tabs = [
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
```

```tsx
<Tabs
  tabs={tabs}
  defaultActiveTab="overview"
  orientation="horizontal"
  onChange={(tabId) => console.log(tabId)}
/>
```

### Constraints

- Use functional components and React hooks.
- Keep the component reusable and self-contained.
- Do not use external UI/component libraries.
- Support both controlled and uncontrolled usage.
- Correctly handle disabled tabs, keyboard navigation, focus management, accessibility, orientation, and active-tab state.
- The implementation should work with any number of tabs.
