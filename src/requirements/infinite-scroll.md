# React Machine Coding — Infinite Scroll Component

Build a reusable **Infinite Scroll component** in React.

### Requirements

Create an `<InfiniteScroll />` component that loads additional data automatically as the user approaches the bottom of the scrollable area.

1. Accept an asynchronous `loadMore` function:

   ```tsx
   <InfiniteScroll loadMore={loadMore}>
     {items.map(...)}
   </InfiniteScroll>
   ```

2. `loadMore` should return the next batch of items and whether more data is available:

   ```tsx
   const loadMore = async () => {
     const response = await fetch(...)

     return {
       items: response.items,
       hasMore: response.hasMore,
     }
   }
   ```

3. Automatically call `loadMore` when the user reaches or approaches the bottom of the container.

4. Use **`IntersectionObserver`** to detect when more data should be loaded. Do not rely on a `scroll` event for the primary implementation.

5. Display a loading indicator while additional data is being fetched:

   ```text
   Loading...
   ```

6. Prevent multiple `loadMore` requests from running simultaneously.

7. Continue loading data until:

   ```ts
   hasMore === false
   ```

8. When there is no more data, display:

   ```text
   No more items
   ```

9. Handle API failures:

   - Display an error message.
   - Provide a **Retry** button.
   - Retrying should request the failed batch again without duplicating already loaded items.

10. Support an initial loading state when the component loads its first batch.

11. Support an optional `initialItems` prop so the component can start with already-loaded data:

    ```tsx
    <InfiniteScroll initialItems={initialItems} loadMore={loadMore} />
    ```

12. Support a configurable loading threshold:

    ```tsx
    <InfiniteScroll loadMore={loadMore} threshold="300px" />
    ```

    The next batch should begin loading when the sentinel is approximately 300px from entering the viewport.

13. Support both:

    - The browser viewport as the scroll container.
    - A fixed-height internal scroll container.

    Example:

    ```tsx
    <InfiniteScroll loadMore={loadMore} height={500} />
    ```

14. When `height` is provided, only the internal container should scroll.

15. Preserve already-loaded items while new items are being fetched.

16. Handle rapid scrolling correctly without:

    - Duplicate requests
    - Duplicate items
    - Skipping batches
    - Multiple simultaneous loads

17. Handle an empty result correctly:

    ```ts
    {
      items: [],
      hasMore: false
    }
    ```

18. If the initial content does not fill the viewport/container and the sentinel is already visible, automatically continue loading until:

    - The content is large enough to move the sentinel out of view, or
    - `hasMore === false`.

19. Clean up the `IntersectionObserver` when the component unmounts.

20. Handle component unmounting while `loadMore` is still pending without attempting to update unmounted state.

21. Support a `renderItem` function:

    ```tsx
    <InfiniteScroll
      loadMore={loadMore}
      renderItem={(item) => <UserCard user={item} />}
    />
    ```

22. Support an optional `keyExtractor`:

    ```tsx
    keyExtractor={(item) => item.id}
    ```

23. Expose callbacks:

    ```tsx
    onLoadStart={() => {}}
    onLoadSuccess={(items) => {}}
    onLoadError={(error) => {}}
    onEnd={() => {}}
    ```

24. Use accessible loading and status messaging:

    - Loading state should use `aria-live`.
    - Error messages should be accessible.
    - The retry action should be a keyboard-accessible button.

25. Do not use a third-party infinite-scroll library. Use **React, React Hooks, IntersectionObserver, and CSS** only.

### Expected Usage

```tsx
const loadMore = async () => {
  const response = await fetch(`/api/users?page=${page}`)

  const data = await response.json()

  return {
    items: data.users,
    hasMore: data.hasMore,
  }
}
```

```tsx
<InfiniteScroll
  loadMore={loadMore}
  threshold="300px"
  renderItem={(user) => <UserCard user={user} />}
  keyExtractor={(user) => user.id}
  onLoadStart={() => console.log('Loading...')}
  onLoadSuccess={(items) => console.log('Loaded:', items)}
  onLoadError={(error) => console.error(error)}
  onEnd={() => console.log('No more items')}
/>
```

### Constraints

- Use functional components and React Hooks.
- Use `IntersectionObserver` for detecting when to load more.
- Do not use a third-party infinite-scroll library.
- Prevent concurrent requests.
- Do not duplicate or lose items.
- Correctly handle loading, errors, retries, empty results, and the end of the list.
- Support both viewport scrolling and an internal scroll container.
- Clean up observers and pending async work appropriately.
- The component should be reusable with any item type using TypeScript generics.
