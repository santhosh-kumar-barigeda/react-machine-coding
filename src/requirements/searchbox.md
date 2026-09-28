# React Machine Coding — Search Box / Autocomplete

Build a reusable **SearchBox component** in React that supports asynchronous search suggestions.

### Requirements

Create a `<SearchBox />` component with the following functionality:

1. Display an input field with a configurable placeholder.

2. As the user types, show matching suggestions in a dropdown.

3. Suggestions should be fetched asynchronously through a `search` function:

```tsx
const search = async (query: string) => {
  // API call
  return results
}
```

4. Do not make an API request for every keystroke. Implement **debouncing** with a configurable delay:

```tsx
<SearchBox search={search} debounceMs={300} />
```

5. Do not search when:

   - The query is empty.
   - The query contains only whitespace.

6. Display a loading state while suggestions are being fetched.

7. Display an appropriate empty state when there are no results:

```text
No results found
```

8. Handle API errors and display:

```text
Something went wrong
```

9. Provide a retry mechanism when a search request fails.

10. Clicking a suggestion should:

    - Select the suggestion.
    - Update the input value.
    - Close the dropdown.
    - Trigger an `onSelect` callback.

11. Support keyboard navigation:

```text
ArrowDown → move to next suggestion
ArrowUp   → move to previous suggestion
Enter     → select highlighted suggestion
Escape    → close dropdown
```

12. Keyboard navigation should wrap around:

```text
ArrowDown on last item → first item
ArrowUp on first item   → last item
```

13. The highlighted suggestion should be visually distinct.

14. Pressing `Enter` when no suggestion is highlighted should not select anything.

15. Clicking outside the search box should close the suggestion dropdown.

16. Highlight the matching portion of the search result.

For example, searching:

```text
rea
```

should display:

```text
React
React Native
Create React App
```

with the matching `rea` portion visually highlighted.

17. Support disabled suggestions:

```tsx
{
  id: '1',
  label: 'React',
  disabled: true
}
```

Disabled suggestions:

- Cannot be selected.
- Should be skipped during keyboard navigation.

18. Support controlled usage:

```tsx
<SearchBox
  value={query}
  onChange={setQuery}
  search={search}
  onSelect={handleSelect}
/>
```

19. Support uncontrolled usage:

```tsx
<SearchBox search={search} onSelect={handleSelect} />
```

20. Support clearing the input with a clear button:

```text
[ React             ] [×]
```

Clicking the clear button should:

- Clear the input.
- Clear suggestions.
- Close the dropdown.

21. Support a configurable minimum query length:

```tsx
<SearchBox minQueryLength={2} />
```

22. Cancel or ignore stale requests.

For example, if the user types:

```text
r
re
rea
react
```

and the `re` request finishes after the `react` request, the old `re` results must **not overwrite** the `react` results.

23. Use appropriate accessibility attributes:

```text
role="combobox"
aria-expanded
aria-controls
aria-autocomplete
aria-activedescendant
role="listbox"
role="option"
aria-selected
aria-disabled
```

24. Pressing `Tab` should allow the user to leave the component normally.

25. Do not use a third-party autocomplete/search library. Use **React, React Hooks, and CSS** only.

### Expected Usage

```tsx
interface User {
  id: number
  name: string
}

const searchUsers = async (query: string): Promise<User[]> => {
  const response = await fetch(`/api/users?q=${query}`)

  return response.json()
}

;<SearchBox<User>
  search={searchUsers}
  debounceMs={300}
  minQueryLength={2}
  placeholder="Search users..."
  getOptionLabel={(user) => user.name}
  getOptionKey={(user) => user.id}
  onSelect={(user) => {
    console.log('Selected:', user)
  }}
/>
```

### Constraints

- Use functional components and React Hooks.
- Use TypeScript generics so the component works with any result type.
- Implement debouncing yourself; do not use a debounce library.
- Prevent stale asynchronous responses from updating the UI.
- Prevent unnecessary API requests.
- Support controlled and uncontrolled input.
- Correctly handle loading, errors, empty results, selection, clearing, keyboard navigation, disabled options, and outside clicks.
- Keep the component reusable and self-contained.
- Do not use external UI/autocomplete libraries.
