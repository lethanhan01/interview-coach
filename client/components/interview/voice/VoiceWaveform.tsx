'use client'

import { Box, Group, Paper, Stack, Text } from '@mantine/core'
import { IconVolume } from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import interview from '../interview.module.css'
import type { WaveLevel } from './useVoiceRecorder'

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
        <Box className={interview.recordingDot} aria-hidden="true" />
        <Text size="sm" fw={500}>
          {statusText}
        </Text>
      </Group>

      <Paper
        withBorder
        radius="lg"
        px="lg"
        py="sm"
        className={`${surfaces.subtleSurface} ${interview.waveformBox}`}
        role="img"
        aria-label="Biểu đồ sóng âm microphone"
      >
        <IconVolume size={20} stroke={1.5} aria-hidden="true" />
        {levels.map((level, idx) => (
          <Box
            key={`waveform-bar-${idx}`}
            className={interview.waveformBar}
            mod={{ level }}
          />
        ))}
      </Paper>
    </Stack>
  )
}
