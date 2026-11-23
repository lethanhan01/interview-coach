import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'jest-axe'
import { z } from 'zod'
import {
  Badge,
  Box,
  Button,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { render, screen, userEvent } from '@test-utils'

const smokeSchema = z.object({
  roleTitle: z.string().trim().min(3, 'Vị trí ứng tuyển cần ít nhất 3 ký tự'),
})

type SmokeValues = z.infer<typeof smokeSchema>

function SmokeInterviewForm({
  onValidSubmit,
}: {
  onValidSubmit: (values: SmokeValues) => void
}) {
  const [submittedRole, setSubmittedRole] = useState<string | null>(null)

  const form = useForm<SmokeValues>({
    mode: 'uncontrolled',
    initialValues: { roleTitle: '' },
    validate: schemaResolver(smokeSchema, { sync: true }),
  })

  return (
    <Paper withBorder radius="md" p="md">
      <Box
        component="form"
        noValidate
        onSubmit={form.onSubmit((values) => {
          setSubmittedRole(values.roleTitle)
          onValidSubmit(values)
        })}
      >
        <Stack gap="sm">
          <Title order={2}>Thiết lập phiên phỏng vấn</Title>
          <Text c="dimmed" size="sm">
            Nhập vị trí ứng tuyển để kiểm tra Mantine v9 và Zod v4.
          </Text>
          <TextInput
            label="Vị trí ứng tuyển"
            placeholder="Ví dụ: Backend Engineer"
            key={form.key('roleTitle')}
            {...form.getInputProps('roleTitle')}
          />
          <Button type="submit" color="brand">
            Bắt đầu
          </Button>
          {submittedRole ? (
            <Badge color="success" variant="light">
              Đã sẵn sàng: {submittedRole}
            </Badge>
          ) : null}
        </Stack>
      </Box>
    </Paper>
  )
}

describe('Mantine v9 + @test-utils setup smoke test', () => {
  it('renders Mantine primitives, validates with @mantine/form + Zod v4, and handles user interaction', async () => {
    const user = userEvent.setup()
    const handleValidSubmit = vi.fn()

    render(<SmokeInterviewForm onValidSubmit={handleValidSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Bắt đầu' }))
    expect(
      await screen.findByText('Vị trí ứng tuyển cần ít nhất 3 ký tự')
    ).toBeInTheDocument()
    expect(handleValidSubmit).not.toHaveBeenCalled()

    await user.type(
      screen.getByLabelText('Vị trí ứng tuyển'),
      'Frontend Engineer'
    )
    await user.click(screen.getByRole('button', { name: 'Bắt đầu' }))

    expect(handleValidSubmit).toHaveBeenCalledWith({
      roleTitle: 'Frontend Engineer',
    })
    expect(
      await screen.findByText('Đã sẵn sàng: Frontend Engineer')
    ).toBeInTheDocument()
  })

  it('has no jest-axe accessibility violations', async () => {
    const { container } = render(<SmokeInterviewForm onValidSubmit={vi.fn()} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
