# Machine Coding: Virtualized List

Build a **virtualized list component** in React + TypeScript that can efficiently render **100,000+ items** without creating DOM nodes for every item.

### Requirements

1. **Generic component**

```tsx
<VirtualizedList
  items={items}
  itemHeight={50}
  height={500}
  renderItem={(item, index) => (
    <div>
      {index}: {item.name}
    </div>
  )}
  keyExtractor={(item) => item.id}
/>
```

2. **Virtualization**

   - Only render items currently visible in the viewport.
   - Render a small buffer of items above and below the viewport.
   - The total scroll height must represent the complete list.
   - Scrolling should remain smooth with 100,000+ items.

3. **Props**

Support:

```ts
type VirtualizedListProps<T> = {
  items: T[]
  itemHeight: number
  height: number
  overscan?: number
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string
}
```

4. **Scroll calculations**

Calculate:

```text
startIndex
endIndex
visibleItems
offsetY
totalHeight
```

based on:

```text
scrollTop
itemHeight
containerHeight
overscan
```

5. **Rendering strategy**

Use a structure similar to:

```text
Scrollable Container
└── Virtual Content
    └── Visible Items
```

The virtual content should have:

```css
height: totalHeight;
position: relative;
```

Visible items should be positioned using:

```css
position: absolute;
top: offset;
```

6. **Overscan**

If:

```tsx
overscan={5}
```

render approximately 5 additional items before and after the visible range.

This prevents visible blank areas during fast scrolling.

7. **Large datasets**

Test with:

```tsx
const items = Array.from({ length: 100000 }, (_, i) => ({
  id: String(i),
  name: `Item ${i}`,
}))
```

The DOM should contain only a small subset of these items.

8. **Scroll handling**

   - Listen to the container's `scroll` event.
   - Update the visible range efficiently.
   - Avoid unnecessary React renders where possible.
   - Clean up the event listener.

9. **Edge cases**
   Handle:

   - Empty list
   - One item
   - Fewer items than the viewport
   - Very large lists
   - `overscan = 0`
   - `items` changing dynamically

10. **Dynamic data**
    If items are added or removed, the total scroll height and visible range should update correctly.

11. **Performance**

    - Do not use `map()` over all 100,000 items for rendering.
    - Do not create a DOM node for every item.
    - Use stable React keys.
    - Use `requestAnimationFrame` or another appropriate technique if needed to throttle high-frequency scroll updates.

12. **Accessibility**

    - The scroll container should remain keyboard accessible.
    - Preserve meaningful item semantics where appropriate.
    - Do not break focus when scrolling.

### Bonus requirement

Support **variable-height items**.

Instead of assuming:

```tsx
itemHeight={50}
```

allow items to have different heights and maintain a height/offset measurement cache.

The goal is to implement the **fixed-height virtualization first**, then extend it to variable heights.
