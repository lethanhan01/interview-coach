'use client'

import { Box, Group, Paper, Stack, Text } from '@mantine/core'
import { IconVolume } from '@tabler/icons-react'
import type { WaveLevel } from './useVoiceRecorder'
import classes from './VoiceWaveform.module.css'

export interface VoiceWaveformProps {
  levels: WaveLevel[]
  statusText?: string
}

export default function VoiceWaveform({
  levels,
  statusText = 'Đang lắng nghe câu trả lời trực tiếp...',
}: Readonly<VoiceWaveformProps>) {
  return (
    <Stack gap="xs" align="center" w="100%">
      <Group gap="xs" align="center">
        <Box className={classes.recordingDot} aria-hidden="true" />
        <Text size="sm" fw={500}>
          {statusText}
        </Text>
      </Group>

      <Paper
        withBorder
        radius="lg"
        px="lg"
        py="sm"
        className={classes.waveformBox}
        role="img"
        aria-label="Biểu đồ sóng âm microphone"
      >
        <IconVolume size={20} stroke={1.5} aria-hidden="true" />
        {levels.map((level, idx) => (
          <Box
            key={`waveform-bar-${idx}`}
            className={classes.bar}
            mod={{ level }}
          />
        ))}
      </Paper>
    </Stack>
  )
}
