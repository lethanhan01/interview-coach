'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Switch } from '@/components/ui/Switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import { Combobox } from '@/components/ui/Combobox'
import {
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormSection,
} from '@/components/form'

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  bio: z.string().max(200, 'Bio must be 200 characters or less').optional(),
  role: z.string().min(1, 'Please select a role'),
  country: z.string().min(1, 'Please select a country'),
  experienceLevel: z
    .enum(['junior', 'mid', 'senior'])
    .refine(
      (v): v is 'junior' | 'mid' | 'senior' =>
        ['junior', 'mid', 'senior'].includes(v),
      { message: 'Please select your experience level' }
    )
    .or(
      z
        .literal('')
        .refine(() => false, { message: 'Please select your experience level' })
    ),

  receiveUpdates: z.boolean().optional(),
  publicProfile: z.boolean().optional(),
  agreeToTerms: z.boolean().refine((v) => v === true, {
    message: 'You must agree to the terms',
  }),
})

type FormValues = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Countries option for Combobox
// ---------------------------------------------------------------------------

const COUNTRIES = [
  { value: 'vn', label: 'Vietnam' },
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'jp', label: 'Japan' },
  { value: 'sg', label: 'Singapore' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
]

// ---------------------------------------------------------------------------
// CompleteForm component
// ---------------------------------------------------------------------------

interface CompleteFormProps {
  variant: 'normal' | 'errors' | 'disabled' | 'readOnly' | 'loading'
}

function CompleteForm({ variant }: CompleteFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const isDisabled = variant === 'disabled'
  const isReadOnly = variant === 'readOnly'
  const isLoading = variant === 'loading'

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    // Pre-fill errors variant with invalid values to trigger errors immediately
    defaultValues:
      variant === 'errors'
        ? {
            fullName: 'A',
            email: 'not-an-email',
            password: 'short',
            bio: '',
            role: '',
            country: '',
            experienceLevel: undefined,
            receiveUpdates: false,
            publicProfile: false,
            agreeToTerms: false,
          }
        : variant === 'readOnly' || variant === 'disabled'
          ? {
              fullName: 'Nguyen Van A',
              email: 'nguyen@example.com',
              password: 'password123',
              bio: 'Software engineer passionate about building great products.',
              role: 'engineer',
              country: 'vn',
              experienceLevel: 'mid',
              receiveUpdates: true,
              publicProfile: true,
              agreeToTerms: true,
            }
          : {
              fullName: '',
              email: '',
              password: '',
              bio: '',
              role: '',
              country: '',
              receiveUpdates: false,
              publicProfile: false,
              agreeToTerms: false,
            },
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    trigger,
  } = form

  // Immediately validate the "errors" variant
  const [hasTriggered, setHasTriggered] = useState(false)
  if (variant === 'errors' && !hasTriggered) {
    setHasTriggered(true)
    // Run validation after mount
    Promise.resolve().then(() => trigger())
  }

  const onSubmit = async (data: FormValues) => {
    await new Promise((r) => setTimeout(r, isLoading ? 99999 : 1000))
    console.log('Form submitted:', data)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-surface rounded-xl border p-8 text-center">
        <p className="text-foreground text-lg font-semibold">
          ✅ Form submitted successfully!
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          onClick={() => setSubmitted(false)}
        >
          Reset
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      {/* ---------------------------------------------------------------- */}
      {/* Section 1: Personal Information                                  */}
      {/* ---------------------------------------------------------------- */}
      <FormSection
        title="Personal Information"
        description="Tell us a little about yourself."
      >
        {/* Full Name */}
        <FormField
          name="fullName"
          isInvalid={!!errors.fullName}
          isRequired
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
        >
          <FormLabel>Full Name</FormLabel>
          <FormControl>
            <Input
              leadingIcon={<User className="h-4 w-4" />}
              placeholder="Nguyen Van A"
              {...register('fullName')}
              readOnly={isReadOnly}
              disabled={isDisabled}
            />
          </FormControl>
          <FormDescription>
            Your display name across the platform.
          </FormDescription>
          <FormMessage>{errors.fullName?.message}</FormMessage>
        </FormField>

        {/* Email */}
        <FormField
          name="email"
          isInvalid={!!errors.email}
          isRequired
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
        >
          <FormLabel>Email Address</FormLabel>
          <FormControl>
            <Input
              type="email"
              leadingIcon={<Mail className="h-4 w-4" />}
              placeholder="you@example.com"
              {...register('email')}
              readOnly={isReadOnly}
              disabled={isDisabled}
            />
          </FormControl>
          <FormDescription>
            We&apos;ll never share your email with anyone else.
          </FormDescription>
          <FormMessage>{errors.email?.message}</FormMessage>
        </FormField>

        {/* Password */}
        <FormField
          name="password"
          isInvalid={!!errors.password}
          isRequired
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
        >
          <FormLabel>Password</FormLabel>
          <FormControl>
            <Input
              type={showPassword ? 'text' : 'password'}
              leadingIcon={<Lock className="h-4 w-4" />}
              trailingAction={
                !isDisabled && !isReadOnly ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="text-muted-foreground hover:text-foreground mr-1 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                ) : undefined
              }
              placeholder="At least 8 characters"
              {...register('password')}
              readOnly={isReadOnly}
              disabled={isDisabled}
            />
          </FormControl>
          <FormDescription>
            Minimum 8 characters. Use a mix of letters and numbers.
          </FormDescription>
          <FormMessage>{errors.password?.message}</FormMessage>
        </FormField>

        {/* Bio (Textarea with character count) */}
        <FormField
          name="bio"
          isInvalid={!!errors.bio}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
        >
          <FormLabel>Bio</FormLabel>
          <FormControl>
            <Controller
              control={control}
              name="bio"
              render={({ field }) => (
                <Textarea
                  placeholder="Tell us about yourself..."
                  charCount={field.value?.length ?? 0}
                  maxChars={200}
                  rows={3}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                  }}
                  readOnly={isReadOnly}
                  disabled={isDisabled}
                />
              )}
            />
          </FormControl>
          <FormMessage>{errors.bio?.message}</FormMessage>
        </FormField>
      </FormSection>

      {/* ---------------------------------------------------------------- */}
      {/* Section 2: Professional Details                                  */}
      {/* ---------------------------------------------------------------- */}
      <FormSection
        title="Professional Details"
        description="Help us match you with the right opportunities."
        divider
      >
        {/* Role (Select) */}
        <FormField
          name="role"
          isInvalid={!!errors.role}
          isRequired
          isDisabled={isDisabled}
        >
          <FormLabel>Role</FormLabel>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isDisabled}
              >
                <SelectTrigger
                  aria-invalid={!!errors.role}
                  aria-describedby={errors.role ? 'role-message' : undefined}
                >
                  <SelectValue placeholder="Select your role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineer">Software Engineer</SelectItem>
                  <SelectItem value="designer">Product Designer</SelectItem>
                  <SelectItem value="pm">Product Manager</SelectItem>
                  <SelectItem value="data">Data Scientist</SelectItem>
                  <SelectItem value="devops">DevOps Engineer</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FormDescription>Your current or target role.</FormDescription>
          <FormMessage>{errors.role?.message}</FormMessage>
        </FormField>

        {/* Country (Combobox) */}
        <FormField
          name="country"
          isInvalid={!!errors.country}
          isRequired
          isDisabled={isDisabled}
        >
          <FormLabel>Country</FormLabel>
          <Controller
            control={control}
            name="country"
            render={({ field }) => (
              <Combobox
                options={COUNTRIES}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Select a country..."
                searchPlaceholder="Search countries..."
                emptyText="No countries found."
                disabled={isDisabled}
                aria-invalid={!!errors.country}
              />
            )}
          />
          <FormMessage>{errors.country?.message}</FormMessage>
        </FormField>

        {/* Experience Level (RadioGroup) */}
        <FormField
          name="experienceLevel"
          isInvalid={!!errors.experienceLevel}
          isRequired
          isDisabled={isDisabled}
        >
          <FormLabel>Experience Level</FormLabel>
          <Controller
            control={control}
            name="experienceLevel"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                disabled={isDisabled}
                aria-invalid={!!errors.experienceLevel}
                aria-label="Experience Level"
              >
                {[
                  { value: 'junior', label: 'Junior (0–2 years)' },
                  { value: 'mid', label: 'Mid-level (2–5 years)' },
                  { value: 'senior', label: 'Senior (5+ years)' },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={opt.value}
                      id={`exp-${opt.value}`}
                      disabled={isDisabled}
                    />
                    <Label htmlFor={`exp-${opt.value}`} disabled={isDisabled}>
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
          <FormMessage>{errors.experienceLevel?.message}</FormMessage>
        </FormField>
      </FormSection>

      {/* ---------------------------------------------------------------- */}
      {/* Section 3: Preferences                                           */}
      {/* ---------------------------------------------------------------- */}
      <FormSection
        title="Preferences"
        description="Control your account settings."
        divider
      >
        {/* Receive Updates (Switch) */}
        <Controller
          control={control}
          name="receiveUpdates"
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="receive-updates" disabled={isDisabled}>
                  Receive product updates
                </Label>
                <p className="text-muted-foreground text-xs">
                  Get notified about new features and improvements.
                </p>
              </div>
              <Switch
                id="receive-updates"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isDisabled}
              />
            </div>
          )}
        />

        {/* Public Profile (Switch) */}
        <Controller
          control={control}
          name="publicProfile"
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="public-profile" disabled={isDisabled}>
                  Public profile
                </Label>
                <p className="text-muted-foreground text-xs">
                  Allow others to find and view your profile.
                </p>
              </div>
              <Switch
                id="public-profile"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isDisabled}
              />
            </div>
          )}
        />
      </FormSection>

      {/* ---------------------------------------------------------------- */}
      {/* Terms & Conditions (Checkbox)                                    */}
      {/* ---------------------------------------------------------------- */}
      <FormField
        name="agreeToTerms"
        isInvalid={!!errors.agreeToTerms}
        isRequired
        isDisabled={isDisabled}
      >
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="agreeToTerms"
            render={({ field }) => (
              <Checkbox
                id="agree-to-terms"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isDisabled}
                aria-invalid={!!errors.agreeToTerms}
                aria-describedby={
                  errors.agreeToTerms ? 'agree-to-terms-message' : undefined
                }
                className="mt-0.5"
              />
            )}
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="agree-to-terms" required disabled={isDisabled}>
              I agree to the Terms of Service and Privacy Policy
            </Label>
            <FormMessage>{errors.agreeToTerms?.message}</FormMessage>
          </div>
        </div>
      </FormField>

      {/* Submit */}
      <Button
        type="submit"
        loading={isSubmitting || isLoading}
        disabled={isDisabled}
        className="w-full"
      >
        {isLoading ? 'Submitting...' : 'Create Account'}
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Patterns/Form/Complete Form',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A comprehensive form demonstrating the complete form system:

**3-Layer Architecture:**
- **UI Primitives** (\`Input\`, \`Textarea\`, \`Label\`, \`Checkbox\`, \`RadioGroup\`, \`Switch\`, \`Select\`, \`Combobox\`) — no form library dependency
- **Form Composition** (\`FormField\`, \`FormLabel\`, \`FormControl\`, \`FormDescription\`, \`FormMessage\`, \`FormSection\`) — manages accessible relationships
- **RHF Adapter** (\`Controller\`, \`useFormContext\`) — React Hook Form integration via Zod schema

**Accessibility features:**
- Label linked to control via \`htmlFor\` → \`id\`
- Error linked via \`aria-describedby\` → FormMessage id
- Invalid state via \`aria-invalid="true"\`
- Error shown with icon + text (not color alone)
- Read-only visually distinct from disabled
- All controls keyboard accessible
        `,
      },
    },
  },
}

export default meta

// ---------------------------------------------------------------------------
// Stories — all 5 states as named exports
// ---------------------------------------------------------------------------

export const Normal: StoryObj = {
  name: '1. Normal',
  render: () => (
    <div className="mx-auto max-w-lg">
      <h2 className="text-foreground mb-6 text-xl font-bold">Create Account</h2>
      <CompleteForm variant="normal" />
    </div>
  ),
}

export const WithValidationErrors: StoryObj = {
  name: '2. Validation Errors',
  render: () => (
    <div className="mx-auto max-w-lg">
      <h2 className="text-foreground mb-2 text-xl font-bold">Create Account</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Submit triggered — showing all field errors
      </p>
      <CompleteForm variant="errors" />
    </div>
  ),
}

export const DisabledForm: StoryObj = {
  name: '3. Disabled Form',
  render: () => (
    <div className="mx-auto max-w-lg">
      <h2 className="text-foreground mb-2 text-xl font-bold">Create Account</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        All fields disabled — note reduced opacity and blocked interaction
      </p>
      <CompleteForm variant="disabled" />
    </div>
  ),
}

export const ReadOnlyForm: StoryObj = {
  name: '4. Read-Only Form',
  render: () => (
    <div className="mx-auto max-w-lg">
      <h2 className="text-foreground mb-2 text-xl font-bold">
        Account Details
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Read-only mode — fields have muted background, cursor is default (not
        not-allowed)
      </p>
      <CompleteForm variant="readOnly" />
    </div>
  ),
}

export const LoadingSubmit: StoryObj = {
  name: '5. Loading Submit',
  render: () => (
    <div className="mx-auto max-w-lg">
      <h2 className="text-foreground mb-2 text-xl font-bold">Create Account</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Submit button shows loading spinner — form is still accessible
      </p>
      <CompleteForm variant="loading" />
    </div>
  ),
}
