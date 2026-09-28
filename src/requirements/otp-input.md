# React Machine Coding — OTP Input

Build a reusable **OTP Input component** in React.

### Requirements

Create an `<OtpInput />` component with the following functionality:

1. Render **6 input boxes** by default.

2. Support a configurable OTP length:

   ```tsx
   <OtpInput length={4} />
   ```

3. Each input should accept **only one numeric digit**.

4. Automatically move focus to the **next input** after entering a digit.

5. Pressing `Backspace` should:

   - Clear the current digit if it contains one.
   - If the current input is empty, move focus to the previous input and clear it.

6. Support keyboard navigation:

   - `ArrowLeft` → previous input
   - `ArrowRight` → next input
   - `Home` → first input
   - `End` → last input

7. Support **paste** functionality.

   If the user pastes:

   ```text
   123456
   ```

   the component should populate:

   ```text
   [1] [2] [3] [4] [5] [6]
   ```

8. If the pasted value contains non-numeric characters, ignore the non-numeric characters.

9. If the pasted value contains more digits than the OTP length, only use the required number of digits.

10. Support controlled usage:

```tsx
<OtpInput value={otp} onChange={setOtp} />
```

11. Support uncontrolled usage:

```tsx
<OtpInput defaultValue="123456" />
```

12. Expose an `onComplete` callback that fires when all OTP fields are filled:

```tsx
<OtpInput
  onComplete={(otp) => {
    console.log('OTP:', otp)
  }}
/>
```

13. `onComplete` should only fire when the OTP becomes complete, not on every subsequent render.

14. If the user edits a completed OTP, the component should allow the OTP to become incomplete and then call `onComplete` again when it becomes complete.

15. Support a `disabled` prop:

```tsx
<OtpInput disabled />
```

When disabled:

- Inputs cannot be edited.
- Inputs cannot receive focus.
- Paste should not work.

16. Support an `error` prop:

```tsx
<OtpInput error />
```

When `error` is true, display the inputs in an error state.

17. Support an error message:

```tsx
<OtpInput error errorMessage="Invalid OTP" />
```

18. Support a configurable placeholder:

```tsx
<OtpInput placeholder="•" />
```

19. Automatically focus the first input when:

```tsx
autoFocus
```

is provided.

20. When the component receives a new controlled `value`, the individual input boxes should update accordingly.

21. Handle controlled values containing invalid characters by keeping only numeric digits.

22. When the user enters a digit into an already-filled input, replace the existing digit rather than appending to it.

23. Use `inputMode="numeric"` so mobile devices display a numeric keyboard.

24. Use appropriate accessibility attributes:

- `aria-label`
- `aria-invalid`
- `aria-describedby`
- Properly associated error message

25. The component should expose a ref that allows the parent to focus the first OTP input:

```tsx
const otpRef = useRef<...>(null)

otpRef.current?.focus()
```

26. Do not use a third-party OTP/input library. Use **React, React Hooks, and CSS** only.

### Expected Usage

```tsx
const [otp, setOtp] = useState('')

<OtpInput
  length={6}
  value={otp}
  onChange={setOtp}
  onComplete={(otp) => {
    console.log('OTP completed:', otp)
  }}
  autoFocus
  error={false}
  errorMessage="Invalid OTP"
/>
```

### Constraints

- Use functional components and React Hooks.
- Use TypeScript.
- Keep the component reusable and self-contained.
- Do not use a third-party OTP/input library.
- Correctly handle typing, deletion, focus movement, paste, controlled/uncontrolled state, validation, disabled state, error state, and completion.
- The implementation should work with any reasonable OTP length.
- Do not create one large input and visually split it; use **one input element per OTP digit**.
