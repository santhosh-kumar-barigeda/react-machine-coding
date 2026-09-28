# React Machine Coding — Star Rating Component

Build a reusable **Star Rating component** in React.

### Requirements

Create a `<StarRating />` component with the following functionality:

1. Display **5 stars** by default.
2. Allow the user to select a rating by clicking on a star.
3. On hover, visually preview the rating that would be selected.
4. When the mouse leaves the component, restore the previously selected rating.
5. Display the selected rating as text, for example:

   ```
   Rating: 4/5
   ```

6. The component must support a configurable maximum rating:

   ```jsx
   <StarRating maxRating={10} />
   ```

7. The component must support a `readOnly` prop:

   ```jsx
   <StarRating readOnly />
   ```

   When `readOnly` is `true`, the user should not be able to change or preview the rating.

8. The component must expose an `onChange` callback:

   ```jsx
   <StarRating onChange={(rating) => console.log(rating)} />
   ```

9. The component must support controlled usage:

   ```jsx
   <StarRating value={rating} onChange={setRating} />
   ```

10. The component must support **half-star ratings**, allowing values such as `3.5`.
11. Users must be able to interact with the component using the keyboard:

    - `ArrowRight` → increase the rating by `0.5`
    - `ArrowLeft` → decrease the rating by `0.5`
    - `Enter` → select the highlighted rating

12. The component should be accessible using appropriate **ARIA attributes**.
13. Allow customization of the star's size and color through props.
14. Do not use a third-party star-rating component or library. Use **React and CSS** to implement the functionality.

### Expected Usage

```jsx
<StarRating
  value={rating}
  maxRating={5}
  onChange={setRating}
  readOnly={false}
  size={32}
  color="gold"
/>
```

### Constraints

- Use functional components and React hooks.
- Keep the component reusable and self-contained.
- Do not use external UI/component libraries.
- Handle hover, click, keyboard interaction, controlled state, read-only state, and half-star rendering correctly.
- The implementation should work for any `maxRating` value greater than `0`.
