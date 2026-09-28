# React Machine Coding — Toast / Notification System

Build a reusable **Toast Notification System** in React.

### Requirements

Create a toast system that allows any component to display temporary notifications.

1. Support the following toast types:

   - `success`
   - `error`
   - `warning`
   - `info`

2. A toast should support:

   ```ts
   {
     id: string
     type: 'success' | 'error' | 'warning' | 'info'
     message: string
     duration?: number
   }
   ```

3. Expose an API that allows components to create toasts:

   ```tsx
   toast.success('Profile updated')
   toast.error('Something went wrong')
   toast.warning('Your session is about to expire')
   toast.info('New notification received')
   ```

4. Display toasts in a dedicated container.

5. Support configurable toast positions:

   ```tsx
   <ToastProvider position="top-right">
     <App />
   </ToastProvider>
   ```

   Supported positions:

   - `top-left`
   - `top-center`
   - `top-right`
   - `bottom-left`
   - `bottom-center`
   - `bottom-right`

6. Toasts should automatically disappear after their `duration`.

7. Support a configurable default duration:

   ```tsx
   <ToastProvider duration={3000}>
     <App />
   </ToastProvider>
   ```

8. A toast-level `duration` should override the provider's default duration.

9. Support persistent toasts:

   ```tsx
   toast.success('File uploaded', {
     duration: 0,
   })
   ```

   A duration of `0` means the toast should remain until manually closed.

10. Each toast must have a close button.

11. Closing a toast manually should immediately remove it and clean up its timer.

12. Support multiple simultaneous toasts.

13. New toasts should be added without replacing existing toasts.

14. Support a maximum number of visible toasts:

```tsx
<ToastProvider maxToasts={3}>
  <App />
</ToastProvider>
```

15. If `maxToasts` is exceeded, remove the oldest visible toast before displaying the new one.

16. Add enter and exit animations using CSS.

17. Toasts should be stacked with appropriate spacing.

18. Toasts should support an optional action:

```tsx
toast.info('New message', {
  action: {
    label: 'View',
    onClick: () => {
      console.log('View clicked')
    },
  },
})
```

19. Clicking the action should execute the callback and close the toast.

20. Support pausing the auto-dismiss timer while the user is hovering over the toast.

21. Resume the remaining timer when the mouse leaves the toast.

22. Support keyboard accessibility:

- Close button must be keyboard accessible.
- `Escape` should close the focused toast.

23. Use appropriate accessibility attributes:

- `role="status"` for informational/success notifications.
- `role="alert"` for error/warning notifications where appropriate.
- `aria-live`
- `aria-label` for the close button.

24. Toast messages should not block interaction with the rest of the application except for their own controls.

25. Expose a hook for creating notifications:

```tsx
const toast = useToast()

toast.success('Saved successfully')
```

26. The toast system should work from deeply nested components without passing toast-related props through the component tree.

27. Support updating an existing toast:

```tsx
toast.update(id, {
  message: 'Upload complete',
  type: 'success',
})
```

28. Support manually dismissing a specific toast:

```tsx
toast.dismiss(id)
```

29. Support dismissing all toasts:

```tsx
toast.dismissAll()
```

30. The system must clean up all timers when:

- A toast is dismissed.
- A toast expires.
- The provider unmounts.

31. Do not use a third-party toast/notification library. Use **React, React Context, React Hooks, timers, and CSS** only.

### Expected Usage

```tsx
function App() {
  return (
    <ToastProvider position="top-right" duration={4000} maxToasts={5}>
      <Dashboard />
    </ToastProvider>
  )
}
```

```tsx
function Dashboard() {
  const toast = useToast()

  const handleSave = async () => {
    try {
      await saveProfile()

      toast.success('Profile saved successfully')
    } catch {
      toast.error('Failed to save profile', {
        duration: 5000,
      })
    }
  }

  return <button onClick={handleSave}>Save</button>
}
```

### Constraints

- Use functional components and React Hooks.
- Use React Context for global toast access.
- Keep the implementation reusable and self-contained.
- Support multiple simultaneous toasts.
- Correctly handle timers, cleanup, pause/resume, animations, actions, updates, and dismissal.
- Avoid unnecessary re-renders.
- Do not use external toast/notification libraries.
- The implementation should work when `toast()` is called from deeply nested components.
