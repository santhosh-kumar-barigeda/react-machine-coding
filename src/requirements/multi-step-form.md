# Machine Coding: Multi-Step Form

Build a **reusable Multi-Step Form / Wizard** in React + TypeScript.

### 1. Form structure

Support multiple steps with independent fields:

```ts
type Step = {
  id: string
  title: string
  description?: string
  fields: Field[]
}

type Field = {
  id: string
  name: string
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'date'
  label: string
  required?: boolean
  options?: string[]
}
```

Example:

```text
Step 1: Personal Information
  Name
  Email
  Date of Birth

Step 2: Address
  Country
  City
  ZIP Code

Step 3: Preferences
  Newsletter
  Notification Preference

Step 4: Review
  Show all entered values
```

### 2. Step navigation

Provide:

```text
[1 Personal] → [2 Address] → [3 Preferences] → [4 Review]
```

Buttons:

```text
[Back]                         [Next]
```

On the final step:

```text
[Back]                         [Submit]
```

Requirements:

- Back moves to the previous step.
- Next moves to the next step.
- Back should preserve entered values.
- Users should not lose data when navigating between steps.

### 3. Validation

Validate the current step before allowing the user to continue.

Support:

- Required fields
- Email format
- Number validation
- Custom validation

Example:

```text
Email *
[invalid-email]

Please enter a valid email address.

                         [Next]
```

Do not validate future steps until the user reaches them.

### 4. Form state

Maintain a single form state:

```ts
type FormValues = Record<string, unknown>
```

Example:

```ts
{
  name: "John",
  email: "john@example.com",
  country: "India",
  city: "Hyderabad"
}
```

Changing steps must not reset the form state.

### 5. Step indicator

The step indicator should distinguish:

```text
✓ Personal Information
✓ Address
● Preferences
○ Review
```

States:

- Completed
- Current
- Upcoming
- Invalid

### 6. Direct step navigation

Allow clicking completed steps.

For example:

```text
✓ Personal → ✓ Address → ● Preferences → ○ Review
```

The user can click **Personal** or **Address** to go back.

Do not allow skipping directly to an uncompleted future step unless explicitly configured.

Support:

```tsx
allowStepNavigation?: boolean;
```

### 7. Review step

The final step should display all collected values:

```text
Review

Personal Information
Name: John
Email: john@example.com

Address
Country: India
City: Hyderabad
ZIP: 500001

Preferences
Newsletter: Yes

[Edit]                         [Submit]
```

Clicking **Edit** should take the user back to the relevant step.

### 8. Submit

Expose:

```tsx
onSubmit?: (values: FormValues) => void | Promise<void>;
```

On submit:

```text
Submitting...
```

Prevent duplicate submissions while the request is pending.

After success:

```text
✓ Form submitted successfully
```

Handle submission errors:

```text
Unable to submit the form. Please try again.
```

### 9. Async validation

Support asynchronous validation for fields.

Example:

```ts
validate?: (
  value: unknown,
  values: FormValues
) => string | undefined | Promise<string | undefined>;
```

Example use case:

```text
Username
[john123]

Checking availability...
```

Do not allow the user to proceed while async validation is still running.

### 10. Conditional steps

Support optional steps based on form values.

Example:

```text
Do you own a business?
( ) Yes
( ) No

If Yes:
Step 3: Business Information
```

A step can define:

```ts
condition?: (values: FormValues) => boolean;
```

Hidden steps should:

- Not appear in the step indicator.
- Not be navigable.
- Not be validated.
- Be skipped during Next/Back navigation.

### 11. Conditional fields

Fields can also depend on other values.

Example:

```text
Country
[India ▼]

State
[Telangana ▼]

Are you employed?
( ) Yes
( ) No

Company Name
[____________]
```

`Company Name` should only appear when `Are you employed? === "Yes"`.

### 12. Save progress

Persist the current form state to `localStorage`.

On page reload:

```text
Continue your saved form?

[Resume] [Start Over]
```

Persist:

- Form values
- Current step
- Relevant completed-step state

### 13. Reset

Provide:

```text
[Start Over]
```

which clears:

- Form values
- Validation errors
- Current step
- Saved progress

Ask for confirmation before resetting if the form contains data.

### 14. Controlled / uncontrolled usage

Support uncontrolled usage:

```tsx
<MultiStepForm steps={steps} onSubmit={handleSubmit} />
```

And controlled current-step usage:

```tsx
<MultiStepForm
  steps={steps}
  currentStep={currentStep}
  onStepChange={setCurrentStep}
  onSubmit={handleSubmit}
/>
```

### 15. API

Expose a reusable API:

```tsx
<MultiStepForm
  steps={steps}
  initialValues={{
    name: '',
    email: '',
  }}
  onSubmit={async (values) => {
    await saveUser(values)
  }}
  onStepChange={(step) => {
    console.log(step)
  }}
/>
```

### 16. Accessibility

Support:

- Proper `<form>` semantics
- Labels associated with inputs
- Keyboard navigation
- Accessible step indicator
- `aria-current="step"` for the current step
- `aria-invalid` for invalid fields
- Error messages associated with their inputs
- Focus the first invalid field after validation fails

### 17. Browser navigation

Support optional:

```tsx
persistStepInUrl
```

When enabled:

```text
/signup?step=2
```

The browser Back/Forward buttons should navigate between previously visited steps without losing form data.

### 18. Responsive UI

Desktop:

```text
┌─────────────────────────────────────────┐
│ 1 Personal → 2 Address → 3 Review      │
├─────────────────────────────────────────┤
│                                         │
│ Name                                    │
│ [________________________]              │
│                                         │
│ Email                                   │
│ [________________________]              │
│                                         │
│ [Back]                         [Next]    │
└─────────────────────────────────────────┘
```

Mobile should stack the step indicator and form content appropriately.

### 19. Performance

- Avoid re-rendering unrelated steps unnecessarily.
- Do not mount every step's form fields simultaneously if unnecessary.
- Keep validation logic isolated per step.
- Use `useMemo`, `useCallback`, or context selectively where useful.

### 20. Sample configuration

```ts
const steps: Step[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    fields: [
      {
        id: 'name',
        name: 'name',
        type: 'text',
        label: 'Name',
        required: true,
      },
      {
        id: 'email',
        name: 'email',
        type: 'email',
        label: 'Email',
        required: true,
      },
    ],
  },
  {
    id: 'address',
    title: 'Address',
    fields: [
      {
        id: 'country',
        name: 'country',
        type: 'select',
        label: 'Country',
        required: true,
        options: ['India', 'USA', 'UK'],
      },
      {
        id: 'city',
        name: 'city',
        type: 'text',
        label: 'City',
        required: true,
      },
    ],
  },
  {
    id: 'preferences',
    title: 'Preferences',
    fields: [
      {
        id: 'newsletter',
        name: 'newsletter',
        type: 'checkbox',
        label: 'Subscribe to newsletter',
      },
    ],
  },
]
```

### Constraints

- React + TypeScript
- No form-management library
- No external wizard/stepper library
- Use React state/context/reducer
- Immutable state updates
- Support arbitrary number of steps
- Preserve values when navigating
- Validation must happen before advancing
- Support async submission and validation
- Keep step navigation, validation, persistence, and rendering modular

### Bonus requirement

Add **Undo/Redo for form values**:

```text
[Undo] [Redo]
```

It should restore previous form states without affecting the current step.
