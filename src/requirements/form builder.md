# Machine Coding: Form Builder

Build a **dynamic Form Builder** in React + TypeScript that allows users to create, configure, reorder, and preview forms.

### 1. Field types

Support these field types:

```ts
type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
```

Each field should have:

```ts
type FormField = {
  id: string
  type: FieldType
  label: string
  name: string
  placeholder?: string
  required?: boolean
  options?: string[]
  defaultValue?: string | number | boolean
}
```

### 2. Builder layout

Create a 3-panel layout:

```text
┌──────────────┬──────────────────────────┬─────────────────┐
│ Field Types  │       Form Canvas        │ Field Settings  │
│              │                          │                 │
│ Text         │ Name                     │ Label           │
│ Textarea     │ [______________]         │ [Name]          │
│ Number       │                          │                 │
│ Select       │ Email                    │ Required [✓]    │
│ Radio        │ [______________]         │ Placeholder     │
│ Checkbox     │                          │ [...........]    │
│ Date         │                          │                 │
└──────────────┴──────────────────────────┴─────────────────┘
```

### 3. Add fields

Clicking a field type should add a new field to the form.

Example:

```text
Text
Textarea
Select
```

Clicking **Text** should create:

```ts
{
  id: "generated-id",
  type: "text",
  label: "Text Field",
  name: "textField"
}
```

The newly created field should become selected automatically.

### 4. Field selection

- Clicking a field in the canvas selects it.
- Only one field can be selected at a time.
- Selected fields should have a visible outline.
- The settings panel should display the configuration of the selected field.

### 5. Field settings

For the selected field, allow editing:

- Label
- Name
- Placeholder
- Required
- Default value

For `select` and `radio`, allow editing options:

```text
Options

[Option 1] [×]
[Option 2] [×]
[Option 3] [×]

[+ Add Option]
```

Changing settings should immediately update the form canvas.

### 6. Delete fields

Each field should have a delete action.

```text
Name
[______________]       [Delete]
```

Deleting the selected field should remove it from the form.

### 7. Reordering

Allow fields to be reordered using drag and drop.

Example:

```text
Name
Email
Phone
```

Dragging `Phone` above `Name` should produce:

```text
Phone
Name
Email
```

Do not mutate the existing fields array.

### 8. Duplicate

Each field should support:

```text
Duplicate
Delete
```

Duplicating a field should:

- Create a new ID.
- Preserve its configuration.
- Generate a unique `name`.
- Insert the duplicate immediately after the original.

### 9. Preview mode

Provide:

```text
[Builder] [Preview]
```

In preview mode:

- Hide the builder controls.
- Render the actual form.
- Users should be able to interact with the form.
- Validate required fields.
- Show validation errors.
- Submit the form.

Example:

```text
Name *
[____________________]

Email *
[____________________]

Country
[ Select country ▼ ]

☐ Subscribe

[Submit]
```

### 10. Form validation

Support:

- Required fields
- Email validation
- Number validation

Show errors next to the corresponding field.

Example:

```text
Email *
[invalid-email]

Please enter a valid email address.
```

Do not allow submission while validation errors exist.

### 11. Form submission

Expose:

```tsx
onSubmit?: (values: Record<string, unknown>) => void;
```

Example:

```ts
{
  name: "John",
  email: "john@example.com",
  country: "India",
  subscribe: true
}
```

### 12. Conditional visibility

Support optional field conditions.

Example:

```text
Do you have a company?
( ) Yes
( ) No

Company Name
[________________]
```

`Company Name` should only be visible when:

```ts
companyQuestion === 'Yes'
```

Field configuration can contain:

```ts
type Condition = {
  fieldId: string
  operator: 'equals' | 'notEquals'
  value: string
}
```

A field may have:

```ts
condition?: Condition;
```

### 13. Form state

The builder should maintain:

```ts
type FormState = {
  fields: FormField[]
  selectedFieldId: string | null
  mode: 'builder' | 'preview'
}
```

Use React state/reducer. Do not use an external state-management library.

### 14. Persistence

Add:

```text
[Save Form]
[Load Form]
```

Persist the form configuration to `localStorage`.

The saved configuration should contain enough information to completely reconstruct the form.

### 15. Import / Export

Provide:

```text
[Export JSON]
[Import JSON]
```

Export the current form configuration as JSON.

Import should validate the structure before replacing the current form.

### 16. Accessibility

- Every field must have an associated label.
- Keyboard users should be able to select and configure fields.
- Buttons must have accessible names.
- Validation errors should be associated with their inputs.
- Use appropriate semantic form elements.

### 17. Expected API

```tsx
<FormBuilder
  initialFields={fields}
  onChange={(fields) => {
    console.log(fields)
  }}
  onSubmit={(values) => {
    console.log(values)
  }}
/>
```

### 18. Constraints

- React + TypeScript
- No form-builder libraries
- No external drag-and-drop library
- Use native HTML5 drag and drop or pointer events
- Immutable state updates
- Support at least 50 fields
- Keep builder and preview rendering separate
- Avoid duplicating field-specific logic unnecessarily

### Bonus requirement

Support **undo/redo** for builder operations:

```text
[Undo] [Redo]
```

Undo should work for:

- Add
- Delete
- Edit settings
- Reorder
- Duplicate

and should restore the complete previous form configuration.
