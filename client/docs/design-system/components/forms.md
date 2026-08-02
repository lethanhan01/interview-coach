# Form System

Hệ thống form của dự án được xây dựng theo **3-layer architecture**, phân tách rõ ràng UI primitive, form composition, và form library adapter.

## Kiến trúc tổng quan

```
Layer 1: UI Primitives         components/ui/
          ↓ (no dependency)
Layer 2: Form Composition      components/form/
          ↓ (adapter pattern)
Layer 3: RHF Adapter          components/ui/form-adapters/
```

### Nguyên tắc thiết kế

- **UI Primitives không biết về form libraries** — `Input`, `Textarea`, `Checkbox`... chỉ là HTML wrappers với styling và aria passthrough.
- **Form Composition không phụ thuộc RHF** — `FormField`, `FormControl`... chỉ dùng React Context.
- **RHF Adapter là lớp mỏng nhất** — chỉ kết nối `Controller` với `FormField` context.

---

## Layer 1: UI Primitives

### Input

```tsx
import { Input } from '@/components/ui/Input'

// Basic
<Input placeholder="Enter text..." />

// With leading icon
<Input leadingIcon={<Mail className="h-4 w-4" />} placeholder="Email..." />

// With trailing action (e.g., show/hide password)
<Input
  type="password"
  trailingAction={
    <button type="button" onClick={toggle} aria-label="Show password">
      <Eye className="h-4 w-4" />
    </button>
  }
/>

// Disabled
<Input disabled placeholder="Disabled field" />

// Read-only (visually distinct from disabled)
<Input readOnly value="Read-only value" />

// Invalid (aria-invalid injected by FormControl, or manually)
<Input aria-invalid="true" aria-describedby="field-error" />
```

**States:** default · disabled · readOnly · invalid · required
**Props added:** `leadingIcon`, `trailingAction`
**Props removed:** `label`, `error`, `hint` (moved to FormField layer)

---

### Textarea

```tsx
import { Textarea } from '@/components/ui/Textarea'

// With character counter
;<Textarea
  charCount={text.length}
  maxChars={200}
  value={text}
  onChange={(e) => setText(e.target.value)}
/>
```

Same props as Input, plus `charCount` / `maxChars` for character counting UX.

---

### Label

```tsx
import { Label } from '@/components/ui/Label'

// Basic — always link with htmlFor
<Label htmlFor="field-id">Email address</Label>

// Required indicator (visual asterisk)
<Label htmlFor="field-id" required>
  Full Name
</Label>

// Disabled state
<Label htmlFor="field-id" disabled>
  Disabled label
</Label>
```

Built on `@radix-ui/react-label`. Never use `<label>` directly — always use `<Label>`.

---

### Checkbox

```tsx
import { Checkbox } from '@/components/ui/Checkbox'
import { Label } from '@/components/ui/Label'

// Always pair with Label
<div className="flex items-center gap-2">
  <Checkbox id="accept-terms" />
  <Label htmlFor="accept-terms">Accept terms</Label>
</div>

// Indeterminate
<Checkbox indeterminate />

// Controlled
<Checkbox checked={checked} onCheckedChange={setChecked} />
```

Keyboard: **Space** to toggle. Built on `@radix-ui/react-checkbox`.

---

### RadioGroup

```tsx
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Label } from '@/components/ui/Label'

;<RadioGroup value={value} onValueChange={setValue} aria-label="Choose size">
  {['small', 'medium', 'large'].map((size) => (
    <div key={size} className="flex items-center gap-2">
      <RadioGroupItem value={size} id={`size-${size}`} />
      <Label htmlFor={`size-${size}`}>{size}</Label>
    </div>
  ))}
</RadioGroup>
```

Keyboard: **Arrow keys** to navigate, **Space/Enter** to select. Built on `@radix-ui/react-radio-group`.

---

### Switch

```tsx
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'

;<div className="flex items-center gap-2">
  <Switch id="notifications" checked={on} onCheckedChange={setOn} />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>
```

Keyboard: **Space** to toggle. Use for binary states that take effect immediately.
Unlike Checkbox, Switch does NOT require form submission — it's an instant action control.

---

### Select

```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectSeparator,
} from '@/components/ui/Select'

;<Select value={value} onValueChange={setValue}>
  <SelectTrigger aria-label="Choose country">
    <SelectValue placeholder="Select a country..." />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Asia</SelectLabel>
      <SelectItem value="vn">Vietnam</SelectItem>
      <SelectItem value="jp">Japan</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectItem value="us">United States</SelectItem>
  </SelectContent>
</Select>
```

Full keyboard navigation. Built on `@radix-ui/react-select`.

---

### Combobox

```tsx
import { Combobox } from '@/components/ui/Combobox'

const options = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular', disabled: true },
]

<Combobox
  options={options}
  value={value}
  onValueChange={setValue}
  placeholder="Select a framework..."
  searchPlaceholder="Search frameworks..."
  emptyText="No frameworks found."
/>
```

Searchable dropdown. Keyboard: **Enter** to open, **Arrow keys** to navigate, **Escape** to close, type to filter. Built on `@radix-ui/react-popover` + `cmdk`.

---

## Layer 2: Form Composition

### FormField + Sub-components

```tsx
import {
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/form'

;<FormField
  name="email"
  isRequired
  isInvalid={!!error}
  isDisabled={false}
  isReadOnly={false}
>
  <FormLabel>Email Address</FormLabel>
  <FormControl>
    <Input type="email" placeholder="you@example.com" />
  </FormControl>
  <FormDescription>We'll never share your email.</FormDescription>
  <FormMessage>{error?.message}</FormMessage>
</FormField>
```

**Accessible relationships established automatically:**

| FormField prop | Effect on child                                                                  |
| -------------- | -------------------------------------------------------------------------------- |
| `id` (auto)    | `FormLabel` gets `htmlFor={id}`, `FormControl` child gets `id={id}`              |
| `isInvalid`    | Child gets `aria-invalid="true"`, `FormMessage` is linked via `aria-describedby` |
| `isRequired`   | `FormLabel` shows `*` indicator, child gets `aria-required="true"`               |
| `isDisabled`   | `FormLabel` reduces opacity, child gets `disabled`                               |
| `isReadOnly`   | Child gets `readOnly`                                                            |

### FormSection

```tsx
import { FormSection } from '@/components/form'

;<FormSection
  title="Personal Information"
  description="Tell us about yourself."
  divider
>
  <FormField name="name">...</FormField>
  <FormField name="email">...</FormField>
</FormSection>
```

---

## Layer 3: React Hook Form Adapter

### Full RHF pattern (recommended)

```tsx
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/form'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('Invalid email'),
})

function MyForm() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(console.log)} noValidate>
      {/* Simple fields: use register() */}
      <FormField name="email" isRequired isInvalid={!!errors.email}>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input type="email" {...register('email')} />
        </FormControl>
        <FormMessage>{errors.email?.message}</FormMessage>
      </FormField>

      {/* Complex fields: use Controller */}
      <Controller
        control={control}
        name="role"
        render={({ field, fieldState }) => (
          <FormField name="role" isInvalid={!!fieldState.error} isRequired>
            <FormLabel>Role</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engineer">Engineer</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormField>
        )}
      />

      <Button type="submit">Submit</Button>
    </form>
  )
}
```

---

## Accessibility Checklist

| Requirement                          | Implementation                                                  |
| ------------------------------------ | --------------------------------------------------------------- |
| Label uses `htmlFor`                 | ✅ `FormLabel` auto-derives from FormField id                   |
| Error linked via `aria-describedby`  | ✅ `FormControl` injects `{id}-description {id}-message`        |
| Invalid state has `aria-invalid`     | ✅ `FormControl` injects `aria-invalid="true"` when `isInvalid` |
| Placeholder does not replace label   | ✅ Label and placeholder are separate concerns                  |
| Disabled state clear                 | ✅ `opacity-50 cursor-not-allowed`                              |
| Read-only distinct from disabled     | ✅ `bg-muted cursor-default` (no opacity reduction)             |
| Focus ring consistent                | ✅ `focus-visible:ring-ring` across all controls                |
| Error not color-only                 | ✅ `FormMessage` shows XCircle icon + text                      |
| Checkbox/Radio keyboard accessible   | ✅ Radix UI manages Space/Arrow keys                            |
| Select/Combobox accessible primitive | ✅ Radix UI + cmdk                                              |
| No layout shift from errors          | ✅ `FormMessage` renders nothing when no error                  |
| Dark theme support                   | ✅ Semantic tokens auto-adapt                                   |

---

## Migration Guide: Old Input/Textarea

If you have existing code using the old `label`/`error`/`hint` props:

```tsx
// ❌ Old pattern (no longer supported)
<Input label="Email" error={errors.email} hint="Enter your email" />

// ✅ New pattern
<FormField name="email" isInvalid={!!errors.email}>
  <FormLabel>Email</FormLabel>
  <FormControl>
    <Input type="email" />
  </FormControl>
  <FormDescription>Enter your email</FormDescription>
  <FormMessage>{errors.email?.message}</FormMessage>
</FormField>
```

### Files already migrated

- `components/auth/RegisterForm.tsx`
- `components/setup/JdForm.tsx`

---

## File Structure

```
components/
├── ui/
│   ├── Input.tsx              # Pure input primitive
│   ├── Textarea.tsx           # Pure textarea primitive
│   ├── Label.tsx              # Radix Label wrapper
│   ├── Checkbox.tsx           # Radix Checkbox
│   ├── RadioGroup.tsx         # Radix RadioGroup + RadioGroupItem
│   ├── Switch.tsx             # Radix Switch
│   ├── Select.tsx             # Radix Select + sub-components
│   ├── Combobox.tsx           # Popover + cmdk searchable select
│   ├── CompleteFormExample.stories.tsx
│   └── form-adapters/
│       └── rhf-form-field.tsx # Form, RHFFormField, useFormField
└── form/
    ├── FormField.tsx          # FormField, FormLabel, FormControl,
    │                          # FormDescription, FormMessage
    ├── FormSection.tsx        # Section layout wrapper
    └── index.ts               # Public barrel export
```
