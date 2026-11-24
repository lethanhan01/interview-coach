'use client'

import {
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import { evaluatePasswordStrength } from './auth-schemas'

export interface PasswordStrengthMeterProps {
  password: string
}

export function PasswordStrengthMeter({
  password,
}: Readonly<PasswordStrengthMeterProps>) {
  const strength = evaluatePasswordStrength(password)

  return (
    <Stack gap={6}>
      <Group justify="space-between" gap="xs">
        <Text size="xs" c="dimmed">
          Độ mạnh mật khẩu
        </Text>
        <Text
          size="xs"
          fw={600}
          c={password.length === 0 ? 'dimmed' : strength.color}
        >
          {strength.label}
        </Text>
      </Group>

      <Progress
        value={strength.score}
        color={strength.color}
        size="sm"
        radius="xl"
        aria-label="Độ mạnh mật khẩu"
      />

      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing={4}>
        {strength.checks.map((item) => (
          <Group key={item.key} gap={6} wrap="nowrap">
            <ThemeIcon
              color={item.met ? 'success' : 'neutral'}
              variant="transparent"
              size={16}
            >
              {item.met ? (
                <IconCheck size={14} stroke={1.5} aria-hidden="true" />
              ) : (
                <IconX size={14} stroke={1.5} aria-hidden="true" />
              )}
            </ThemeIcon>
            <Text size="xs" c={item.met ? 'success' : 'dimmed'}>
              {item.label}
            </Text>
          </Group>
        ))}
      </SimpleGrid>
    </Stack>
  )
}
