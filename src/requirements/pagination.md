# React Machine Coding — Pagination Component

Build a reusable **Pagination component** in React.

### Requirements

Create a `<Pagination />` component with the following functionality:

1. Accept the total number of items and the number of items displayed per page:

   ```tsx
   <Pagination totalItems={100} itemsPerPage={10} />
   ```

2. Calculate and display the total number of pages automatically.

3. Display pagination controls:

   - Previous button
   - Page numbers
   - Next button

4. The current page should be visually highlighted.

5. Clicking a page number should navigate to that page.

6. Clicking **Previous** should navigate to the previous page.

7. Clicking **Next** should navigate to the next page.

8. Disable **Previous** on the first page.

9. Disable **Next** on the last page.

10. Support a configurable number of visible page buttons:

    ```tsx
    <Pagination totalItems={100} itemsPerPage={10} visiblePages={5} />
    ```

11. When there are more pages than `visiblePages`, use ellipses (`...`) appropriately.

    For example:

    ```text
    1 2 3 4 5 ... 20
    ```

    or:

    ```text
    1 ... 8 9 10 11 12 ... 20
    ```

12. The pagination should always display the first and last page when ellipses are being used.

13. Support controlled usage:

    ```tsx
    <Pagination
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      totalItems={100}
      itemsPerPage={10}
    />
    ```

14. Support uncontrolled usage:

    ```tsx
    <Pagination totalItems={100} itemsPerPage={10} defaultPage={1} />
    ```

15. Support changing the number of items per page:

    ```tsx
    <Pagination
      totalItems={100}
      itemsPerPage={10}
      onItemsPerPageChange={setItemsPerPage}
    />
    ```

16. When `itemsPerPage` changes, reset the current page to `1`.

17. Expose the current pagination information through `onChange`:

    ```tsx
    onChange={(page) => {
      console.log(page)
    }}
    ```

18. Display the current range of items:

    ```text
    Showing 21–30 of 100
    ```

19. Handle edge cases correctly:

    - `totalItems = 0`
    - `totalItems < itemsPerPage`
    - `itemsPerPage > totalItems`
    - `currentPage` exceeding the total number of pages
    - Invalid or non-positive values

20. Support keyboard accessibility:

    - `ArrowLeft` → previous page
    - `ArrowRight` → next page
    - `Home` → first page
    - `End` → last page
    - `Enter` / `Space` → activate the focused page

21. Use appropriate accessibility attributes:

    - `aria-label`
    - `aria-current="page"`
    - `aria-disabled`
    - Appropriate button semantics

22. Do not use a third-party pagination/UI library. Use **React and CSS** only.

### Expected Usage

```tsx
const [currentPage, setCurrentPage] = useState(1)
const [itemsPerPage, setItemsPerPage] = useState(10)

<Pagination
  totalItems={250}
  currentPage={currentPage}
  itemsPerPage={itemsPerPage}
  visiblePages={5}
  onPageChange={setCurrentPage}
  onItemsPerPageChange={setItemsPerPage}
  onChange={(page) => {
    console.log('Current page:', page)
  }}
/>
```

### Constraints

- Use functional components and React hooks.
- Keep the component reusable and self-contained.
- Do not use external UI/component libraries.
- Support both controlled and uncontrolled usage.
- Do not hardcode the number of pages.
- Generate the page-number/ellipsis sequence dynamically.
- Correctly handle navigation, ellipses, page boundaries, page-size changes, keyboard interaction, accessibility, and edge cases.
- The component should work with any number of items and any reasonable `itemsPerPage` value.
